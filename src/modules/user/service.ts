import { Prisma, Role, User } from "@prisma/client";
import { AppError } from "../../core/utils/error";
import { hashPassword, comparePassword } from "../../core/utils/password";
import {
  UserRepository,
  FindManyUsersParams,
  FindUsersByOrganizationParams,
  UserUploadPictureParams,
} from "./repository";
import { generateResetToken } from "../../core/utils/token";

export interface UserCreateInput
  extends Omit<Prisma.UserUncheckedCreateInput, "passwordChangedAt" | "createdAt" | "updatedAt"> {
  confirmPassword?: string;
  organizationId?: string;
}

export interface UserUpdateInput
  extends Omit<Prisma.UserUncheckedUpdateInput, "passwordChangedAt" | "createdAt" | "updatedAt"> {
  currentPassword?: string;
  confirmPassword?: string;
}

export interface ChangePasswordInput {
  userId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AddUserToOrganizationInput {
  userId: number;
  organizationId: number;
  isAdmin?: boolean;
}

export interface AddUsersToOrganizationInput {
  userIds: number[];
  organizationId: number;
  isAdmin?: boolean;
}

export class UserService {
  private repository: UserRepository;
  private readonly passwordMinLength = 8;

  constructor(userRepository: UserRepository) {
    this.repository = userRepository;
  }

  async createUser(data: UserCreateInput, createdBy?: number): Promise<User> {
    if (!data.password || data.password.length < this.passwordMinLength) {
      throw new AppError(`Password must be at least ${this.passwordMinLength} characters long`, 400);
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      throw new AppError("Passwords do not match", 400);
    }

    const existingUserEmail = await this.repository.findByEmail(data.email);
    if (existingUserEmail) {
      throw new AppError("User with this email already exists", 400);
    }

    const existingUserName = await this.repository.findByUserName(data.userName);
    if (existingUserName) {
      throw new AppError("User with this username already exists", 400);
    }

    const hashedPassword = await hashPassword(data.password);

    const userData: Prisma.UserUncheckedCreateInput = {
      ...data,
      password: hashedPassword,
      createdByUserId: createdBy || null,
      passwordChangedAt: new Date(),
    };

    delete (userData as any).confirmPassword;

    const user = await this.repository.create(userData);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async bulkCreateUsers(dataArray: UserCreateInput[], createdBy?: number): Promise<Prisma.BatchPayload> {
    const emails = new Set<string>();
    const userNames = new Set<string>();

    for (const data of dataArray) {
      if (emails.has(data.email)) {
        throw new AppError(`Duplicate email ${data.email} in the batch`, 400);
      }
      emails.add(data.email);

      if (userNames.has(data.userName)) {
        throw new AppError(`Duplicate username ${data.userName} in the batch`, 400);
      }
      userNames.add(data.userName);

      if (!data.password || data.password.length < this.passwordMinLength) {
        throw new AppError(
          `Password must be at least ${this.passwordMinLength} characters for user ${data.userName}`,
          400
        );
      }

      if (data.confirmPassword && data.password !== data.confirmPassword) {
        throw new AppError(`Passwords do not match for user ${data.userName}`, 400);
      }
    }

    await Promise.all(
      [...emails].map(async (email) => {
        const existingUser = await this.repository.findByEmail(email);
        if (existingUser) {
          throw new AppError(`User with email ${email} already exists`, 400);
        }
      })
    );

    await Promise.all(
      [...userNames].map(async (userName) => {
        const existingUser = await this.repository.findByUserName(userName);
        if (existingUser) {
          throw new AppError(`User with username ${userName} already exists`, 400);
        }
      })
    );

    const usersData: Prisma.UserUncheckedCreateInput[] = await Promise.all(
      dataArray.map(async (data) => {
        const hashedPassword = await hashPassword(data.password);
        const userData: Prisma.UserUncheckedCreateInput = {
          ...data,
          password: hashedPassword,
          createdByUserId: createdBy || null,
          passwordChangedAt: new Date(),
        };

        delete (userData as any).confirmPassword;

        return userData;
      })
    );

    return this.repository.createMany(usersData);
  }

  async updateUser(id: number, data: UserUpdateInput): Promise<User> {
    const existingUser = await this.repository.findById(id);
    if (!existingUser) {
      throw new AppError(`User with ID ${id} not found`, 404);
    }

    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await this.repository.findByEmail(data.email.toString());
      if (userWithEmail) {
        throw new AppError("Email is already in use", 400);
      }
    }

    if (data.userName && data.userName !== existingUser.userName) {
      const userWithUsername = await this.repository.findByUserName(data.userName.toString());
      if (userWithUsername) {
        throw new AppError("Username is already in use", 400);
      }
    }

    let updateData: Prisma.UserUncheckedUpdateInput = { ...data };
    delete (updateData as any).confirmPassword;
    delete (updateData as any).currentPassword;

    if (data.password) {
      if (data.currentPassword) {
        const isPasswordCorrect = await comparePassword(data.currentPassword, existingUser.password);
        if (!isPasswordCorrect) {
          throw new AppError("Current password is incorrect", 400);
        }
      }

      if (data.password.toString().length < this.passwordMinLength) {
        throw new AppError(`Password must be at least ${this.passwordMinLength} characters long`, 400);
      }

      if (data.confirmPassword && data.password !== data.confirmPassword) {
        throw new AppError("Passwords do not match", 400);
      }

      updateData.password = await hashPassword(data.password.toString());
      updateData.passwordChangedAt = new Date();
    }

    const updatedUser = await this.repository.update(id, updateData);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async changePassword(data: ChangePasswordInput): Promise<User> {
    const { userId, currentPassword, newPassword, confirmPassword } = data;

    if (newPassword.length < this.passwordMinLength) {
      throw new AppError(`Password must be at least ${this.passwordMinLength} characters long`, 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError("New passwords do not match", 400);
    }

    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isPasswordCorrect = await comparePassword(currentPassword, user.password);
    if (!isPasswordCorrect) {
      throw new AppError("Current password is incorrect", 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await this.repository.update(userId, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async deleteUser(id: number): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404);
    }

    const deletedUser = await this.repository.delete(id);

    const { password, ...userWithoutPassword } = deletedUser;
    return userWithoutPassword as User;
  }

  async getUser(id: number): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async findUsers(params: FindManyUsersParams): Promise<{ users: Partial<User>[]; total: number }> {
    const { users, total } = await this.repository.findMany(params);

    const usersWithoutPasswords = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return { users: usersWithoutPasswords, total };
  }

  async findUsersByOrganization(
    params: FindUsersByOrganizationParams
  ): Promise<{ users: Partial<User>[]; total: number }> {
    const { users, total } = await this.repository.findUsersByOrganization(params);

    const usersWithoutPasswords = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return { users: usersWithoutPasswords, total };
  }

  async getUsersByOrganizationSimple(organizationId: number): Promise<Partial<User>[]> {
    const users = await this.repository.findUsersByOrganizationSimple(organizationId);

    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async getAdminUsersByOrganization(organizationId: number): Promise<Partial<User>[]> {
    const users = await this.repository.findAdminUsersByOrganization(organizationId);

    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async uploadProfilePicture(params: UserUploadPictureParams): Promise<User> {
    const user = await this.repository.findById(params.userId);
    if (!user) {
      throw new AppError(`User with ID ${params.userId} not found`, 404);
    }

    if (!params.file) {
      throw new AppError("No file provided", 400);
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!allowedMimeTypes.includes(params.file.mimetype)) {
      throw new AppError("File must be an image (JPEG, PNG, or GIF)", 400);
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (params.file.buffer.length > maxSize) {
      throw new AppError("File size must be less than 5MB", 400);
    }

    const updatedUser = await this.repository.uploadProfilePicture(params);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async getUsersWithoutOrganization(): Promise<Partial<User>[]> {
    const users = await this.repository.getUsersWithoutOrganization();

    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async getUsersWithExpiredPasswords(daysThreshold: number = 90): Promise<Partial<User>[]> {
    const users = await this.repository.getUsersWithExpiredPasswords(daysThreshold);

    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async addUserToOrganization(data: AddUserToOrganizationInput) {
    const { userId, organizationId, isAdmin = false } = data;

    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError(`User with ID ${userId} not found`, 404);
    }

    const userOrganization = await this.repository.addUserToOrganization(userId, organizationId, isAdmin);

    return userOrganization;
  }

  async addUsersToOrganization(data: AddUsersToOrganizationInput) {
    const { userIds, organizationId, isAdmin = false } = data;

    const existingUsers = await Promise.all(
      userIds.map(async (userId) => {
        const user = await this.repository.findById(userId);
        if (!user) {
          throw new AppError(`User with ID ${userId} not found`, 404);
        }
        return user;
      })
    );

    const userOrganizations = await this.repository.addUsersToOrganization(userIds, organizationId, isAdmin);

    return userOrganizations;
  }

  async removeUserFromOrganization(userId: number, organizationId: number) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError(`User with ID ${userId} not found`, 404);
    }

    const result = await this.repository.removeUserFromOrganization(userId, organizationId);

    if (result.count === 0) {
      throw new AppError(`User is not a member of organization with ID ${organizationId}`, 404);
    }

    return result;
  }

  async updateUserOrganizationRole(userId: number, organizationId: number, isAdmin: boolean) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError(`User with ID ${userId} not found`, 404);
    }

    const result = await this.repository.updateUserOrganizationRole(userId, organizationId, isAdmin);

    if (result.count === 0) {
      throw new AppError(`User is not a member of organization with ID ${organizationId}`, 404);
    }

    return result;
  }
}
