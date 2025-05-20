import { PrismaClient } from "@prisma/client";
import { StationMetadata } from "../../core/services/station/station.types";

export class StationRepository {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  async getAllStations(skip: number, take: number) {
    return this.prisma.station.findMany({
      include: {
        certificate: true,
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
      skip,
      take,
      orderBy: { id: "asc" },
    });
  }

  async createStation(data: StationMetadata, userId: number) {
    return this.prisma.station.create({
      data: {
        ...data,
        createdByUserId: userId,
      },
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

  async updateStation(id: number, data: StationMetadata) {
    return this.prisma.station.update({
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

  async deleteStation(id: number) {
    return this.prisma.station.delete({
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

  async getStationById(id: number) {
    return this.prisma.station.findUnique({
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
}
