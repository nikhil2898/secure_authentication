import sanitize from "mongo-sanitize";
import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { loginSchema, registerSchema } from "../config/zod.js";
import { redisClient } from "../config/redis.js";
import { sendOtpEmail, sendVerifyEmail } from "../services/email.service.js";
import { getVerifyEmailHtml } from "../templates/getVerifyEmailHtml.js";
import { getOtpHtml } from "../templates/getOtpHtml.js";
import { generateAccessToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../utils/generateTokens.js";
import { generateCsrfToken } from "../middlewares/csrfMiddleware.js";


// registering user and preventing them from sql-injection and storing in cache for temporary 
export const register = async(req,res) => {

    const santizedBody = sanitize(req.body);
    const validation = registerSchema.safeParse(santizedBody);
    
    if(!validation.success) {
        const zodError = validation.error;

        let firstErrorMessage = "Validation Error";
        let allErrors = [];

        if(zodError?.issues && Array.isArray(zodError.issues)){
            allErrors = zodError.issues.map((issue) => ({
                field : issue.path ? issue.path.join(".") : "unknown",
                message : issue.message || "Validation Error",
                code : issue.code
            }))

            firstErrorMessage = allErrors[0]?.message || "validation error"
        }


        return res.status(400).json({
            // message : zodError,
            error : allErrors
        })
    }

    const { name, email, password } = validation.data;

    const rateLimitKey = `register-rate-limit ${req.ip}:${email}`;

    if(await redisClient.get(rateLimitKey)) {
        return res.status(429).json({
            message : "Too many requests, try again later"
        })
    }

    const userExists = await userModel.findOne({email});

    if(userExists) {
        return res.status(400).json({
            message : "User Already Exists"
        })
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const verifyToken = crypto.randomBytes(32).toString("hex");

    const verifyKey = `verify:${verifyToken}`

    const dataToStore = JSON.stringify({
        name,
        email,
        password : hashedPassword
    })


    await redisClient.set(verifyKey, dataToStore, { EX : 300 });  //Expire in 5 min

    const html = getVerifyEmailHtml({email, token : verifyToken })

    await sendVerifyEmail(email,html);

    await redisClient.set(rateLimitKey, "true", { EX : 60 });      //Expire in 1 min



    return res.status(200).json({
        message : "If your email is valid, a verification link has been sent. It will expire in 5 min"
    })
}


// after verifying user's email with otp then we are creating their account i.e storing user's data in permanent database
export const verifyUser = async(req,res) => {
    try{
      const {token} = req.params;

    if(!token) {
        return res.status(400).json({
            message : "Verification token is required"
        })
    }

    
    const verifyKey = `verify:${token}`;

    const userDataJson = await redisClient.get(verifyKey);


    if(!userDataJson) {
        return res.status(400).json({
            message : "Verification Link is expired"
        })
    }

   await redisClient.del(verifyKey);

   const userData = JSON.parse(userDataJson);

   const userExists = await userModel.findOne({ email: userData.email });

   if (userExists) {
     return res.status(400).json({
       message: "User already exists",
     });
   }


   const newUser = await userModel.create({
     name: userData.name,
     email: userData.email,
     password: userData.password,
   });


   return res.status(201).json({
    message : "User Verified successfully! Your account has been created",
    user : { 
        _id : newUser._id,
        name : newUser.name,
        email : newUser.email
    }
   })
    } catch(err) {
        return res.status(500).json({
            message : "Internal Server Error"
        })
    }
    
}


// user submit their email and password for login then they get otp for verification if they already have account
export const loginUser = async(req,res) => {

   const sanitizedBody = sanitize(req.body);
   const validation = loginSchema.safeParse(sanitizedBody);

     if(!validation.success) {
        const zodError = validation.error;

        let firstErrorMessage = "Validation Error";
        let allErrors = [];

        if(zodError?.issues && Array.isArray(zodError.issues)){
            allErrors = zodError.issues.map((issue) => ({
                field : issue.path ? issue.path.join(".") : "unknown",
                message : issue.message || "Validation Error",
                code : issue.code
            }))

            firstErrorMessage = allErrors[0]?.message || "validation error"
        }


        return res.status(400).json({
            // message : zodError,
            error : allErrors
        })
   }

    const { email, password } = validation.data;

    const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;

    if (await redisClient.get(rateLimitKey)) {
      return res.status(429).json({
        message: "Too many requests, try again later",
      });
    }

    const userExists = await userModel.findOne({email});

    if(!userExists) {
        return res.status(400).json({
            message : "Invalid Credentials"
        })
    }

    const comparePassword = await bcrypt.compare(password, userExists.password);

    if(!comparePassword) {
        return res.status(400).json({
            message : "Invalid Credentials"
        })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpKey = `otp:${email}`;

    await redisClient.set(otpKey, JSON.stringify(otp), { EX : 300 });     //5 Min

    const html = getOtpHtml({email,otp});

    await sendOtpEmail(email,html);

    await redisClient.set(rateLimitKey, "true", { EX : 60 });     // 1 min

    return res.status(200).json({
        message : "If you email is valid, an OTP is sent to your email. It will expire in 5 min",
    })
}


// if user present they will verify their account with otp for secure logging
export const verifyOtp = async(req,res) => {
    const {email,otp} = req.body;

    if(!email || !otp) {
        return res.status(400).json({
            message : "Please provide all details"
        })
    }

    const otpKey = `otp:${email}`;

    const storedOtp = await redisClient.get(otpKey);

    if(!storedOtp) {
        return res.status(400).json({
            message : "OTP Expired"
        })
    }

    const storedOtpString = JSON.parse(storedOtp);

    if(storedOtpString !== otp) {
        return res.status(400).json({
            message : "Invalid Otp"
        })
    }

    await redisClient.del(otpKey);

    let user = await userModel.findOne({email});

    const tokenData = await generateToken(user._id,res);


    return res.status(200).json({
        message : `Welcome ${user.name}`,
        user,
        sessionInfo : {
            sessionId : tokenData.sessionId,
            loginTime : new Date().toISOString(),
            csrfToken : tokenData.csrfToken
        }
    })
}


// authenticated route 
export const myProfile = async(req,res) => {
    const user = req.user;

    const sessionId = req.sessionId;
    const sessionData = await redisClient.get(`session:${sessionId}`);

    let sessionInfo = null;

    if(sessionData) {
        const parsedData = JSON.parse(sessionData);
        sessionInfo = {
            sessionId,
            loginTime : parsedData.createdAt,
            lastActivity : parsedData.lastActivity
        }
    }
    res.json({user, sessionInfo})
}


// access-token generation using refreshToken which is stored in cookies
export const refreshToken = async(req,res) => {
    

        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return res.status(401).json({
                message : "Invalid Refresh Token"
            })
        }

        const decode = await verifyRefreshToken(refreshToken);

        if(!decode) {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            res.clearCookie("csrfToken");
            return res.status(401).json({
                message : "Session Expired. Please login"
            })
        }

        generateAccessToken(decode.id,decode.sessionId,res);


        return res.status(200).json({
            message : "Token Refreshed"
        })
}


export const logout = async(req,res) => {

    const userId = req.user._id;

    await revokeRefreshToken(userId);

    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.clearCookie("csrfToken");

    await redisClient.del(`user:${userId}`);

    return res.status(200).json({
        message : "User loggedout successfully"
    })

}


export const refreshCSRFToken = async(req,res) => {
    const userId = req.user._id;

    const newCsrfToken = await generateCsrfToken(userId,res);

    res.json({
        message : "CSRF Token refreshed successfully",
        csrfToken : newCsrfToken
    })
}


export const adminController = async(req,res) => {
    res.json({
        message : "Hey Admin!"
    })
}