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
const user_model_1 = require("../models/user.model");
const database_config_1 = __importDefault(require("../config/database.config"));
const jwt_util_1 = require("../utils/jwt.util");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const userModel = new user_model_1.UserModel();
class AuthService {
    constructor() {
        // Initialize SendGrid with API key
        mail_1.default.setApiKey(process.env.SENDGRID_API_KEY || (() => { throw new Error('SENDGRID_API_KEY is not defined'); })());
    }
    async register(data) {
        const existingUser = await userModel.findByEmail(data.email);
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const normalizedRole = data.role.toUpperCase();
        const allowedRoles = ['USER', 'ADMIN', 'SUPERADMIN'];
        if (!allowedRoles.includes(normalizedRole)) {
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
        return { user, token };
    }
    async login(email, password) {
        const user = await userModel.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }
        const token = (0, jwt_util_1.generateToken)({ id: user.id });
        return {
            user: { id: user.id, userName: user.userName, email: user.email, role: user.role },
            token,
        };
    }
    async getProfile(userId) {
        const user = await userModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
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
            // 1. Find the user
            const user = await userModel.findByEmail(email);
            if (!user) {
                throw new Error('User not found');
            }
            // 2. Generate a 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes
            // 3. Store the code in ResetToken table
            await database_config_1.default.resetToken.create({
                data: {
                    token: verificationCode,
                    userId: user.id,
                    expiresAt,
                },
            });
            // 4. Send the code via SendGrid
            const senderEmail = process.env.SENDGRID_SENDER_EMAIL || (() => { throw new Error('SENDGRID_SENDER_EMAIL is not defined'); })();
            const msg = {
                to: email,
                from: senderEmail,
                subject: 'Password Reset Verification Code',
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
        }
        catch (error) {
            console.error('SendGrid API Error:', {
                message: error.message,
                response: error.response?.body,
                status: error.response?.status,
            });
            throw new Error('Failed to send reset email');
        }
    }
    async resetPassword(code, newPassword) {
        // Find the reset token (verification code) and ensure it's valid
        const resetToken = await database_config_1.default.resetToken.findFirst({
            where: {
                token: code,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
        if (!resetToken) {
            throw new Error('Invalid or expired verification code');
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
    }
}
exports.AuthService = AuthService;
