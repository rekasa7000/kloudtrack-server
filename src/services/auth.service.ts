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
import { Role, User } from '@prisma/client';
import { UserModel } from '../models/user.model';
import prisma from '../config/database.config';
import { generateToken } from '../utils/jwt.util';
import sgMail from '@sendgrid/mail'

const userModel = new UserModel();

export class AuthService {

  constructor() {
    // Initialize SendGrid with API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || (() => { throw new Error('SENDGRID_API_KEY is not defined'); })());
  }


  async register(data: {
    userName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<{ user: User; token: string }> {
    const existingUser = await userModel.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const normalizedRole = data.role.toUpperCase() as Role;
    const allowedRoles: Role[] = ['USER', 'ADMIN', 'SUPERADMIN'];
    if (!allowedRoles.includes(normalizedRole)) {
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
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: Partial<User>; token: string }> {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken({ id: user.id });

    return {
      user: { id: user.id, userName: user.userName, email: user.email, role: user.role },
      token,
    };
  }

  async getProfile(userId: number): Promise<Partial<User>> {
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

  
  async requestPasswordReset(email: string): Promise<void> {
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
      await prisma.resetToken.create({
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

      await sgMail.send(msg);
    } catch (error: any) {
      console.error('SendGrid API Error:', {
        message: error.message,
        response: error.response?.body,
        status: error.response?.status,
      });
      throw new Error('Failed to send reset email');
    }
  }

  async resetPassword(code: string, newPassword: string): Promise<void> {
    // Find the reset token (verification code) and ensure it's valid
    const resetToken = await prisma.resetToken.findFirst({
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and delete the reset token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.resetToken.delete({ where: { id: resetToken.id } }),
    ]);

  }
  
}
