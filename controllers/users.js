const User = require("../models/user");
const { sendEmail } = require("../brevo");

// ══════════════════════════════════════════
//  EXISTING CONTROLLERS (unchanged)
// ══════════════════════════════════════════

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);

    await sendEmail({
      toEmail: email,
      toName: username,
      subject: "Welcome to Wanderlust! 🎉",
      htmlContent: `
        <h2>Hello ${username}!</h2>
        <p>Welcome to <strong>Wanderlust</strong> 🌍</p>
        <p>Your account has been created successfully.</p>
        <p>Start exploring amazing listings now!</p>
      `,
    });

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust..");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back to Wanderlust!!");
  const redirectUrl = res.locals.redirectUrl || "/listings";
  return res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};

// ══════════════════════════════════════════
//  FORGOT PASSWORD — STEP 1
//  GET /forgot-password → show email form
// ══════════════════════════════════════════
module.exports.renderForgotPassword = (req, res) => {
  res.render("users/forgot-password.ejs");
};

// ══════════════════════════════════════════
//  FORGOT PASSWORD — STEP 2
//  POST /forgot-password → generate OTP & send mail
// ══════════════════════════════════════════
module.exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always show same message (security: don't reveal if email exists)
  if (!user) {
    req.flash("success", "If that email exists, an OTP has been sent.");
    return res.redirect("/forgot-password");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // OTP expires in 10 minutes
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  // Save OTP + expiry to user document
  user.resetOtp = otp;
  user.resetOtpExpiry = expiry;
  await user.save();

  // Send OTP email via Brevo
  await sendEmail({
    toEmail: user.email,
    toName: user.username,
    subject: "Your Wanderlust Password Reset OTP 🔐",
    htmlContent: `
      <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#2d2250);padding:32px 36px;text-align:center;">
          <h1 style="font-family:Georgia,serif;color:#fff;font-size:28px;margin:0 0 6px;">Wanderlust 🌍</h1>
          <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0;">Password Reset Request</p>
        </div>
        <div style="padding:36px;">
          <p style="font-size:15px;color:#1a1a2e;margin-bottom:8px;">Hi <strong>${user.username}</strong>,</p>
          <p style="font-size:14px;color:#7a7a8a;margin-bottom:28px;line-height:1.6;">
            We received a request to reset your Wanderlust password.<br/>
            Use the OTP below to proceed. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:#1a1a2e;border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Your One-Time Password</p>
            <div style="font-family:Georgia,serif;font-size:42px;font-weight:700;color:#d4a843;letter-spacing:12px;">${otp}</div>
          </div>
          <p style="font-size:12px;color:#b0a8a0;line-height:1.6;margin:0;">
            If you didn't request this, please ignore this email.<br/>
            Your password will remain unchanged.
          </p>
        </div>
        <div style="background:#f0ebe0;padding:16px 36px;text-align:center;">
          <p style="font-size:11px;color:#b0a8a0;margin:0;">© ${new Date().getFullYear()} Wanderlust · All rights reserved</p>
        </div>
      </div>
    `,
  });

  // Store email in session so next steps know which user
  req.session.resetEmail = user.email;

  req.flash("success", "OTP sent! Check your inbox.");
  res.redirect("/verify-otp");
};

// ══════════════════════════════════════════
//  VERIFY OTP — STEP 3
//  GET /verify-otp → show OTP input form
// ══════════════════════════════════════════
module.exports.renderVerifyOtp = (req, res) => {
  // Must have a resetEmail in session
  if (!req.session.resetEmail) {
    req.flash("error", "Please start the password reset process again.");
    return res.redirect("/forgot-password");
  }
  res.render("users/verify-otp.ejs");
};

// ══════════════════════════════════════════
//  VERIFY OTP — STEP 4
//  POST /verify-otp → validate OTP
// ══════════════════════════════════════════
module.exports.verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const email = req.session.resetEmail;

  if (!email) {
    req.flash("error", "Session expired. Please start again.");
    return res.redirect("/forgot-password");
  }

  const user = await User.findOne({ email });

  if (!user || !user.resetOtp) {
    req.flash("error", "OTP not found. Please request a new one.");
    return res.redirect("/forgot-password");
  }

  // Check expiry
  if (user.resetOtpExpiry < new Date()) {
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();
    req.flash("error", "OTP has expired. Please request a new one.");
    return res.redirect("/forgot-password");
  }

  // Check OTP match
  if (user.resetOtp !== otp.trim()) {
    req.flash("error", "Invalid OTP. Please try again.");
    return res.redirect("/verify-otp");
  }

  // OTP verified — mark session as verified
  req.session.otpVerified = true;

  res.redirect("/reset-password");
};

// ══════════════════════════════════════════
//  RESET PASSWORD — STEP 5
//  GET /reset-password → show new password form
// ══════════════════════════════════════════
module.exports.renderResetPassword = (req, res) => {
  if (!req.session.resetEmail || !req.session.otpVerified) {
    req.flash("error", "Please verify your OTP first.");
    return res.redirect("/forgot-password");
  }
  res.render("users/reset-password.ejs");
};

// ══════════════════════════════════════════
//  RESET PASSWORD — STEP 6
//  POST /reset-password → save new password
// ══════════════════════════════════════════
module.exports.resetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  const email = req.session.resetEmail;

  if (!email || !req.session.otpVerified) {
    req.flash("error", "Unauthorized. Please start again.");
    return res.redirect("/forgot-password");
  }

  // Match passwords
  if (password !== confirmPassword) {
    req.flash("error", "Passwords do not match.");
    return res.redirect("/reset-password");
  }

  // Min length check
  if (password.length < 6) {
    req.flash("error", "Password must be at least 6 characters.");
    return res.redirect("/reset-password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    req.flash("error", "User not found.");
    return res.redirect("/forgot-password");
  }

  // passport-local-mongoose provides setPassword()
  await user.setPassword(password);

  // Clear OTP fields
  user.resetOtp = null;
  user.resetOtpExpiry = null;
  await user.save();

  // Clear session reset data
  req.session.resetEmail = null;
  req.session.otpVerified = null;

  // Send confirmation email
  await sendEmail({
    toEmail: user.email,
    toName: user.username,
    subject: "Your Wanderlust password has been reset ✅",
    htmlContent: `
      <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#2d2250);padding:32px 36px;text-align:center;border-radius:16px 16px 0 0;">
          <h1 style="font-family:Georgia,serif;color:#fff;font-size:28px;margin:0;">Wanderlust 🌍</h1>
        </div>
        <div style="background:#faf7f2;padding:36px;border-radius:0 0 16px 16px;">
          <h2 style="color:#1a1a2e;font-family:Georgia,serif;margin:0 0 14px;">Password Reset Successful ✅</h2>
          <p style="color:#7a7a8a;font-size:14px;line-height:1.6;">
            Hi <strong>${user.username}</strong>, your password has been successfully changed.<br/>
            You can now log in with your new password.
          </p>
          <a href="/login" style="display:inline-block;margin-top:20px;background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
            Login Now →
          </a>
        </div>
      </div>
    `,
  });

  req.flash("success", "Password reset successful! Please log in.");
  res.redirect("/login");
};
