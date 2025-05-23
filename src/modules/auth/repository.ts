import { Role, User, ResetToken, PrismaClient } from "@prisma/client";

export class AuthRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async createResetToken(userId: number, token: string, expiresAt: Date): Promise<ResetToken> {
    return this.prisma.resetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async findResetToken(token: string): Promise<(ResetToken & { user: User }) | null> {
    return this.prisma.resetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async deleteResetToken(id: number): Promise<void> {
    await this.prisma.resetToken.delete({ where: { id } });
  }

  async findValidToken(code: string) {
    return this.prisma.resetToken.findFirst({
      where: {
        token: code,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async deleteTokenById(id: number) {
    return this.prisma.resetToken.delete({ where: { id } });
  }

  async updatePassword(userId: number, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
