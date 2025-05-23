import { AppError } from "../../core/utils/error";
import { OrganizationRepository } from "./repository";
import { Prisma } from "@prisma/client";

export class OrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  async createOrganization(data: Prisma.OrganizationUncheckedCreateInput) {
    try {
      return this.organizationRepository.create(data);
    } catch (error) {
      throw new AppError("Failed to create organization", 500);
    }
  }
  async update(data: Prisma.OrganizationUncheckedUpdateInput, id: number) {
    try {
      return this.organizationRepository.update(data, id);
    } catch (error) {
      throw new AppError("Failed to update organization", 500);
    }
  }
  async delete(id: number) {
    try {
      return this.organizationRepository.delete(id);
    } catch (error) {
      throw new AppError("Failed to delete organization", 500);
    }
  }
  async findById(id: number) {
    try {
      return this.organizationRepository.findById(id);
    } catch (error) {
      throw new AppError("Failed to find organization", 500);
    }
  }
  async findMany() {
    try {
      return this.organizationRepository.findMany();
    } catch (error) {
      throw new AppError("Failed to find many organization", 500);
    }
  }
  async findByUserId(userId: number) {
    try {
      return this.organizationRepository.findByUserId(userId);
    } catch (error) {
      throw new AppError("Failed to find organization based on user", 500);
    }
  }
}
