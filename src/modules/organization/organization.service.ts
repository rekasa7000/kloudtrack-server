import { OrganizationRepository } from "./organization.repository";
import { Prisma } from "@prisma/client";

export class OrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  async create(data: Prisma.OrganizationUncheckedCreateInput) {
    const result = await prisma.$transaction(async (prisma) => {
      const organization = await this.organizationService.create({ organizationName, description });

      await prisma.userOrganization.create({
        data: {
          userId,
          organizationId: organization.id,
          isAdmin: true,
        },
      });

      return organization;
    });

    logger.info(`Organization created: ${organizationName} by user ID: ${userId}`);
    return this.organizationRepository.create(data);
  }
  async update(data: Prisma.OrganizationUncheckedUpdateInput, id: number) {
    return this.organizationRepository.update(data, id);
  }
  async delete(id: number) {
    return this.organizationRepository.delete(id);
  }
  async findById(id: number) {
    return this.organizationRepository.findById(id);
  }
  async findAll() {
    return this.organizationRepository.findAll();
  }
  async findByUserId(userId: number) {
    return this.organizationRepository.findByUserId(userId);
  }
}
