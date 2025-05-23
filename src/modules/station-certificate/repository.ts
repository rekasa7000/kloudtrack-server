import { CertificateStatus, Prisma, StationCertificate, PrismaClient, Station } from "@prisma/client";

export class StationCertificateRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(): Promise<StationCertificate[]> {
    return this.prisma.stationCertificate.findMany({
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
    return this.prisma.stationCertificate.findUnique({
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

  async findByStationId(stationId: number) {
    return this.prisma.stationCertificate.findUnique({
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
    return this.prisma.stationCertificate.findMany({
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
    return this.prisma.stationCertificate.findFirst({
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
    return this.prisma.stationCertificate.create({
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
    return this.prisma.stationCertificate.update({
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
    return this.prisma.stationCertificate.delete({
      where: { stationId: id },
    });
  }

  async updateStatus(id: number, status: CertificateStatus): Promise<StationCertificate> {
    return this.prisma.stationCertificate.update({
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

  async findBySerial(serialCode: string): Promise<Station | null> {
    return this.prisma.station.findUnique({
      where: {
        serialCode,
      },
    });
  }
}
