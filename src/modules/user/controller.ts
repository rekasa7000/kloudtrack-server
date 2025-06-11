import { Request, Response } from "express";
import { Role } from "@prisma/client";
import {
  UserService,
  UserCreateInput,
  UserUpdateInput,
  ChangePasswordInput,
  ResetPasswordInput,
  AddUserToOrganizationInput,
  AddUsersToOrganizationInput,
} from "./service";
import { AppError } from "../../core/utils/error";
import { FindManyUsersParams, FindUsersByOrganizationParams } from "./repository";
import { sendResponse } from "../../core/utils/response"; // Import the sendResponse utility
import multer from "multer";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export const uploadProfilePictureMiddleware = upload.single("profilePicture");

export class UserController {
  private service: UserService;

  constructor(userService: UserService) {
    this.service = userService;
  }

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Not authenticated", 401);
    }

    const user = await this.service.getUser(userId);
    sendResponse(res, { user });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    const user = await this.service.getUser(userId);
    sendResponse(res, { user });
  });

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "10",
      search = "",
      role,
      orderField = "createdAt",
      orderDirection = "desc",
    } = req.query;

    const params: FindManyUsersParams = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      searchTerm: search as string,
      orderBy: {
        field: orderField as any,
        direction: orderDirection as "asc" | "desc",
      },
    };

    if (role && Object.values(Role).includes(role as Role)) {
      params.role = role as Role;
    }

    const { users, total } = await this.service.findUsers(params);

    sendResponse(res, {
      users,
      results: users.length,
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(total / params.limit!),
      },
    });
  });

  getUsersByOrganization = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = parseInt(req.params.organizationId);

    if (isNaN(organizationId)) {
      throw new AppError("Invalid organization ID", 400);
    }

    const {
      page = "1",
      limit = "10",
      search = "",
      role,
      isAdmin,
      orderField = "createdAt",
      orderDirection = "desc",
    } = req.query;

    const params: FindUsersByOrganizationParams = {
      organizationId,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      searchTerm: search as string,
      orderBy: {
        field: orderField as any,
        direction: orderDirection as "asc" | "desc",
      },
    };

    if (role && Object.values(Role).includes(role as Role)) {
      params.role = role as Role;
    }

    if (isAdmin !== undefined) {
      params.isAdmin = isAdmin === "true";
    }

    const { users, total } = await this.service.findUsersByOrganization(params);

    sendResponse(res, {
      users,
      results: users.length,
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(total / params.limit!),
      },
    });
  });

  getUsersByOrganizationSimple = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = parseInt(req.params.organizationId);

    if (isNaN(organizationId)) {
      throw new AppError("Invalid organization ID", 400);
    }

    const users = await this.service.getUsersByOrganizationSimple(organizationId);

    sendResponse(res, {
      users,
      results: users.length,
    });
  });

  getAdminUsersByOrganization = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = parseInt(req.params.organizationId);

    if (isNaN(organizationId)) {
      throw new AppError("Invalid organization ID", 400);
    }

    const users = await this.service.getAdminUsersByOrganization(organizationId);

    sendResponse(res, {
      users,
      results: users.length,
    });
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData: UserCreateInput = req.body;
    const createdByUserId = req.user?.id;

    const newUser = await this.service.createUser(userData, createdByUserId);

    sendResponse(res, { user: newUser }, 201, "User created successfully");
  });

  bulkCreateUsers = asyncHandler(async (req: Request, res: Response) => {
    if (!Array.isArray(req.body)) {
      throw new AppError("Request body must be an array of users", 400);
    }

    const usersData: UserCreateInput[] = req.body;
    const createdByUserId = req.user?.id;

    const result = await this.service.bulkCreateUsers(usersData, createdByUserId);

    sendResponse(
      res,
      {
        count: result.count,
      },
      201,
      `Successfully created ${result.count} users`
    );
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    const userData: UserUpdateInput = req.body;
    const requestingUserId = req.user?.id;
    const isUser = req.user?.role === Role.USER;

    if (isUser && requestingUserId !== userId) {
      throw new AppError("You do not have permission to update this user", 403);
    }

    const updatedUser = await this.service.updateUser(userId, userData);

    sendResponse(res, { user: updatedUser }, 200, "User updated successfully");
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    const requestingUserId = req.user?.id;
    const isUser = req.user?.role === Role.USER;

    if (requestingUserId === userId) {
      throw new AppError("Cannot delete your own account", 403);
    }

    if (isUser) {
      throw new AppError("Only administrators can delete users", 403);
    }

    const deletedUser = await this.service.deleteUser(userId);

    sendResponse(res, { user: deletedUser }, 200, "User deleted successfully");
  });

  uploadProfilePicture = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    const requestingUserId = req.user?.id;
    const isUser = req.user?.role === Role.USER;

    if (isUser && requestingUserId !== userId) {
      throw new AppError("You do not have permission to update this user's profile picture", 403);
    }

    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const updatedUser = await this.service.uploadProfilePicture({
      userId,
      file: {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      },
    });

    sendResponse(res, { user: updatedUser }, 200, "Profile picture uploaded successfully");
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    const requestingUserId = req.user?.id;

    if (requestingUserId !== userId) {
      throw new AppError("You can only change your own password", 403);
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError("Missing required password fields", 400);
    }

    const passwordData: ChangePasswordInput = {
      userId,
      currentPassword,
      newPassword,
      confirmPassword,
    };

    const updatedUser = await this.service.changePassword(passwordData);

    sendResponse(res, { user: updatedUser }, 200, "Password changed successfully");
  });

  getUsersWithoutOrganization = asyncHandler(async (_req: Request, res: Response) => {
    const users = await this.service.getUsersWithoutOrganization();

    sendResponse(res, {
      users,
      results: users.length,
    });
  });

  getUsersWithExpiredPasswords = asyncHandler(async (req: Request, res: Response) => {
    const { days = "90" } = req.query;
    const daysThreshold = parseInt(days as string);

    if (isNaN(daysThreshold) || daysThreshold <= 0) {
      throw new AppError("Days must be a positive number", 400);
    }

    const users = await this.service.getUsersWithExpiredPasswords(daysThreshold);

    sendResponse(res, {
      users,
      results: users.length,
    });
  });

  addUserToOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { userId, organizationId, isAdmin = false } = req.body;

    if (!userId || !organizationId) {
      throw new AppError("userId and organizationId are required", 400);
    }

    if (typeof userId !== "number" || typeof organizationId !== "number") {
      throw new AppError("userId and organizationId must be numbers", 400);
    }

    const data: AddUserToOrganizationInput = {
      userId,
      organizationId,
      isAdmin: Boolean(isAdmin),
    };

    const userOrganization = await this.service.addUserToOrganization(data);

    sendResponse(res, { userOrganization }, 201, "User added to organization successfully");
  });

  addUsersToOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { userIds, organizationId, isAdmin = false } = req.body;

    if (!userIds || !organizationId) {
      throw new AppError("userIds and organizationId are required", 400);
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError("userIds must be a non-empty array", 400);
    }

    if (typeof organizationId !== "number") {
      throw new AppError("organizationId must be a number", 400);
    }

    if (!userIds.every((id) => typeof id === "number")) {
      throw new AppError("All userIds must be numbers", 400);
    }

    const data: AddUsersToOrganizationInput = {
      userIds,
      organizationId,
      isAdmin: Boolean(isAdmin),
    };

    const result = await this.service.addUsersToOrganization(data);

    sendResponse(
      res,
      {
        count: result.count,
      },
      201,
      `Successfully added ${result.count} users to organization`
    );
  });

  removeUserFromOrganization = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const organizationId = parseInt(req.params.organizationId);

    if (isNaN(userId) || isNaN(organizationId)) {
      throw new AppError("Invalid userId or organizationId", 400);
    }

    const result = await this.service.removeUserFromOrganization(userId, organizationId);

    sendResponse(
      res,
      {
        count: result.count,
      },
      200,
      "User successfully removed from organization"
    );
  });

  updateUserOrganizationRole = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const organizationId = parseInt(req.params.organizationId);
    const { isAdmin } = req.body;

    if (isNaN(userId) || isNaN(organizationId)) {
      throw new AppError("Invalid userId or organizationId", 400);
    }

    if (typeof isAdmin !== "boolean") {
      throw new AppError("isAdmin must be a boolean", 400);
    }

    const result = await this.service.updateUserOrganizationRole(userId, organizationId, isAdmin);

    sendResponse(
      res,
      {
        count: result.count,
      },
      200,
      `User role successfully updated to ${isAdmin ? "admin" : "member"}`
    );
  });
}
