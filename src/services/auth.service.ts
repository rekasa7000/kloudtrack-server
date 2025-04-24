// import { Response } from "express";
// import jwt from "jsonwebtoken";
// import config from "../config/config";

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

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Role, User } from '@prisma/client';
import { UserModel } from '../models/user.model';
import prisma from '../config/db';
import { generateToken } from '../utils/jwt.util';
import Logger from '../utils/logger';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const userModel = new UserModel();

export class AuthService {
  private mgClient;
  
  constructor() {
    this.mgClient = new Mailgun(formData).client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || (() => { throw new Error('MAILGUN_API_KEY is not defined'); })()
    });
  }


  async register(data: {
    userName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<{ user: User; token: string }> {
    const existingUser = await userModel.findByEmail(data.email);
    if (existingUser) {
      Logger.warn(`Registration failed - Email already in use: ${data.email}`);
      throw new Error('Email already in use');
    }

    const normalizedRole = data.role.toUpperCase() as Role;
    const allowedRoles: Role[] = ['USER', 'ADMIN', 'SUPERADMIN'];
    if (!allowedRoles.includes(normalizedRole)) {
      Logger.warn(`Invalid role specified during registration: ${data.role}`);
      throw new Error('Invalid role specified');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userModel.create({
      userName: data.userName,
      email: data.email,
      password: hashedPassword,
      role: normalizedRole,
    });

    const token = generateToken({ id: user.id });
    Logger.info(`User registered: ${data.email}`);
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: Partial<User>; token: string }> {
    const user = await userModel.findByEmail(email);
    if (!user) {
      Logger.warn(`Login failed - Invalid email: ${email}`);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      Logger.warn(`Login failed - Invalid password for: ${email}`);
      throw new Error('Invalid email or password');
    }

    const token = generateToken({ id: user.id });
    Logger.info(`User logged in: ${email}`);

    return {
      user: { id: user.id, userName: user.userName, email: user.email, role: user.role },
      token,
    };
  }

  async getProfile(userId: number): Promise<Partial<User>> {
    const user = await userModel.findById(userId);
    if (!user) {
      Logger.warn(`Profile access failed - User not found: ID ${userId}`);
      throw new Error('User not found');
    }

    Logger.info(`Profile accessed: ${user.email}`);
    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  
  async requestPasswordReset(email: string): Promise<void> {
    try {
      // 1. Generate and store token
      const user = await userModel.findByEmail(email);
      if (!user) {
        Logger.warn(`Password reset requested for non-existent email: ${email}`);
        throw new Error('User not found');
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000);
      
      await prisma.resetToken.create({
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

    } catch (error) {
      console.error('Mailgun API Error:', error);
      throw new Error('Failed to send reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find the reset token and ensure it's valid
    const resetToken = await prisma.resetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      Logger.warn('Invalid or expired password reset token used');
      throw new Error('Invalid or expired token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and delete the reset token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.resetToken.delete({ where: { id: resetToken.id } }),
    ]);

    Logger.info(`Password reset for user: ${resetToken.user.email}`);
  }
  
}
