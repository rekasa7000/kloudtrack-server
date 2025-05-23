import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { UserService, UserCreateInput, UserUpdateInput, ChangePasswordInput, ResetPasswordInput } from "./service";
import { AppError } from "../../core/utils/error";
import { FindManyUsersParams } from "./repository";
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

  getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Not authenticated", 401));
      }

      const user = await this.service.getUser(userId);

      res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  });

  getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return next(new AppError("Invalid user ID", 400));
      }

      const user = await this.service.getUser(userId);

      res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  });

  getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      res.status(200).json({
        status: "success",
        results: users.length,
        pagination: {
          total,
          page: params.page,
          limit: params.limit,
          pages: Math.ceil(total / params.limit!),
        },
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  });

  createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: UserCreateInput = req.body;

      const createdByUserId = req.user?.id;

      const newUser = await this.service.createUser(userData, createdByUserId);

      res.status(201).json({
        status: "success",
        data: { user: newUser },
      });
    } catch (error) {
      next(error);
    }
  });

  bulkCreateUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!Array.isArray(req.body)) {
        return next(new AppError("Request body must be an array of users", 400));
      }

      const usersData: UserCreateInput[] = req.body;

      const createdByUserId = req.user?.id;

      const result = await this.service.bulkCreateUsers(usersData, createdByUserId);

      res.status(201).json({
        status: "success",
        data: {
          count: result.count,
          message: `Successfully created ${result.count} users`,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return next(new AppError("Invalid user ID", 400));
      }

      const userData: UserUpdateInput = req.body;

      const requestingUserId = req.user?.id;
      const isUser = req.user?.role === Role.USER;

      if (isUser && requestingUserId !== userId) {
        return next(new AppError("You do not have permission to update this user", 403));
      }

      const updatedUser = await this.service.updateUser(userId, userData);

      res.status(200).json({
        status: "success",
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  });

  deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return next(new AppError("Invalid user ID", 400));
      }

      const requestingUserId = req.user?.id;
      const isUser = req.user?.role === Role.USER;

      if (requestingUserId === userId) {
        return next(new AppError("Cannot delete your own account", 403));
      }

      if (isUser) {
        return next(new AppError("Only administrators can delete users", 403));
      }

      const deletedUser = await this.service.deleteUser(userId);

      res.status(200).json({
        status: "success",
        data: { user: deletedUser },
      });
    } catch (error) {
      next(error);
    }
  });

  uploadProfilePicture = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return next(new AppError("Invalid user ID", 400));
      }

      const requestingUserId = req.user?.id;
      const isUser = req.user?.role === Role.USER;

      if (isUser && requestingUserId !== userId) {
        return next(new AppError("You do not have permission to update this user's profile picture", 403));
      }

      if (!req.file) {
        return next(new AppError("No file uploaded", 400));
      }

      const updatedUser = await this.service.uploadProfilePicture({
        userId,
        file: {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        },
      });

      res.status(200).json({
        status: "success",
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  });

  changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return next(new AppError("Invalid user ID", 400));
      }

      const requestingUserId = req.user?.id;

      if (requestingUserId !== userId) {
        return next(new AppError("You can only change your own password", 403));
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new AppError("Missing required password fields", 400));
      }

      const passwordData: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
        confirmPassword,
      };

      const updatedUser = await this.service.changePassword(passwordData);

      res.status(200).json({
        status: "success",
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  });

  getUsersWithoutOrganization = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.service.getUsersWithoutOrganization();

      res.status(200).json({
        status: "success",
        results: users.length,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  });

  getUsersWithExpiredPasswords = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { days = "90" } = req.query;
      const daysThreshold = parseInt(days as string);

      if (isNaN(daysThreshold) || daysThreshold <= 0) {
        return next(new AppError("Days must be a positive number", 400));
      }

      const users = await this.service.getUsersWithExpiredPasswords(daysThreshold);

      res.status(200).json({
        status: "success",
        results: users.length,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  });
}
