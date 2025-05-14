import { OrganizationRepository } from "./organization.repository";
import { Prisma } from "@prisma/client";

export class OrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  async create(data: Prisma.OrganizationUncheckedCreateInput) {
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
