"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.requestPasswordReset = exports.checkAuth = exports.getProfile = exports.register = exports.login = exports.generateToken = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_config_1 = __importDefault(require("../../config/database.config"));
const error_handler_middleware_1 = require("../../core/middlewares/error-handler.middleware");
const response_1 = require("../../core/utils/response");
const logger_1 = __importDefault(require("../../core/utils/logger"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
}
else {
    logger_1.default.warn("SENDGRID_API_KEY is not defined");
}
/**
 * Generate JWT token for authentication
 */
const generateToken = (userId, res) => {
    const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";
    const token = jsonwebtoken_1.default.sign({ id: userId }, jwtSecret, {
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
exports.generateToken = generateToken;
/**
 * Login handler
 */
exports.login = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Log login attempt (without password)
    logger_1.default.info(`Login attempt: ${email}`);
    const user = await database_config_1.default.user.findUnique({
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
        logger_1.default.warn(`Failed login attempt - Invalid email: ${email}`);
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        logger_1.default.warn(`Failed login attempt - Invalid password for: ${email}`);
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }
    // Generate token and set in cookie
    const token = (0, exports.generateToken)(user.id, res);
    // Update user's last login timestamp
    await database_config_1.default.user.update({
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
    logger_1.default.info(`User logged in successfully: ${email}`);
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
exports.register = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { userName, email, password, role, firstName, lastName, phone, organizationId, } = req.body;
    // Check if user already exists
    const existingUser = await database_config_1.default.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        logger_1.default.warn(`Registration failed - Email already in use: ${email}`);
        return res.status(400).json({
            success: false,
            message: "Email already in use",
        });
    }
    // Validate role
    const normalizedRole = role.toUpperCase();
    const allowedRoles = ["USER", "ADMIN", "SUPERADMIN"];
    if (!allowedRoles.includes(normalizedRole)) {
        logger_1.default.warn(`Invalid role specified during registration: ${role}`);
        return res.status(400).json({
            success: false,
            message: "Invalid role specified",
        });
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    // Get the ID of the user creating this account (if authenticated)
    const createdByUserId = req.user?.id || null;
    // Create user with transaction to ensure both user and organization relationship are created
    const result = await database_config_1.default.$transaction(async (prisma) => {
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
                    isAdmin: normalizedRole === "ADMIN" || normalizedRole === "SUPERADMIN",
                },
            });
        }
        return user;
    });
    // Generate token
    const token = (0, exports.generateToken)(result.id, res);
    logger_1.default.info(`User registered: ${email}`);
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
exports.getProfile = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated",
        });
    }
    const user = await database_config_1.default.user.findUnique({
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
        logger_1.default.warn(`Profile access failed - User not found: ID ${userId}`);
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
        const stations = await database_config_1.default.station.count({
            where: {
                organizationId: { in: organizationIds },
            },
        });
        statistics = { stations };
    }
    else if (user._count) {
        // For admins, include their creation statistics
        statistics = {
            createdUsers: user._count.createdUsers,
            stations: user._count.station,
            commands: user._count.command,
        };
    }
    logger_1.default.info(`Profile accessed: ${user.email}`);
    return (0, response_1.sendResponse)(res, {
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
    }, 200, "Profile retrieved successfully");
});
/**
 * Check authentication status
 */
exports.checkAuth = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    logger_1.default.info(`${req.user?.email} - User authenticated`);
    return (0, response_1.sendResponse)(res, req.user, 200, "Authenticated");
});
/**
 * Request password reset
 */
exports.requestPasswordReset = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    try {
        // Find the user
        const user = await database_config_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            logger_1.default.warn(`Password reset requested for non-existent email: ${email}`);
            // Don't reveal if the email exists or not for security reasons
            return res.status(200).json({
                success: true,
                message: "If your email is registered, you will receive a password reset code",
            });
        }
        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes
        // Store the code in ResetToken table
        await database_config_1.default.resetToken.create({
            data: {
                token: verificationCode,
                userId: user.id,
                expiresAt,
            },
        });
        // Check if SendGrid is configured
        if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_SENDER_EMAIL) {
            logger_1.default.error("SendGrid configuration missing");
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
        await mail_1.default.send(msg);
        logger_1.default.info(`Password reset code sent to: ${email}`);
        return res.status(200).json({
            success: true,
            message: "If your email is registered, you will receive a password reset code",
        });
    }
    catch (error) {
        logger_1.default.error("SendGrid API Error:", {
            message: error.message,
            response: error.response?.body,
            status: error.response?.status,
        });
        return res.status(500).json({
            success: false,
            message: "Failed to send reset email",
        });
    }
});
/**
 * Reset password using verification code
 */
exports.resetPassword = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { code, newPassword } = req.body;
    // Find the reset token (verification code) and ensure it's valid
    const resetToken = await database_config_1.default.resetToken.findFirst({
        where: {
            token: code,
            expiresAt: { gt: new Date() },
        },
        include: { user: true },
    });
    if (!resetToken) {
        logger_1.default.warn("Invalid or expired verification code used");
        return res.status(400).json({
            success: false,
            message: "Invalid or expired verification code",
        });
    }
    // Hash the new password
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    // Update the user's password and delete the reset token
    await database_config_1.default.$transaction([
        database_config_1.default.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        }),
        database_config_1.default.resetToken.delete({ where: { id: resetToken.id } }),
    ]);
    logger_1.default.info(`Password reset for user: ${resetToken.user.email}`);
    return res.status(200).json({
        success: true,
        message: "Password reset successful",
    });
});
