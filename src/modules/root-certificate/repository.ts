import { RootCertificate, CertificateStatus, Prisma, PrismaClient } from "@prisma/client";

export class RootCertificateRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAllRoot(): Promise<RootCertificate[]> {
    return this.prisma.rootCertificate.findMany({
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
    return this.prisma.rootCertificate.findUnique({
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
    return this.prisma.rootCertificate.findFirst({
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
    return this.prisma.rootCertificate.findFirst({
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
    return this.prisma.rootCertificate.findMany({
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
    return this.prisma.rootCertificate.create({
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
    return this.prisma.rootCertificate.update({
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
    return this.prisma.rootCertificate.delete({
      where: { id },
    });
  }

  async updateStatusRoot(id: number, status: CertificateStatus): Promise<RootCertificate> {
    return this.prisma.rootCertificate.update({
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

  async updateManyStatus(status: CertificateStatus, newStatus: CertificateStatus) {
    return this.prisma.rootCertificate.updateMany({
      where: { status },
      data: { status: newStatus },
    });
  }
}
