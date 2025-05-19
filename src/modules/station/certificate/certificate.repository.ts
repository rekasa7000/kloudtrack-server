import { RootCertificate, CertificateStatus, Prisma, StationCertificate, PrismaClient } from "@prisma/client";
import prisma from "../../../config/database.config";

export class CertificateRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAllRoot(): Promise<RootCertificate[]> {
    return prisma.rootCertificate.findMany({
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

  async findByIdRoot(id: number): Promise<RootCertificate | null> {
    return prisma.rootCertificate.findUnique({
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

  async findCurrentActiveRoot(): Promise<RootCertificate | null> {
    return prisma.rootCertificate.findFirst({
      where: { status: "ACTIVE" },
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

  async findByVersionRoot(version: string): Promise<RootCertificate | null> {
    return prisma.rootCertificate.findFirst({
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

  async findByStatusRoot(status: CertificateStatus): Promise<RootCertificate[]> {
    return prisma.rootCertificate.findMany({
      where: { status },
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

  async createRoot(data: Prisma.RootCertificateUncheckedCreateInput): Promise<RootCertificate> {
    return prisma.rootCertificate.create({
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

  async updateRoot(id: number, data: Prisma.RootCertificateUncheckedUpdateInput): Promise<RootCertificate> {
    return prisma.rootCertificate.update({
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

  async deleteRoot(id: number): Promise<RootCertificate> {
    return prisma.rootCertificate.delete({
      where: { id },
    });
  }

  async updateStatusRoot(id: number, status: CertificateStatus): Promise<RootCertificate> {
    return prisma.rootCertificate.update({
      where: { id },
      data: { status },
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

  async findAll(): Promise<StationCertificate[]> {
    return prisma.stationCertificate.findMany({
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

  async findById(id: number): Promise<StationCertificate | null> {
    return prisma.stationCertificate.findUnique({
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

  async findByStationId(stationId: number): Promise<StationCertificate | null> {
    return prisma.stationCertificate.findUnique({
      where: { stationId },
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

  async findByStatus(status: CertificateStatus): Promise<StationCertificate[]> {
    return prisma.stationCertificate.findMany({
      where: { status },
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

  async findByFingerprint(fingerprint: string): Promise<StationCertificate | null> {
    return prisma.stationCertificate.findFirst({
      where: { fingerprint },
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

  async create(data: Prisma.StationCertificateUncheckedCreateInput): Promise<StationCertificate> {
    return prisma.stationCertificate.create({
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

  async update(id: number, data: Prisma.StationCertificateUncheckedUpdateInput): Promise<StationCertificate> {
    return prisma.stationCertificate.update({
      where: { id },
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

  async delete(id: number): Promise<StationCertificate> {
    return prisma.stationCertificate.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, status: CertificateStatus): Promise<StationCertificate> {
    return prisma.stationCertificate.update({
      where: { id },
      data: { status },
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

  async updateManyStatus(status: CertificateStatus, newStatus: CertificateStatus) {
    return prisma.rootCertificate.updateMany({
      where: { status },
      data: { status: newStatus },
    });
  }
}
