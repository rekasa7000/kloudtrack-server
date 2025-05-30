import { Firmware, CertificateStatus, Prisma, PrismaClient } from "@prisma/client";

export class FirmwareRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(): Promise<Firmware[]> {
    return this.prisma.firmware.findMany({
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

  async findById(id: number): Promise<Firmware | null> {
    return this.prisma.firmware.findUnique({
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

  async findByVersion(version: string): Promise<Firmware | null> {
    return this.prisma.firmware.findFirst({
      where: { version },
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

  async create(data: Prisma.FirmwareUncheckedCreateInput): Promise<Firmware> {
    return this.prisma.firmware.create({
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

  async update(id: number, data: Prisma.FirmwareUncheckedUpdateInput): Promise<Firmware> {
    return this.prisma.firmware.update({
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

  async delete(id: number): Promise<Firmware> {
    return this.prisma.firmware.delete({
      where: { id },
    });
  }
}
