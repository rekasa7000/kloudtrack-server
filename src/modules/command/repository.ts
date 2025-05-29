import { Prisma, Command, PrismaClient, CommandStatus } from "@prisma/client";

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

  async updateStatus(commandId: number, updateData: any) {
    return await this.prisma.command.update({
      where: { id: commandId },
      data: updateData,
      include: {
        station: {
          select: {
            id: true,
            stationName: true,
            serialCode: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByStationAndStatus(stationId: number, statuses: CommandStatus[]) {
    return await this.prisma.command.findMany({
      where: {
        stationId,
        status: {
          in: statuses,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        station: {
          select: {
            id: true,
            stationName: true,
            serialCode: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByStation(stationId: number, take?: number, skip?: number) {
    const whereClause = { stationId };

    if (take && skip !== undefined) {
      const [commands, total] = await Promise.all([
        this.prisma.command.findMany({
          where: whereClause,
          take,
          skip,
          orderBy: { createdAt: "desc" },
          include: {
            station: {
              select: {
                id: true,
                stationName: true,
                serialCode: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        this.prisma.command.count({ where: whereClause }),
      ]);

      return {
        commands,
        total,
        hasMore: skip + take < total,
      };
    }

    return await this.prisma.command.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        station: {
          select: {
            id: true,
            stationName: true,
            serialCode: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getCommandStats(stationId?: number) {
    const whereClause = stationId ? { stationId } : {};

    const [totalCommands, pendingCommands, sentCommands, executedCommands, failedCommands, timeoutCommands] =
      await Promise.all([
        this.prisma.command.count({ where: whereClause }),
        this.prisma.command.count({ where: { ...whereClause, status: CommandStatus.PENDING } }),
        this.prisma.command.count({ where: { ...whereClause, status: CommandStatus.SENT } }),
        this.prisma.command.count({ where: { ...whereClause, status: CommandStatus.EXECUTED } }),
        this.prisma.command.count({ where: { ...whereClause, status: CommandStatus.FAILED } }),
        this.prisma.command.count({ where: { ...whereClause, status: CommandStatus.TIMEOUT } }),
      ]);

    return {
      total: totalCommands,
      pending: pendingCommands,
      sent: sentCommands,
      executed: executedCommands,
      failed: failedCommands,
      timeout: timeoutCommands,
      successRate: totalCommands > 0 ? (executedCommands / totalCommands) * 100 : 0,
    };
  }

  async findRecent(limit: number = 10, stationId?: number) {
    const whereClause = stationId ? { stationId } : {};

    return await this.prisma.command.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        station: {
          select: {
            id: true,
            stationName: true,
            serialCode: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
