import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { generateOtp, getOtpExpiry, sendOtpSms, isOtpValid } from "../utils/otpService";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { ApiError } from "../middleware/errorHandler";

/**
 * POST /api/v1/auth/request-otp
 * Body: { mobile }
 * Creates the user record if it doesn't exist yet (unverified), generates
 * an OTP, "sends" it via the mock SMS service (console log in dev).
 */
export async function requestOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { mobile } = req.body;

    let user = await User.findOne({ mobile });
    const otp = generateOtp();
    const otpExpiry = getOtpExpiry();

    if (!user) {
      user = await User.create({
        name: "",
        mobile,
        role: "business_owner",
        isVerified: false,
        otp,
        otpExpiry,
      });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    }

    await sendOtpSms(mobile, otp);

    return res.status(200).json({
      message: "OTP sent",
      mobile,
      // Demo mode: always return the OTP so testers don't need SMS.
      // Remove this before production release.
      devOtp: otp,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/verify-otp
 * Body: { mobile, otp }
 * Verifies OTP, issues access + refresh tokens. If the user has no name yet
 * (first-time signup), client should follow up with /create-account.
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ mobile }).select("+otp +otpExpiry");
    if (!user) {
      throw new ApiError(404, "No pending OTP for this mobile number. Request one first.");
    }

    if (!isOtpValid(user.otp, user.otpExpiry, otp)) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
        needsProfile: user.name === "",
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/create-account
 * Body: { mobile, name, role? }
 * Completes signup after OTP verification (sets the display name, optional role).
 * Requires a valid access token (user must already be OTP-verified).
 */
export async function createAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { mobile, name, role } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) {
      throw new ApiError(404, "User not found. Verify OTP first.");
    }
    if (!user.isVerified) {
      throw new ApiError(403, "Mobile number not verified yet.");
    }

    user.name = name;
    if (role) user.role = role;
    await user.save();

    return res.status(200).json({
      message: "Account created",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 * Rotates the refresh token and issues a new access token.
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(payload.sub).select("+refreshTokenHash");
    if (!user || !user.refreshTokenHash) {
      throw new ApiError(401, "Refresh token no longer valid");
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new ApiError(401, "Refresh token no longer valid");
    }

    const newAccessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user._id.toString() });
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Requires auth. Invalidates the stored refresh token hash.
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.sub;
    if (userId) {
      await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
    }
    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Requires auth. Returns the current user profile.
 */
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.sub;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}
