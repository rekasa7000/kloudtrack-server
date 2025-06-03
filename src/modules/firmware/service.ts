import { config } from "../../config/environment";
import { S3Service } from "../../core/service/aws-s3";
import { AppError } from "../../core/utils/error";
import { FirmwareRepository } from "./repository";

type FirmwareCreate = {
  serial: string;
  version: string;
  title: string;
  description?: string;
  s3Key?: string;
  fileBuffer?: Buffer;
  originalFilename?: string;
  fileSize?: number;
};

type FirmwareUpdate = {
  title?: string;
  description?: string;
};

export class FirmwareService {
  private repository: FirmwareRepository;
  private s3Service: S3Service;

  constructor(firmwareRepository: FirmwareRepository, s3Service: S3Service) {
    this.repository = firmwareRepository;
    this.s3Service = s3Service;
  }

  async create(userId: number, data: FirmwareCreate) {
    const existingVersion = await this.findByVersion(data.version);

    if (existingVersion) {
      throw new AppError("Version already exists", 400);
    }

    if (!data.fileBuffer) {
      throw new AppError("File not found", 400);
    }

    await this.s3Service.uploadFirmware(data.serial, data.fileBuffer, data.version, {
      "uploaded-by": userId.toString(),
    });

    const firmwareKey = `${S3Service.PREFIXES.FIRMWARE}${data.version}/firmware.bin`;
    const firmwareLocation = `https://${this.s3Service.getBucketName()}.s3.${
      config.aws.region
    }.amazonaws.com/${firmwareKey}`;
    const updatedData = { ...data, uploadedBy: userId, path: firmwareKey, location: firmwareLocation };

    return this.repository.create(updatedData);
  }

  async update(firmwareId: number, data: FirmwareUpdate) {
    const existingFirmware = await this.findById(firmwareId);

    if (existingFirmware) {
      throw new AppError("Firmware does not exists", 400);
    }

    return this.repository.update(firmwareId, data);
  }

  async delete(firmwareId: number) {
    const existingFirmware = await this.findById(firmwareId);
    if (!existingFirmware) {
      throw new AppError("Firmware not found", 404);
    }
    await this.s3Service.deleteFirmware(existingFirmware.title, existingFirmware.version);
    return this.repository.delete(firmwareId);
  }

  async findById(firmwareId: number) {
    return this.repository.findById(firmwareId);
  }

  async findByVersion(version: string) {
    return this.repository.findByVersion(version);
  }

  async findMany() {
    return this.repository.findAll();
  }
}
