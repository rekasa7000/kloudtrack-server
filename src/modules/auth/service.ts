import bcrypt from "bcryptjs";
import { Role, User } from "@prisma/client";
import { generateToken } from "../../core/utils/auth";
import nodemailer from "nodemailer";
import { AuthRepository } from "./repository";
import { prisma } from "../../config/database.config";
import { Response } from "express";
import { AppError } from "../../core/utils/error";

export class AuthService {
  private transporter: nodemailer.Transporter;
  private repository: AuthRepository;
  constructor(transporter: nodemailer.Transporter, authRepository: AuthRepository) {
    this.transporter = transporter;
    this.repository = authRepository;
  }

  async login(email: string, password: string, res: Response): Promise<{ user: Partial<User>; token: string }> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid email or password", 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 400);
    }

    const token = generateToken(user.id, res);

    return {
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getProfile(userId: number): Promise<Partial<User>> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new Error("User not found");
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
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.resetToken.create({
      data: {
        token: verificationCode,
        userId: user.id,
        expiresAt,
      },
    });

    const senderEmail = process.env.EMAIL_FROM || "no-reply@kloudtechsea.com";

    const mailOptions = {
      from: senderEmail,
      to: email,
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

    await this.transporter.sendMail(mailOptions);
  }

  async resetPassword(code: string, newPassword: string): Promise<void> {
    const resetToken = await this.repository.findValidToken(code);

    if (!resetToken) {
      throw new Error("Invalid or expired verification code");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async () => {
      await this.repository.updatePassword(resetToken.userId, hashedPassword);
      await this.repository.deleteTokenById(resetToken.id);
    });
  }
}
