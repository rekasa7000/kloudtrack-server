import { Prisma, PrismaClient, User, Role } from "@prisma/client";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export interface FindManyUsersParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: Role;
  orderBy?: {
    field: keyof User;
    direction: "asc" | "desc";
  };
}

export interface UserUploadPictureParams {
  userId: number;
  file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  };
}

export class UserRepository {
  private prisma: PrismaClient;
  private s3Client: S3Client;
  private readonly bucketName: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET || "user-profile-pictures";
  }

  async create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createMany(data: Prisma.UserUncheckedCreateInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.user.createMany({ data });
  }

  async update(id: number, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    return this.prisma.user.update({ data, where: { id } });
  }

  async delete(id: number): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userOrganizations: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUserName(userName: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { userName } });
  }

  async findMany(params: FindManyUsersParams = {}): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, searchTerm = "", role, orderBy = { field: "createdAt", direction: "desc" } } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (searchTerm) {
      where.OR = [
        { userName: { contains: searchTerm, mode: "insensitive" } },
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy.field]: orderBy.direction },
        include: {
          userOrganizations: {
            include: {
              organization: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async uploadProfilePicture({ userId, file }: UserUploadPictureParams): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    if (user.profilePicture) {
      try {
        const oldKey = user.profilePicture.split("/").pop();
        if (oldKey) {
          // Logic to delete old file from S3 would go here
        }
      } catch (error) {
        console.error("Error deleting old profile picture:", error);
      }
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}-${uuidv4()}${fileExtension}`;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: `profile-pictures/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      },
    });

    await upload.done();

    const profilePicture = `https://${this.bucketName}.s3.amazonaws.com/profile-pictures/${fileName}`;

    return this.update(userId, { profilePicture });
  }

  async getUsersWithoutOrganization(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        userOrganizations: {
          none: {},
        },
      },
    });
  }

  async getUsersWithExpiredPasswords(daysThreshold: number): Promise<User[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    return this.prisma.user.findMany({
      where: {
        OR: [
          { passwordChangedAt: { lt: thresholdDate } },
          {
            AND: [{ passwordChangedAt: null }, { createdAt: { lt: thresholdDate } }],
          },
        ],
      },
    });
  }
}
