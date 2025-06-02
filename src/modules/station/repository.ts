import { Prisma, PrismaClient } from "@prisma/client";

export class StationRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  async findAll(skip: number, take: number) {
    console.log("SKIP: ", skip);
    console.log("TAKE: ", take);
    const [stations, total] = await Promise.all([
      this.prisma.station.findMany({
        skip,
        take,
        include: {
          certificate: true,
          user: true,
          organization: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.station.count(),
    ]);
    return {
      stations,
      total,
    };
  }

  async create(data: Prisma.StationUncheckedCreateInput) {
    return this.prisma.station.create({
      data: {
        ...data,
        activatedAt: null,
      },
      include: {
        certificate: true,
        organization: true,
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

  async update(id: number, data: Prisma.StationUncheckedUpdateInput) {
    return this.prisma.station.update({
      where: { id },
      data,
      include: {
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

  async delete(id: number) {
    return this.prisma.station.delete({
      where: { id },
      include: {
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

  async findById(id: number) {
    return await this.prisma.station.findUnique({
      where: { id },
      include: {
        certificate: true,
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        organization: true,

        telemetry: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        command: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  async findBySerial(serialCode: string) {
    return await this.prisma.station.findUnique({
      where: { serialCode },
      include: {
        certificate: true,
        user: true,
        organization: true,
      },
    });
  }

  async findActive() {
    return await this.prisma.station.findMany({
      where: { isActive: true },
      include: {
        certificate: true,
        user: true,
        organization: true,
      },
    });
  }

  async activateStation(id: number) {
    return await this.prisma.station.update({
      where: { id },
      data: {
        isActive: true,
        activatedAt: new Date(),
      },
      include: {
        certificate: true,
        user: true,
        organization: true,
      },
    });
  }
  async deactivateStation(id: number) {
    return await this.prisma.station.update({
      where: { id },
      data: {
        isActive: false,
        activatedAt: new Date(),
      },
      include: {
        certificate: true,
        user: true,
        organization: true,
      },
    });
  }

  async updateStatus(id: number, status: any) {
    return await this.prisma.station.update({
      where: { id },
      data: {
        firmwareId: status.firmwareId,
      },
    });
  }

  async findByOrganization(organizationId: number) {
    return await this.prisma.station.findMany({
      where: { organizationId },
      include: {
        certificate: true,
        user: true,
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async addToOrganization(stationId: number, organizationId: number) {
    return await this.prisma.station.update({
      where: {
        id: stationId,
      },
      data: {
        organizationId,
      },
    });
  }
}
