import { Role, User, ResetToken } from "@prisma/client";
import prisma from "../../config/database.config";

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async createResetToken(userId: number, token: string, expiresAt: Date): Promise<ResetToken> {
    return prisma.resetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async findResetToken(token: string): Promise<(ResetToken & { user: User }) | null> {
    return prisma.resetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async deleteResetToken(id: number): Promise<void> {
    await prisma.resetToken.delete({ where: { id } });
  }

  async findValidToken(code: string) {
    return prisma.resetToken.findFirst({
      where: {
        token: code,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async deleteTokenById(id: number) {
    return prisma.resetToken.delete({ where: { id } });
  }

  async updatePassword(userId: number, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
