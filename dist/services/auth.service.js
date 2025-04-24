"use strict";
// import { Response } from "express";
// import jwt from "jsonwebtoken";
// import config from "../config/config";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// export const generateToken = (userId: Object) => {
//   return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: "7d" });
// };
// export const setAuthCookie = (res: Response, token: string) => {
//   res.cookie("zorb-jwt", token, {
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//     httpOnly: true,
//     sameSite: "strict",
//     secure: process.env.NODE_ENV !== "development",
//   });
// };
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../models/user.model");
const db_1 = __importDefault(require("../config/db"));
const jwt_util_1 = require("../utils/jwt.util");
const logger_1 = __importDefault(require("../utils/logger"));
const form_data_1 = __importDefault(require("form-data"));
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const userModel = new user_model_1.UserModel();
class AuthService {
    mgClient;
    constructor() {
        this.mgClient = new mailgun_js_1.default(form_data_1.default).client({
            username: 'api',
            key: process.env.MAILGUN_API_KEY || (() => { throw new Error('MAILGUN_API_KEY is not defined'); })()
        });
    }
    async register(data) {
        const existingUser = await userModel.findByEmail(data.email);
        if (existingUser) {
            logger_1.default.warn(`Registration failed - Email already in use: ${data.email}`);
            throw new Error('Email already in use');
        }
        const normalizedRole = data.role.toUpperCase();
        const allowedRoles = ['USER', 'ADMIN', 'SUPERADMIN'];
        if (!allowedRoles.includes(normalizedRole)) {
            logger_1.default.warn(`Invalid role specified during registration: ${data.role}`);
            throw new Error('Invalid role specified');
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await userModel.create({
            userName: data.userName,
            email: data.email,
            password: hashedPassword,
            role: normalizedRole,
        });
        const token = (0, jwt_util_1.generateToken)({ id: user.id });
        logger_1.default.info(`User registered: ${data.email}`);
        return { user, token };
    }
    async login(email, password) {
        const user = await userModel.findByEmail(email);
        if (!user) {
            logger_1.default.warn(`Login failed - Invalid email: ${email}`);
            throw new Error('Invalid email or password');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            logger_1.default.warn(`Login failed - Invalid password for: ${email}`);
            throw new Error('Invalid email or password');
        }
        const token = (0, jwt_util_1.generateToken)({ id: user.id });
        logger_1.default.info(`User logged in: ${email}`);
        return {
            user: { id: user.id, userName: user.userName, email: user.email, role: user.role },
            token,
        };
    }
    async getProfile(userId) {
        const user = await userModel.findById(userId);
        if (!user) {
            logger_1.default.warn(`Profile access failed - User not found: ID ${userId}`);
            throw new Error('User not found');
        }
        logger_1.default.info(`Profile accessed: ${user.email}`);
        return {
            id: user.id,
            userName: user.userName,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async requestPasswordReset(email) {
        try {
            // 1. Generate and store token
            const user = await userModel.findByEmail(email);
            if (!user) {
                logger_1.default.warn(`Password reset requested for non-existent email: ${email}`);
                throw new Error('User not found');
            }
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 3600000);
            await db_1.default.resetToken.create({
                data: { token: resetToken, userId: user.id, expiresAt }
            });
            // 2. Send via Mailgun API
            const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
            const mailgunDomain = process.env.MAILGUN_DOMAIN || (() => { throw new Error('MAILGUN_DOMAIN is not defined'); })();
            await this.mgClient.messages.create(mailgunDomain, {
                from: `"Password Reset" <noreply@${process.env.MAILGUN_DOMAIN}>`,
                to: [email],
                subject: 'Password Reset Request',
                text: `Click here to reset your password: ${resetLink}`,
                html: `
          <h2>Password Reset</h2>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `
            });
        }
        catch (error) {
            console.error('Mailgun API Error:', error);
            throw new Error('Failed to send reset email');
        }
    }
    async resetPassword(token, newPassword) {
        // Find the reset token and ensure it's valid
        const resetToken = await db_1.default.resetToken.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
        if (!resetToken) {
            logger_1.default.warn('Invalid or expired password reset token used');
            throw new Error('Invalid or expired token');
        }
        // Hash the new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update the user's password and delete the reset token
        await db_1.default.$transaction([
            db_1.default.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            db_1.default.resetToken.delete({ where: { id: resetToken.id } }),
        ]);
        logger_1.default.info(`Password reset for user: ${resetToken.user.email}`);
    }
}
exports.AuthService = AuthService;
