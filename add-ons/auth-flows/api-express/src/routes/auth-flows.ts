/**
 * Auth Flows Routes - Registration, Email Verification, Password Reset
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email";

const router = Router();

// Token expiry settings
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * POST /api/v1/auth/register
 * Register a new user and send verification email
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email: data.email,
        username: data.email.split("@")[0],
        displayName: data.name,
        hashedPassword,
        isActive: false,
        isVerified: false,
      },
    });

    // Create verification token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "email_verification",
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.displayName || user.email, token);

    return res.json({
      message: "Registration successful. Please check your email to verify your account.",
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/v1/auth/verify-email
 * Verify user's email address with token
 */
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const data = verifyEmailSchema.parse(req.body);

    // Find token
    const verification = await db.verificationToken.findFirst({
      where: {
        token: data.token,
        type: "email_verification",
        usedAt: null,
      },
    });

    if (!verification) {
      return res.status(400).json({
        error: "Invalid or expired verification token",
      });
    }

    // Check expiry
    if (verification.expiresAt < new Date()) {
      return res.status(400).json({
        error: "Verification token has expired",
      });
    }

    // Update user and mark token as used
    await db.$transaction([
      db.user.update({
        where: { id: verification.userId },
        data: { isVerified: true, isActive: true },
      }),
      db.verificationToken.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return res.json({
      message: "Email verified successfully. You can now log in.",
      verified: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Email verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/v1/auth/resend-verification
 * Resend verification email
 */
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    // Generic response to prevent email enumeration
    const genericResponse = {
      message: "If an account exists, a verification email has been sent.",
    };

    // Find user
    const user = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.json(genericResponse);
    }

    if (user.isVerified) {
      return res.json({
        message: "This email is already verified. You can log in.",
      });
    }

    // Invalidate old tokens
    await db.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: "email_verification",
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Create new token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "email_verification",
        expiresAt,
      },
    });

    // Send email
    await sendVerificationEmail(user.email, user.displayName || user.email, token);

    return res.json(genericResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Resend verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset email
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    // Generic response to prevent email enumeration
    const genericResponse = {
      message: "If an account exists with that email, a password reset link has been sent.",
    };

    // Find user
    const user = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.json(genericResponse);
    }

    // Invalidate old reset tokens
    await db.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: "password_reset",
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Create new token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "password_reset",
        expiresAt,
      },
    });

    // Send email
    await sendPasswordResetEmail(user.email, user.displayName || user.email, token);

    return res.json(genericResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    // Find token
    const verification = await db.verificationToken.findFirst({
      where: {
        token: data.token,
        type: "password_reset",
        usedAt: null,
      },
    });

    if (!verification) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Check expiry
    if (verification.expiresAt < new Date()) {
      return res.status(400).json({
        error: "Reset token has expired",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Update password and mark token as used
    await db.$transaction([
      db.user.update({
        where: { id: verification.userId },
        data: { hashedPassword },
      }),
      db.verificationToken.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return res.json({
      message: "Password reset successfully. You can now log in with your new password.",
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Password reset error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
