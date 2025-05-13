import prisma from "../../../config/database.config";
import { StationMetadata } from "../station.types";

export class MetadataRepository {
  async getAllStations(skip: number, take: number) {
    return prisma.station.findMany({
      include: { certificate: true },
      skip,
      take,
      orderBy: { id: "asc" },
    });
  }

  async createStation(data: StationMetadata, userId: number) {
    return prisma.station.create({
      data: {
        ...data,
        createdByUserId: userId,
      },
    });
  }

  async updateStation(id: number, data: StationMetadata) {
    return prisma.station.update({
      where: { id },
      data,
    });
  }

  async deleteStation(id: number) {
    return prisma.station.delete({
      where: { id },
    });
  }

  async getStationById(id: number) {
    return prisma.station.findUnique({
      where: { id },
    });
  }
}
