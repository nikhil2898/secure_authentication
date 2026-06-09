import crypto from "crypto";
import { redisClient } from "../config/redis.js";

export const generateCsrfToken = async (userId, res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");

  const csrfKey = `csrf:${userId}`;

  await redisClient.setEx(csrfKey, 3600, csrfToken);

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    sameSite: "none",
    secure: true,
    maxAge: 60 * 60 * 1000,
  });

  return csrfToken;
};

export const verifyCsrfToken = async (req, res, next) => {
  try {
    if (req.method === "GET") {
      return next();
    }

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "User not Authenticated",
      });
    }

    const clientToken =
      req.headers["x-csrf-token"] ||
      req.headers["x-xsrf-token"] ||
      req.headers["csrf-token"];

    if (!clientToken) {
      return res.status(403).json({
        message: "CSRF Token is Missing. please refresh the page",
        code: "CSRF_TOKEN_MISSING",
      });
    }

    const csrfKey = `csrf:${userId}`;

    const storedToken = await redisClient.get(csrfKey);

    if (!storedToken) {
      return res.status(403).json({
        message: "CSRF Token is Expired. Please refresh the page",
        code: "CSRF_TOKEN_EXPIRED",
      });
    }

    if (storedToken !== clientToken) {
      return res.status(403).json({
        message: "CSRF token is invalid. please refresh the page",
        code: "CSRF_TOKEN_INVALID",
      });
    }

    next();
  } catch (err) {
    console.log("CSRF verification Error:", err);
    return res.status(500).json({
      message: "CSRF Verification Failed.",
      code: "CSRF_VERIFICATION_ERROR",
    });
  }
};

export const revokeCsrfToken = async (userId) => {
  const csrfKey = `csrf:${userId}`;

  await redisClient.del(csrfKey);
};

export const refreshCsrfToken = async (userId, res) => {
  await revokeCsrfToken(userId);

  return await generateCsrfToken(userId, res);
};
