import { Prisma, Command, PrismaClient } from "@prisma/client";

export class CommandRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(skip: number, take: number): Promise<Command[]> {
    return this.prisma.command.findMany({
      include: {
        station: true,
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      skip,
      take,
    });
  }

  async findById(id: number): Promise<Command | null> {
    return this.prisma.command.findUnique({
      where: { id },
      include: {
        station: true,
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.CommandUncheckedCreateInput): Promise<Command> {
    return this.prisma.command.create({
      data,
      include: {
        station: true,
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id: number): Promise<Command> {
    return this.prisma.command.update({
      where: { id },
      data: { executedAt: new Date() },
      include: {
        station: true,
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async delete(id: number): Promise<Command> {
    return this.prisma.command.delete({
      where: { id },
    });
  }
}
