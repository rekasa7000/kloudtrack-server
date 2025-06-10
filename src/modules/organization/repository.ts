import { Prisma, PrismaClient } from "@prisma/client";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}

export class OrganizationRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: Prisma.OrganizationUncheckedCreateInput) {
    console.log(data);
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

  async findManyPaginated(options: PaginationOptions = {}): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

    const skip = (page - 1) * limit;

    const orderBy: Prisma.OrganizationOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const totalItems = await this.prisma.organization.count();

    const data = await this.prisma.organization.findMany({
      skip,
      take: limit,
      orderBy,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit,
      },
    };
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

  async searchOrganizations(searchTerm: string, options: PaginationOptions = {}): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.OrganizationWhereInput = {
      OR: [
        {
          organizationName: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    };

    const orderBy: Prisma.OrganizationOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const totalItems = await this.prisma.organization.count({
      where: whereClause,
    });

    const data = await this.prisma.organization.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit,
      },
    };
  }
}
