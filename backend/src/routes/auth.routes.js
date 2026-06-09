import express from "express";
import {
  loginUser,
  logout,
  myProfile,
  refreshToken,
  register,
  verifyOtp,
  verifyUser,
  refreshCSRFToken,
  adminController,
} from "../controllers/authControllers.js";
import { authorizedAdmin, isAuth } from "../middlewares/authMiddleware.js";
import { verifyCsrfToken } from "../middlewares/csrfMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);

router.get("/me", isAuth, myProfile);

router.post("/refresh", refreshToken);

router.post("/logout", isAuth, verifyCsrfToken, logout);

router.post("/refresh-csrf", isAuth, refreshCSRFToken);

router.get("/admin",isAuth,authorizedAdmin,adminController);

export default router;
