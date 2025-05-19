import { Prisma, Telemetry, PrismaClient } from "@prisma/client";

export class TelemetryRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(skip: number, take: number): Promise<Telemetry[]> {
    return this.prisma.telemetry.findMany({
      include: {
        station: true,
      },
      skip,
      take,
    });
  }

  async findById(id: number): Promise<Telemetry | null> {
    return this.prisma.telemetry.findUnique({
      where: { id },
      include: {
        station: true,
      },
    });
  }

  async create(data: Prisma.TelemetryUncheckedCreateInput): Promise<Telemetry> {
    return this.prisma.telemetry.create({
      data,
      include: {
        station: true,
      },
    });
  }

  async update(id: number, data: Prisma.TelemetryUncheckedUpdateInput): Promise<Telemetry> {
    return this.prisma.telemetry.update({
      where: { id },
      data,
      include: {
        station: true,
      },
    });
  }

  async delete(id: number): Promise<Telemetry> {
    return this.prisma.telemetry.delete({
      where: { id },
    });
  }
}
