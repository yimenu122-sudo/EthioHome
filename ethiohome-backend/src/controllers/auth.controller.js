/**
 * @file auth.controller.js
 * @description Authentication controller for all roles in EthioHome
 */

const User = require("../models/user.model");
const OTPVerification = require("../models/otp_verification.model");
const bcrypt = require("bcryptjs");
const {
  generateToken,
  generateRefreshToken,
  verifyToken,
} = require("../config/jwt");
const { successResponse, errorResponse } = require("../utils/response");
const { ROLES } = require("../config/roles");
const NotificationService = require("../services/notification.service");
const crypto = require("crypto");

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    let {
      first_name,
      last_name,
      phone_number,
      email,
      national_id,
      city,
      password,
      role,
      preferred_language,
    } = req.body;

    // Normalize email: Convert empty string to null to avoid UNIQUE constraint issues in DB
    if (email === "" || (email && email.trim() === "")) {
      email = null;
    }

    // 1. Uniqueness Checks
    const existingPhone = await User.findByPhone(phone_number);
    if (existingPhone) {
      return errorResponse(
        res,
        req.language === "am"
          ? "ይህ ስልክ ቁጥር ቀድሞ ተመዝግቧል"
          : "Phone number already registered",
        400,
      );
    }

    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return errorResponse(
          res,
          req.language === "am"
            ? "ይህ ኢሜይል ቀድሞ ተመዝግቧል"
            : "Email address already registered",
          400,
        );
      }
    }

    const existingId = await User.findByNationalId(national_id);
    if (existingId) {
      return errorResponse(
        res,
        req.language === "am"
          ? "ይህ መታወቂያ ቀድሞ ተመዝግቧል"
          : "National ID already registered",
        400,
      );
    }

    // Role validation
    if (role === "Admin") {
      return errorResponse(
        res,
        "Admin registration restricted via this endpoint",
        403,
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      first_name,
      last_name,
      phone_number,
      email,
      national_id,
      city: city ? city.trim() : city,
      password_hash,
      role: role || "Renter",
      preferred_language: preferred_language || "English",
      status: "Pending",
    });

    const userData = {
      id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };

    // --- OTP GENERATION & SENDING ---
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, otpSalt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await OTPVerification.cleanOldOTPs(user.user_id);
    await OTPVerification.create(user.user_id, otpHash, expiresAt);

    // Send Email if provided
    if (user.email) {
      const subject = req.language === "am" ? "ኢትዮ-ሆም መለያ ማረጋገጫ" : "EthioHome Account Verification";
      const body = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">EthioHome</h2>
          <p>Hello ${user.first_name},</p>
          <p>${req.language === "am" ? "የእርስዎ የማረጋገጫ ኮድ ይህ ነው:" : "Your verification code is:"}</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #f3f4f6; padding: 10px 20px; border-radius: 5px; color: #1e40af;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            ${req.language === "am" ? "ይህ ኮድ ለ10 ደቂቃዎች ያገለግላል።" : "This code is valid for 10 minutes."}
          </p>
        </div>
      `;
      await NotificationService.sendEmail(user.email, subject, body);
    }

    // Always log for debug/SMS
    await NotificationService.sendSMS(user.phone_number, `EthioHome Code: ${otpCode}`);

    return successResponse(res, userData, "Registration successful. Verification code sent.", 201);
  } catch (error) {
    console.error("Registration Error:", error);
    // Return the specific DB error message if it's a constraint violation
    const message = error.code === '23505' 
      ? (req.language === 'am' ? 'መረጃው ቀድሞ ተመዝግቧል' : 'This information is already registered')
      : 'Registration failed. Please try again.';
    return errorResponse(res, message, error.code === '23505' ? 400 : 500, error.message);
  }
};

/**
 * Phase 1: Login Initialization (Credentials check + OTP Send)
 */
exports.loginInit = async (req, res) => {
  try {
    const { identifier, password, delivery_method } = req.body;

    // 1. Find user
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      return errorResponse(res, req.language === "am" ? "የተሳሳተ መረጃ" : "Invalid credentials", 401);
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, req.language === "am" ? "የተሳሳተ መረጃ" : "Invalid credentials", 401);
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 4. Save OTP
    await OTPVerification.cleanOldOTPs(user.user_id);
    await OTPVerification.create(user.user_id, otpHash, expiresAt);

    // 5. Send OTP via chosen delivery method
    const subject = req.language === "am" ? "ኢትዮ-ሆም መግቢያ ኮድ" : "EthioHome Login Verification";
    const body = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">EthioHome Login</h2>
        <p>Your login verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #f3f4f6; padding: 10px 20px; border-radius: 5px; color: #1e40af;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">This code expires in 10 minutes. If you did not request this, please secure your account.</p>
      </div>
    `;

    let sentSuccessfully = false;

    if (delivery_method === 'email') {
      if (!user.email) {
        return errorResponse(res, "Email not found for this account. Please use SMS instead.", 400);
      }
      sentSuccessfully = await NotificationService.sendEmail(user.email, subject, body);
    } else {
      // Default to SMS
      sentSuccessfully = await NotificationService.sendSMS(user.phone_number, `EthioHome Login Code: ${otp}`);
    }

    if (!sentSuccessfully && delivery_method === 'email') {
       return errorResponse(res, "Failed to send email. Check your SMTP settings or try SMS instead.", 500);
    }

    return successResponse(
      res,
      { userId: user.user_id },
      "OTP sent successfully",
      200,
    );
  } catch (error) {
    console.error("Login Init Error:", error);
    return errorResponse(res, "Login initialization failed", 500);
  }
};

/**
 * Phase 2: Verify Login OTP and issue Tokens
 */
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // 1. Find active OTP
    const activeOtp = await OTPVerification.findLatestActive(userId);
    if (!activeOtp) {
      return errorResponse(res, req.language === "am" ? "ኮድ ጊዜው አልፎበታል" : "Code expired or invalid", 400);
    }

    // 2. Verify OTP
    const isMatch = await bcrypt.compare(otp, activeOtp.otp_hash);
    if (!isMatch) {
      await OTPVerification.incrementAttempts(activeOtp.otp_id);
      return errorResponse(res, req.language === "am" ? "የተሳሳተ ኮድ" : "Invalid verification code", 400);
    }

    // 3. Get User
    const user = await User.findById(userId);
    if (!user) return errorResponse(res, "User not found", 404);

    // 4. Update status if pending (auto-verify on first login)
    if (user.status === "Pending") {
      // Typically you'd have an updateStatus method
      // For now let's assume direct login works
    }

    await User.updateLastLogin(user.user_id);

    // 5. Generate tokens
    const token = generateToken({
      id: user.user_id,
      email: user.email,
      role: user.role,
      phone: user.phone_number,
      city: user.city
    });
    const refreshToken = generateRefreshToken(user.user_id);

    // 6. Mark OTP as used
    await OTPVerification.markAsUsed(activeOtp.otp_id);

    return successResponse(
      res,
      {
        user: {
          id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          city: user.city,
          is_verified: user.is_verified,
        },
        token,
        refreshToken,
      },
      "Login successful",
    );
  } catch (error) {
    console.error("Verify Login Error:", error);
    return errorResponse(res, "Login verification failed", 500);
  }
};

/**
 * Resend OTP (Registration or 2FA Login)
 */
exports.resendOTP = async (req, res) => {
  try {
    const { userId, identifier, type } = req.body;

    // 1. Find user
    // We try to find the user by ID or identifier (email/phone)
    const user = userId ? await User.findById(userId) : await User.findByIdentifier(identifier);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 3. Save OTP
    await OTPVerification.cleanOldOTPs(user.user_id);
    await OTPVerification.create(user.user_id, otpHash, expiresAt);

    // 4. Send Notification
    const isLogin = type === '2fa';
    const subject = isLogin 
      ? (req.language === "am" ? "ኢትዮ-ሆም መግቢያ ኮድ" : "EthioHome Login Verification")
      : (req.language === "am" ? "ኢትዮ-ሆም መለያ ማረጋገጫ" : "EthioHome Account Verification");

    const body = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">EthioHome</h2>
        <p>Hello ${user.first_name},</p>
        <p>${req.language === "am" ? "የእርስዎ አዲሱ የማረጋገጫ ኮድ ይህ ነው:" : "Your new verification code is:"}</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #f3f4f6; padding: 10px 20px; border-radius: 5px; color: #1e40af;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          ${req.language === "am" ? "ይህ ኮድ ለ10 ደቂቃዎች ያገለግላል።" : "This code is valid for 10 minutes."}
        </p>
      </div>
    `;

    if (user.email) {
      await NotificationService.sendEmail(user.email, subject, body);
    }
    
    await NotificationService.sendSMS(user.phone_number, `EthioHome Code: ${otp}`);

    return successResponse(res, null, "Verification code resent successfully");
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return errorResponse(res, "Failed to resend code", 500);
  }
};

/**
 * Login user directly (Optional/Fallback)
 */
exports.login = async (req, res) => {
  // ... current direct login logic ...
};

/**
 * Refresh expired access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, "Refresh token required", 400);

    const decoded = verifyToken(refreshToken);
    if (!decoded) return errorResponse(res, "Invalid refresh token", 401);

    const user = await User.findById(decoded.id);
    if (!user) return errorResponse(res, "User not found", 404);

    const newToken = generateToken({
      id: user.user_id,
      email: user.email,
      role: user.role,
      phone: user.phone_number,
      city: user.city
    });
    return successResponse(res, { token: newToken }, "Token refreshed");
  } catch (error) {
    return errorResponse(res, "Token refresh failed", 500);
  }
};

/**
 * Placeholder for Account Verification
 */
exports.verifyAccount = async (req, res) => {
  try {
    let { userId, identifier, otp } = req.body;
    if (identifier) identifier = identifier.trim().toLowerCase();

    if (!otp || (!userId && !identifier)) {
      return errorResponse(res, "Missing verification details", 400);
    }

    // 1. Resolve user
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findByIdentifier(identifier);
    }

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const targetUserId = user.user_id;

    // 2. Find latest active OTP
    const activeOtp = await OTPVerification.findLatestActive(targetUserId);
    if (!activeOtp) {
      return errorResponse(res, req.language === "am" ? "ኮድ ጊዜው አልፎበታል" : "Verification code expired or invalid", 400);
    }

    // 2. Hash check
    const isMatch = await bcrypt.compare(otp, activeOtp.otp_hash);
    if (!isMatch) {
      await OTPVerification.incrementAttempts(activeOtp.otp_id);
      return errorResponse(res, req.language === "am" ? "ኮዱ ትክክል አይደለም" : "Invalid verification code", 400);
    }

    // 3. Mark user as verified and active if this is a registration verification (userId present)
    if (userId) {
      await User.verify(targetUserId);
      await OTPVerification.markAsUsed(activeOtp.otp_id);
    }

    return successResponse(res, null, req.language === "am" ? "ኮዱ ተረጋግጧል" : "Code verified successfully");
  } catch (error) {
    console.error("Verification Error:", error);
    return errorResponse(res, "Verification failed", 500);
  }
};

/**
 * Step 1: Request Password Reset OTP
 */
exports.forgotPassword = async (req, res) => {
  try {
    let { identifier } = req.body;
    if (!identifier) {
      return errorResponse(res, "Identifier (phone or email) is required", 400);
    }
    identifier = identifier.trim().toLowerCase();

    // 1. Find user (Generic response to avoid user enumeration)
    const user = await User.findByIdentifier(identifier);

    // Always return success even if user doesn't exist for security
    const successMsg =
      req.language === "am"
        ? "መለያው ካለ፣ የማረጋገጫ ኮድ ተልኳል።"
        : "If an account exists, a recovery code has been sent.";

    if (!user) {
      return successResponse(res, null, successMsg);
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash OTP
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // 4. Save to database (Expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OTPVerification.cleanOldOTPs(user.user_id); // Cleanup
    await OTPVerification.create(user.user_id, otpHash, expiresAt);

    // 5. Send OTP via Notification Service
    const subject = req.language === "am" ? "ኢትዮ-ሆም የይለፍ ቃል መልሶ ማግኛ" : "EthioHome Password Recovery";
    const body = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2563eb;">EthioHome Recovery</h2>
        <p>Your password reset code is:</p>
        <div style="font-size: 32px; font-weight: bold; background: #f3f4f6; display: inline-block; padding: 10px;">${otp}</div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `;

    if (user.email) {
      await NotificationService.sendEmail(user.email, subject, body);
    }
    
    await NotificationService.sendSMS(user.phone_number, `EthioHome Reset Code: ${otp}`);

    return successResponse(res, null, successMsg);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return errorResponse(res, "Failed to process request", 500);
  }
};

/**
 * Step 2: Verify OTP and Set New Password
 */
exports.resetPassword = async (req, res) => {
  try {
    let { identifier, otp, newPassword } = req.body;
    if (identifier) identifier = identifier.trim().toLowerCase();

    if (!identifier || !otp || !newPassword) {
      return errorResponse(res, "All fields are required", 400);
    }

    // 1. Find user
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      return errorResponse(res, "Invalid request", 400);
    }

    // 2. Find latest active OTP
    const activeOtp = await OTPVerification.findLatestActive(user.user_id);
    if (!activeOtp) {
      return errorResponse(res, "OTP has expired or is invalid", 400);
    }

    // 3. Check attempts limit
    if (activeOtp.attempts >= 5) {
      return errorResponse(
        res,
        "Too many failed attempts. Please request a new code.",
        405,
      );
    }

    // 4. Verify OTP
    const isMatch = await bcrypt.compare(otp, activeOtp.otp_hash);
    if (!isMatch) {
      await OTPVerification.incrementAttempts(activeOtp.otp_id);
      return errorResponse(res, "Invalid verification code", 400);
    }

    // 5. Hash new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 6. Update user password
    await User.updatePassword(user.user_id, newPasswordHash);

    // 7. Mark OTP as used
    await OTPVerification.markAsUsed(activeOtp.otp_id);

    // 8. Log the event (Optional Audit Log)
    console.log(
      `[AUTH SERVICE] Password reset success for user: ${user.user_id}`,
    );

    return successResponse(res, null, "Password has been updated successfully");
  } catch (error) {
    console.error("Reset Password Error:", error);
    return errorResponse(res, "Failed to reset password", 500);
  }
};

/**
 * Check if the first admin exists in the system
 */
exports.checkAdminExists = async (req, res) => {
  try {
    const adminCount = await User.countByRole("Admin");
    return successResponse(
      res,
      { exists: adminCount > 0 },
      "Admin check completed",
    );
  } catch (error) {
    return errorResponse(res, "Failed to check admin status", 500);
  }
};

/**
 * Register the very first administrator (One-time setup)
 */
exports.registerAdmin = async (req, res) => {
  try {
    // 1. Double check if an admin already exists
    const adminCount = await User.countByRole("Admin");
    if (adminCount > 0) {
      return errorResponse(
        res,
        req.language === "am" 
          ? "ሲስተሙ አስቀድሞ ተዋቅሯል። የአስተዳዳሪ ምዝገባ ተዘግቷል።" 
          : "System already initialized. Admin registration is disabled.",
        403,
      );
    }

    let {
      first_name,
      last_name,
      phone_number,
      email,
      national_id,
      city,
      password,
      preferred_language,
    } = req.body;

    if (email === "" || (email && email.trim() === "")) {
      email = null;
    }

    // 2. Uniqueness Checks
    const existingPhone = await User.findByPhone(phone_number);
    if (existingPhone) {
      return errorResponse(res, req.language === "am" ? "ይህ ስልክ ቁጥር ቀድሞ ተመዝግቧል" : "Phone number already registered", 400);
    }

    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return errorResponse(res, req.language === "am" ? "ይህ ኢሜይል ቀድሞ ተመዝግቧል" : "Email address already registered", 400);
      }
    }

    const existingId = await User.findByNationalId(national_id);
    if (existingId) {
      return errorResponse(res, req.language === "am" ? "ይህ መታወቂያ ቀድሞ ተመዝግቧል" : "National ID already registered", 400);
    }

    // 3. Hash password (bcrypt 12 rounds for high security on admin)
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Create admin
    const admin = await User.createAdmin({
      first_name,
      last_name,
      phone_number,
      email,
      national_id,
      city: city || "Addis Ababa",
      password_hash,
      preferred_language: preferred_language || "English",
    });

    // 5. Log the initialization event (Audit Log)
    const AuditLog = require("../models/audit_log.model");
    await AuditLog.create({
      admin_id: admin.user_id,
      action: 'SYSTEM_INITIALIZATION',
      table_name: 'users',
      record_id: admin.user_id,
      new_values: JSON.stringify({ email: admin.email, role: 'Admin' }),
      ip_address: req.ip
    });

    return successResponse(
      res,
      {
        id: admin.user_id,
        email: admin.email,
        role: admin.role,
      },
      "First administrator created successfully. System initialized.",
      201,
    );
  } catch (error) {
    console.error("Admin Registration Error:", error);
    return errorResponse(res, "Failed to initialize system", 500);
  }
};

/**
 * Register a new Guest (Renter or Buyer)
 */
exports.registerGuest = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      email,
      city,
      role,
      password,
      preferred_language,
    } = req.body;

    // 1. Uniqueness Checks
    const existingPhone = await User.findByPhone(phone_number);
    if (existingPhone) {
      return errorResponse(res, req.language === "am" ? "ይህ ስልክ ቁጥር ቀድሞ ተመዝግቧል" : "Phone number already registered", 400);
    }

    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return errorResponse(res, req.language === "am" ? "ይህ ኢሜይል ቀድሞ ተመዝግቧል" : "Email address already registered", 400);
      }
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Create User
    const user = await User.create({
      first_name,
      last_name,
      phone_number,
      email,
      city,
      password_hash,
      role, // 'Renter' or 'Buyer'
      preferred_language: preferred_language || "English",
      status: 'Active',
      is_verified: true,
      national_id: null, // Guests might not need national ID at first step
    });

    return successResponse(
      res,
      {
        id: user.user_id,
        phone_number: user.phone_number,
        role: user.role,
      },
      req.language === "am" 
        ? "እንኳን ደስ አሎት በተሳካ ሁኔታ ተመዝግበዋል የመግቢያ ቁልፉን ይጫኑ" 
        : "Congratulation Successfully Registered Click the Login Button",
      201
    );
  } catch (error) {
    console.error("Guest Registration Error:", error);
    // Return specific DB error if it's a constraint violation (duplicate phone/email)
    const message = error.code === '23505' 
      ? (req.language === 'am' ? 'መረጃው ቀድሞ ተመዝግቧል' : 'This information is already registered')
      : 'Registration failed. Please try again.';
    return errorResponse(res, message, error.code === '23505' ? 400 : 500, error.message);
  }
};

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Login for Guests (Renter or Buyer)
 */
exports.loginGuest = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // 1. Find user by phone or email
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      return errorResponse(res, req.language === "am" ? "የተሳሳተ መረጃ" : "Invalid credentials", 401);
    }

    // 2. Check Role (Must be Renter or Buyer)
    if (!["Renter", "Buyer"].includes(user.role)) {
      return errorResponse(res, "Access restricted for this portal", 403);
    }

    // 3. Status Checks
    if (user.status === "Inactive") {
      return errorResponse(res, req.language === "am" ? "መለያው አይሰራም" : "Account inactive", 403);
    }
    if (user.status === "Pending") {
      return errorResponse(res, req.language === "am" ? "መለያዎ በግምገማ ላይ ነው" : "Account pending review", 403);
    }

    // 4. Verification Check
    if (!user.is_verified) {
      return errorResponse(res, req.language === "am" ? "መለያው አልተረጋገጠም" : "Account not verified", 403);
    }

    // 5. Compare Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, req.language === "am" ? "የተሳሳተ መረጃ" : "Invalid credentials", 401);
    }

    // 6. Generate Token
    const token = generateToken({
      id: user.user_id,
      email: user.email,
      role: user.role,
      phone: user.phone_number,
      city: user.city
    });
    const refreshToken = generateRefreshToken(user.user_id);

    // 7. Update Last Login
    await User.updateLastLogin(user.user_id);

    return successResponse(res, {
      token,
      refreshToken,
      user: {
        user_id: user.user_id,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image: user.profile_image
      }
    }, "Login successful");

  } catch (error) {
    console.error("Guest Login Error:", error);
    return errorResponse(res, "Failed to login", 500);
  }
};

/**
 * Google Login / Social Integration
 */
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return errorResponse(res, "Google token is required", 400);

    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture, given_name, family_name } = payload;

    // 2. Check if user exists by email
    let user = await User.findByEmail(email);

    if (user) {
      // Login flow
      if (user.status === "Inactive") {
        return errorResponse(res, "Account inactive", 403);
      }
      
      // Update provider info if not set
      if (!user.provider) {
        // You might want to update the user here
      }
    } else {
      // Registration flow (Default to Renter)
      user = await User.create({
        first_name: given_name || name,
        last_name: family_name || "",
        email: email,
        phone_number: `G-${sub.substring(0, 10)}`, // Temporary unique phone identifier
        role: "Renter",
        provider: "google",
        provider_id: sub,
        profile_image: picture,
        status: "Active",
        is_verified: true,
        national_id: null,
      });
    }

    // 3. Generate Token
    const token = generateToken({
      id: user.user_id,
      email: user.email,
      role: user.role,
      phone: user.phone_number,
      city: user.city
    });
    const refreshToken = generateRefreshToken(user.user_id);
    await User.updateLastLogin(user.user_id);

    return successResponse(res, {
      token,
      refreshToken,
      user: {
        user_id: user.user_id,
        role: user.role,
        first_name: user.first_name,
        profile_image: user.profile_image
      }
    }, "Login successful");

  } catch (error) {
    console.error("Google Login Error:", error);
    return errorResponse(res, "Social authentication failed", 500);
  }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  return successResponse(res, null, "Logged out successfully");
};
