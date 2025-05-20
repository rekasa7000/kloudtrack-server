import { Prisma } from "@prisma/client";
import prisma from "../../config/database.config";

export class OrganizationRepository {
  constructor() {}

  async create(data: Prisma.OrganizationUncheckedCreateInput) {
    return prisma.organization.create({
      data,
    });
  }
  async update(data: Prisma.OrganizationUncheckedUpdateInput, id: number) {
    return prisma.organization.update({
      data,
      where: { id },
    });
  }
  async delete(id: number) {
    return prisma.organization.delete({
      where: { id },
    });
  }
  async findById(id: number) {
    return prisma.organization.findUnique({
      where: { id },
    });
  }
  async findMany() {
    return prisma.organization.findMany();
  }

  async findByUserId(userId: number) {
    return await prisma.userOrganization.findFirst({
      where: {
        userId,
      },
      include: {
        organization: true,
      },
    });
  }
}
