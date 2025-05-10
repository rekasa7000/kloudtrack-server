import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import prisma from "../../config/database.config";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../core/utils/response";
import logger from "../../core/utils/logger";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  logger.warn("SENDGRID_API_KEY is not defined");
}

/**
 * Generate JWT token for authentication
 */
export const generateToken = (userId: number, res: Response): string => {
  const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";
  const token = jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: "7d",
  });

  // Set HTTP-only cookie for enhanced security
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

/**
 * Login handler
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Log login attempt (without password)
  logger.info(`Login attempt: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      userName: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      password: true,
      profilePicture: true,
      phone: true,
      userOrganizations: {
        include: {
          organization: {
            select: {
              id: true,
              organizationName: true,
              displayPicture: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    logger.warn(`Failed login attempt - Invalid email: ${email}`);
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    logger.warn(`Failed login attempt - Invalid password for: ${email}`);
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Generate token and set in cookie
  const token = generateToken(user.id, res);

  // Update user's last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  });

  // Prepare user data for response
  const userData = {
    id: user.id,
    userName: user.userName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    profilePicture: user.profilePicture,
    role: user.role,
    organizations: user.userOrganizations.map((uo) => ({
      id: uo.organization.id,
      name: uo.organization.organizationName,
      displayPicture: uo.organization.displayPicture,
      isAdmin: uo.isAdmin,
    })),
  };

  // Log successful login
  logger.info(`User logged in successfully: ${email}`);

  return res.status(200).json({
    success: true,
    message: "Sign in successful",
    token,
    user: userData,
  });
});

/**
 * Registration handler
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    userName,
    email,
    password,
    role,
    firstName,
    lastName,
    phone,
    organizationId,
  } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.warn(`Registration failed - Email already in use: ${email}`);
    return res.status(400).json({
      success: false,
      message: "Email already in use",
    });
  }

  // Validate role
  const normalizedRole = role.toUpperCase() as Role;
  const allowedRoles: Role[] = ["USER", "ADMIN", "SUPERADMIN"];
  if (!allowedRoles.includes(normalizedRole)) {
    logger.warn(`Invalid role specified during registration: ${role}`);
    return res.status(400).json({
      success: false,
      message: "Invalid role specified",
    });
  }

  // Hash password
  const hashedPassword = await bcryptjs.hash(password, 10);

  // Get the ID of the user creating this account (if authenticated)
  const createdByUserId = req.user?.id || null;

  // Create user with transaction to ensure both user and organization relationship are created
  const result = await prisma.$transaction(async (prisma) => {
    // Create user
    const user = await prisma.user.create({
      data: {
        userName,
        email,
        password: hashedPassword,
        role: normalizedRole,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        createdByUserId,
        passwordChangedAt: new Date(),
      },
    });

    // If organizationId is provided, create the user-organization relationship
    if (organizationId) {
      await prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organizationId,
          isAdmin:
            normalizedRole === "ADMIN" || normalizedRole === "SUPERADMIN",
        },
      });
    }

    return user;
  });

  // Generate token
  const token = generateToken(result.id, res);

  logger.info(`User registered: ${email}`);
  return res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: {
      id: result.id,
      userName: result.userName,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      role: result.role,
    },
  });
});

/**
 * Profile retrieval handler
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      userName: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profilePicture: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      passwordChangedAt: true,
      userOrganizations: {
        include: {
          organization: {
            select: {
              id: true,
              organizationName: true,
              description: true,
              displayPicture: true,
            },
          },
        },
      },
      // Include statistics for admin/superadmin users
      ...(req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN"
        ? {
            _count: {
              select: {
                createdUsers: true,
                station: true,
                command: true,
              },
            },
          }
        : {}),
    },
  });

  if (!user) {
    logger.warn(`Profile access failed - User not found: ID ${userId}`);
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Extract organizations with proper formatting
  const organizations = user.userOrganizations.map((uo) => ({
    id: uo.organization.id,
    name: uo.organization.organizationName,
    description: uo.organization.description,
    displayPicture: uo.organization.displayPicture,
    isAdmin: uo.isAdmin,
  }));

  // Get basic statistics based on user's organizations for regular users
  let statistics = {};

  if (req.user?.role === "USER") {
    // For regular users, only get stations from their organizations
    const organizationIds = organizations.map((org) => org.id);

    const stations = await prisma.station.count({
      where: {
        organizationId: { in: organizationIds },
      },
    });

    statistics = { stations };
  } else if (user._count) {
    // For admins, include their creation statistics
    statistics = {
      createdUsers: user._count.createdUsers,
      stations: user._count.station,
      commands: user._count.command,
    };
  }

  logger.info(`Profile accessed: ${user.email}`);
  return sendResponse(
    res,
    {
      id: user.id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      role: user.role,
      lastPasswordChange: user.passwordChangedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizations,
      statistics,
    },
    200,
    "Profile retrieved successfully"
  );
});

/**
 * Check authentication status
 */
export const checkAuth = asyncHandler(async (req: Request, res: Response) => {
  logger.info(`${req.user?.email} - User authenticated`);
  return sendResponse(res, req.user, 200, "Authenticated");
});

/**
 * Request password reset
 */
export const requestPasswordReset = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
      // Find the user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        logger.warn(
          `Password reset requested for non-existent email: ${email}`
        );
        // Don't reveal if the email exists or not for security reasons
        return res.status(200).json({
          success: true,
          message:
            "If your email is registered, you will receive a password reset code",
        });
      }

      // Generate a 6-digit verification code
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

      // Store the code in ResetToken table
      await prisma.resetToken.create({
        data: {
          token: verificationCode,
          userId: user.id,
          expiresAt,
        },
      });

      // Check if SendGrid is configured
      if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_SENDER_EMAIL) {
        logger.error("SendGrid configuration missing");
        return res.status(500).json({
          success: false,
          message: "Email service not configured",
        });
      }

      // Send the code via SendGrid
      const msg = {
        to: email,
        from: process.env.SENDGRID_SENDER_EMAIL,
        subject: "Password Reset Verification Code",
        text: `Your verification code is: ${verificationCode}. It expires in 15 minutes.`,
        html: `
        <h2>Password Reset</h2>
        <p>Your verification code is:</p>
        <h3>${verificationCode}</h3>
        <p>This code expires in 15 minutes.</p>
        <p>Enter this code in the password reset form to set a new password.</p>
      `,
      };

      await sgMail.send(msg);
      logger.info(`Password reset code sent to: ${email}`);

      return res.status(200).json({
        success: true,
        message:
          "If your email is registered, you will receive a password reset code",
      });
    } catch (error: any) {
      logger.error("SendGrid API Error:", {
        message: error.message,
        response: error.response?.body,
        status: error.response?.status,
      });

      return res.status(500).json({
        success: false,
        message: "Failed to send reset email",
      });
    }
  }
);

/**
 * Reset password using verification code
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, newPassword } = req.body;

    // Find the reset token (verification code) and ensure it's valid
    const resetToken = await prisma.resetToken.findFirst({
      where: {
        token: code,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      logger.warn("Invalid or expired verification code used");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update the user's password and delete the reset token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.resetToken.delete({ where: { id: resetToken.id } }),
    ]);

    logger.info(`Password reset for user: ${resetToken.user.email}`);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  }
);
