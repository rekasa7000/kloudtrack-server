import prisma from "../config/database.config";
import { Role, User, ResetToken } from "@prisma/client";

export class UserModel {
  async create(data: {
    userName: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async createResetToken(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<ResetToken> {
    return prisma.resetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async findResetToken(
    token: string
  ): Promise<(ResetToken & { user: User }) | null> {
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
}
