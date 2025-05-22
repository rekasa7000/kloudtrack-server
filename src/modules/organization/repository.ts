import { Prisma, PrismaClient } from "@prisma/client";

export class OrganizationRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: Prisma.OrganizationUncheckedCreateInput) {
    return this.prisma.organization.create({
      data,
    });
  }
  async update(data: Prisma.OrganizationUncheckedUpdateInput, id: number) {
    return this.prisma.organization.update({
      data,
      where: { id },
    });
  }
  async delete(id: number) {
    return this.prisma.organization.delete({
      where: { id },
    });
  }
  async findById(id: number) {
    return this.prisma.organization.findUnique({
      where: { id },
    });
  }
  async findMany() {
    return this.prisma.organization.findMany();
  }

  async findByUserId(userId: number) {
    return await this.prisma.userOrganization.findFirst({
      where: {
        userId,
      },
      include: {
        organization: true,
      },
    });
  }
}
