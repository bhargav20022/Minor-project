const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

// ── Signup ──
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

// ── Login ──
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

// ── Logout ──
router.get("/logout", userController.logout);

// ── Forgot Password: show email form ──
router.get("/forgot-password", userController.renderForgotPassword);

// ── Forgot Password: send OTP to email ──
router.post("/forgot-password", wrapAsync(userController.sendOtp));

// ── Verify OTP: show OTP entry form ──
router.get("/verify-otp", userController.renderVerifyOtp);

// ── Verify OTP: check OTP submitted by user ──
router.post("/verify-otp", wrapAsync(userController.verifyOtp));

// ── Reset Password: show new password form ──
router.get("/reset-password", userController.renderResetPassword);

// ── Reset Password: save new password ──
router.post("/reset-password", wrapAsync(userController.resetPassword));

module.exports = router;
