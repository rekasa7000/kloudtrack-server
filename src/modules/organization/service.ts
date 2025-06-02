import { AppError } from "../../core/utils/error";
import { OrganizationRepository } from "./repository";
import { Prisma } from "@prisma/client";

export class OrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  async createOrganization(data: Prisma.OrganizationUncheckedCreateInput) {
    return this.organizationRepository.create(data);
  }

  async update(data: Prisma.OrganizationUncheckedUpdateInput, id: number) {
    try {
      return await this.organizationRepository.update(data, id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("Organization not found", 404);
      }
      throw error;
    }
  }

  async delete(id: number) {
    return this.organizationRepository.delete(id);
  }

  async findById(id: number) {
    return this.organizationRepository.findById(id);
  }

  async findMany() {
    return this.organizationRepository.findMany();
  }

  async findByUserId(userId: number) {
    return this.organizationRepository.findByUserId(userId);
  }
}
