import { Prisma, Telemetry, PrismaClient } from "@prisma/client";

export class TelemetryRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findMany(stationId: number, skip: number = 0, take: number = 10): Promise<Telemetry[]> {
    return this.prisma.telemetry.findMany({
      where: { stationId },
      skip,
      take,
    });
  }

  async findById(id: number) {
    return this.prisma.telemetry.findUnique({
      where: { id },
      include: {
        station: true,
      },
    });
  }

  async create(stationId: number, data: Prisma.TelemetryUncheckedCreateInput) {
    return this.prisma.telemetry.create({
      data: {
        ...data,
        stationId,
      },
      include: {
        station: true,
      },
    });
  }

  async update(id: number, data: Prisma.TelemetryUncheckedUpdateInput) {
    return this.prisma.telemetry.update({
      where: { id },
      data,
      include: {
        station: true,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.telemetry.delete({
      where: { id },
      include: {
        station: true,
      },
    });
  }

  async findStationById(id: number) {
    return this.prisma.station.findUnique({
      where: { id },
      select: {
        stationName: true,
        stationType: true,
        id: true,
        location: true,
        address: true,
        city: true,
        state: true,
        country: true,
      },
    });
  }
}
