import jwt from "jsonwebtoken"
import crypto from "crypto"
import { redisClient } from "../config/redis.js";
import { generateCsrfToken, revokeCsrfToken } from "../middlewares/csrfMiddleware.js";

// Generating short-period and long-period accessToken and refresh token
export const generateToken = async(id,res) => {
    const sessionId = crypto.randomBytes(16).toString("hex");

    const accessToken = jwt.sign( {id, sessionId },process.env.JWT_SECRET,{expiresIn : "15m"});

    const refreshToken = jwt.sign({ id, sessionId },process.env.REFRESH_SECRET, {expiresIn : "7d"})


    const refreshTokenKey = `refresh_token:${id}`;
    const activeSessionKey = `active_session:${id}`;
    const sessionDataKey = `session:${sessionId}`

    const existingSession = await redisClient.get(`session:${activeSessionKey}`);
    if(existingSession) {
        await redisClient.del(`session:${existingSession}`)
        await redisClient.del(refreshToken);
    }

    const sessionData = {
        userId : id,
        sessionId,
        createdAt : new Date().toISOString(),
        lastActivity : new Date().toISOString()
    }

    await redisClient.setEx(refreshTokenKey, 7*24*60*60, refreshToken);
    await redisClient.setEx(sessionDataKey, 7*24*60*60, JSON.stringify(sessionData))
    await redisClient.setEx(activeSessionKey,7*24*60*60,sessionId)

    res.cookie("accessToken", accessToken ,{
        httpOnly : true,
        secure   : true,
        sameSite : "none",
        maxAge   : 15 * 60 * 1000
    })

    res.cookie("refreshToken", refreshToken, {
        maxAge   : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
        sameSite : "none",
        secure   : true
    })

    const csrfToken = await generateCsrfToken(id,res);

 return { accessToken, refreshToken, csrfToken, sessionId}
}


// verifying refreshToken is same as refreshtoken stored in redis 
export const verifyRefreshToken = async(refreshToken) => {
    try{
        const decode = jwt.verify(refreshToken,process.env.REFRESH_SECRET);

        const storedToken = await redisClient.get(`refresh_token:${decode.id}`);

       if(storedToken !== refreshToken) {
        return null;
       }

       const activeSessionId = await redisClient.get(`active_session:${decode.id}`);

       if(activeSessionId !== decode.sessionId) {
        return null;
       }

       const sessionData = await redisClient.get(`session:${decode.sessionId}`);

       if(!sessionData) return null;

       const parsedSessionData = JSON.parse(sessionData);
       parsedSessionData.lastActivity = new Date().toISOString();


       await redisClient.setEx(`session:${decode.sessionId}`, 7*24*60*60, JSON.stringify(parsedSessionData));

       return decode;

    } catch(err) {
        return null
    }
}

// re-generating short-period accessToken using longPeriod RefreshToken
export const generateAccessToken = (id,sessionId,res) => {
    const accessToken = jwt.sign({id, sessionId},process.env.JWT_SECRET,{expiresIn : '15m'});

    res.cookie("accessToken",accessToken,{
        httpOnly : true,
        secure : true,
        sameSite : 'none',
        maxAge : 15 * 60 * 1000 
    })
}

// for logout functionality
export const revokeRefreshToken = async(userId) => {
    const activeSessionId = await redisClient.get(`active_session:${userId}`);
    await redisClient.del(`refresh_token:${userId}`);
    await redisClient.del(`active_session:${userId}`);

    if(activeSessionId) {
        await redisClient.del(`session:${activeSessionId}`);
    }

    await revokeCsrfToken(userId);
};


export const isSessionActive = async(userId, sessionId) => {
    const activeSessionId = await redisClient.get(`active_session:${userId}`);
    return activeSessionId === sessionId;
}