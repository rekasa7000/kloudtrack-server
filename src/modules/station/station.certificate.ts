import fs from "fs";
import path from "path";
import { PrismaClient, StationCertificate, RootCertificate } from "@prisma/client";

export class CertificateService {
  private prisma: PrismaClient;
  private certificateBasePath: string;

  constructor(prisma: PrismaClient, certificateBasePath: string) {
    this.prisma = prisma;
    this.certificateBasePath = certificateBasePath;
  }

  async getStationCertificate(stationId: number): Promise<{
    cert: Buffer;
    key: Buffer;
    rootCert: Buffer;
  }> {
    try {
      // Get station certificate paths from database
      const certificate = await this.prisma.stationCertificate.findUnique({
        where: { stationId },
      });

      if (!certificate) {
        throw new Error(`No certificate found for station ID: ${stationId}`);
      }

      // Get the latest active root certificate
      const rootCertificate = await this.prisma.rootCertificate.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });

      if (!rootCertificate) {
        throw new Error("No active root certificate found");
      }

      // Read certificate files
      const cert = fs.readFileSync(path.join(this.certificateBasePath, certificate.certPath));
      const key = fs.readFileSync(path.join(this.certificateBasePath, certificate.keyPath));
      const rootCert = fs.readFileSync(path.join(this.certificateBasePath, rootCertificate.path));

      return { cert, key, rootCert };
    } catch (error) {
      console.error("Error getting station certificate:", error);
      throw error;
    }
  }

  async getAllStationCertificates(): Promise<StationCertificate[]> {
    try {
      return await this.prisma.stationCertificate.findMany({
        where: { status: "ACTIVE" },
      });
    } catch (error) {
      console.error("Error getting all station certificates:", error);
      throw error;
    }
  }

  async getRootCertificate(): Promise<RootCertificate | null> {
    try {
      return await this.prisma.rootCertificate.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("Error getting root certificate:", error);
      throw error;
    }
  }
}
