import { AppError } from "../../core/utils/error";
import { OrganizationRepository, PaginationOptions, PaginatedResult } from "./repository";
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

  async findManyPaginated(options: PaginationOptions): Promise<PaginatedResult<any>> {
    if (options.page && options.page < 1) {
      throw new AppError("Page number must be greater than 0", 400);
    }

    if (options.limit && (options.limit < 1 || options.limit > 100)) {
      throw new AppError("Limit must be between 1 and 100", 400);
    }

    return this.organizationRepository.findManyPaginated(options);
  }

  async searchOrganizations(searchTerm: string, options: PaginationOptions): Promise<PaginatedResult<any>> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new AppError("Search term is required", 400);
    }

    if (options.page && options.page < 1) {
      throw new AppError("Page number must be greater than 0", 400);
    }

    if (options.limit && (options.limit < 1 || options.limit > 100)) {
      throw new AppError("Limit must be between 1 and 100", 400);
    }

    return this.organizationRepository.searchOrganizations(searchTerm.trim(), options);
  }

  async findByUserId(userId: number) {
    return this.organizationRepository.findByUserId(userId);
  }
}
