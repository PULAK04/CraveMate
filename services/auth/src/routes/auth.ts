import express from "express";

import {
  addUserRole,
  loginUser,
  loginWithEmail,
  myProfile,
  registerWithEmail,
} from "../controllers/auth.js";

import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

// Google OAuth
router.post("/login", loginUser);

// Email/password authentication
router.post("/register", registerWithEmail);
router.post("/email-login", loginWithEmail);

// Protected routes
router.put("/add/role", isAuth, addUserRole);
router.get("/me", isAuth, myProfile);

export default router;