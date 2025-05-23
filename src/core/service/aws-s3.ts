import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

export interface S3ServiceConfig {
  bucketName: string;
  s3Client?: S3Client;
  region?: string;
}

export interface PutObjectOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  prefix?: string;
  tags?: Record<string, string>;
}

export interface ListObjectsOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export enum ContentType {
  PEM = "application/x-pem-file",
  CCRT = "application/x-x509-user-cert",
  CRT = "application/x-x509-ca-cert",

  JPEG = "image/jpeg",
  PNG = "image/png",
  GIF = "image/gif",
  WEBP = "image/webp",
  SVG = "image/svg+xml",

  BIN = "application/octet-stream",
  HEX = "application/octet-stream",
  FIRMWARE = "application/x-firmware",

  JSON = "application/json",
  XML = "application/xml",
  TEXT = "text/plain",

  ZIP = "application/zip",
  TAR_GZ = "application/gzip",
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  static readonly PREFIXES = {
    CERTIFICATES: "certificates/",
    IMAGES: "images/",
    FIRMWARE: "firmware/",
    DOCUMENTS: "documents/",
    TEMP: "temp/",
    BACKUPS: "backups/",
  } as const;

  constructor(config: S3ServiceConfig) {
    this.bucketName = config.bucketName;
    this.s3Client =
      config.s3Client ||
      new S3Client({
        region: config.region || process.env.AWS_REGION || "us-east-1",
      });
  }

  async getObject(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const body = response.Body;

      if (!body) {
        throw new Error(`Object not found in S3: ${key}`);
      }

      return await body.transformToString();
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        throw new Error(`Object not found in S3: ${key}`);
      }
      throw new Error(`Error reading object from S3: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const body = response.Body;

      if (!body) {
        throw new Error(`Object not found in S3: ${key}`);
      }

      const byteArray = await body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        throw new Error(`Object not found in S3: ${key}`);
      }
      throw new Error(`Error reading object from S3: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async putObject(key: string, content: string | Buffer, options?: PutObjectOptions): Promise<void> {
    try {
      const fullKey = options?.prefix ? `${options.prefix}${key}` : key;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
        Body: content,
        ContentType: options?.contentType || ContentType.TEXT,
        Metadata: options?.metadata,
        Tagging: options?.tags ? this.formatTags(options.tags) : undefined,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(`Error uploading object to S3: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async deleteObject(key: string, throwOnError: boolean = false): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      const errorMessage = `Could not delete S3 object ${key}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;

      if (throwOnError) {
        throw new Error(errorMessage);
      } else {
        console.warn(errorMessage);
      }
    }
  }

  async listObjects(options?: ListObjectsOptions) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: options?.prefix,
        MaxKeys: options?.maxKeys || 1000,
        ContinuationToken: options?.continuationToken,
      });

      const response = await this.s3Client.send(command);

      return {
        objects: response.Contents || [],
        isTruncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
        count: response.KeyCount || 0,
      };
    } catch (error) {
      throw new Error(`Error listing objects from S3: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.getObject(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async uploadCertificate(certificateId: string, content: string, metadata?: Record<string, string>): Promise<void> {
    const key = `${certificateId}.pem`;
    await this.putObject(key, content, {
      prefix: S3Service.PREFIXES.CERTIFICATES,
      contentType: ContentType.PEM,
      metadata: {
        type: "certificate",
        "certificate-id": certificateId,
        "uploaded-at": new Date().toISOString(),
        ...metadata,
      },
      tags: {
        Type: "Certificate",
        Environment: process.env.NODE_ENV || "development",
      },
    });
  }

  async getCertificate(certificateId: string): Promise<string> {
    const key = `${S3Service.PREFIXES.CERTIFICATES}${certificateId}.pem`;
    return await this.getObject(key);
  }

  async deleteCertificate(certificateId: string): Promise<void> {
    const key = `${S3Service.PREFIXES.CERTIFICATES}${certificateId}.pem`;
    await this.deleteObject(key);
  }

  async uploadImage(
    imageId: string,
    imageBuffer: Buffer,
    imageType: "jpeg" | "png" | "gif" | "webp" | "svg",
    metadata?: Record<string, string>
  ): Promise<void> {
    const extension = imageType === "jpeg" ? "jpg" : imageType;
    const key = `${imageId}.${extension}`;

    const contentTypeMap = {
      jpeg: ContentType.JPEG,
      png: ContentType.PNG,
      gif: ContentType.GIF,
      webp: ContentType.WEBP,
      svg: ContentType.SVG,
    };

    await this.putObject(key, imageBuffer, {
      prefix: S3Service.PREFIXES.IMAGES,
      contentType: contentTypeMap[imageType],
      metadata: {
        type: "image",
        "image-id": imageId,
        "image-format": imageType,
        "uploaded-at": new Date().toISOString(),
        ...metadata,
      },
      tags: {
        Type: "Image",
        Format: imageType.toUpperCase(),
        Environment: process.env.NODE_ENV || "development",
      },
    });
  }

  async getImage(imageId: string, extension: string): Promise<Buffer> {
    const key = `${S3Service.PREFIXES.IMAGES}${imageId}.${extension}`;
    return await this.getObjectBuffer(key);
  }

  async deleteImage(imageId: string, extension: string): Promise<void> {
    const key = `${S3Service.PREFIXES.IMAGES}${imageId}.${extension}`;
    await this.deleteObject(key);
  }

  async uploadFirmware(
    firmwareId: string,
    firmwareBuffer: Buffer,
    version: string,
    deviceType: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    const key = `${deviceType}/${firmwareId}_v${version}.bin`;

    await this.putObject(key, firmwareBuffer, {
      prefix: S3Service.PREFIXES.FIRMWARE,
      contentType: ContentType.FIRMWARE,
      metadata: {
        type: "firmware",
        "firmware-id": firmwareId,
        version: version,
        "device-type": deviceType,
        "uploaded-at": new Date().toISOString(),
        size: firmwareBuffer.length.toString(),
        ...metadata,
      },
      tags: {
        Type: "Firmware",
        Version: version,
        DeviceType: deviceType,
        Environment: process.env.NODE_ENV || "development",
      },
    });
  }

  async getFirmware(firmwareId: string, version: string, deviceType: string): Promise<Buffer> {
    const key = `${S3Service.PREFIXES.FIRMWARE}${deviceType}/${firmwareId}_v${version}.bin`;
    return await this.getObjectBuffer(key);
  }

  async deleteFirmware(firmwareId: string, version: string, deviceType: string): Promise<void> {
    const key = `${S3Service.PREFIXES.FIRMWARE}${deviceType}/${firmwareId}_v${version}.bin`;
    await this.deleteObject(key);
  }

  async listFirmwareVersions(deviceType: string): Promise<any[]> {
    const result = await this.listObjects({
      prefix: `${S3Service.PREFIXES.FIRMWARE}${deviceType}/`,
    });

    return result.objects.map((obj) => ({
      key: obj.Key,
      lastModified: obj.LastModified,
      size: obj.Size,
      version: this.extractVersionFromKey(obj.Key || ""),
    }));
  }

  getBucketName(): string {
    return this.bucketName;
  }

  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");
  }

  private extractVersionFromKey(key: string): string {
    const match = key.match(/_v([^.]+)\./);
    return match ? match[1] : "unknown";
  }
}
