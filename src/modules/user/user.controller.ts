import { Request, Response, NextFunction } from "express";
import prisma from "../../config/database.config";
import { sendResponse } from "../../core/utils/response";
import { hashPassword } from "../../core/utils/password";
import { AppError } from "../../core/utils/error";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";

export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, firstName, lastName, role, ...otherData } =
      req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError("User with this email already exists", 400));
    }

    if (role !== "user" && req.user?.role !== "superadmin") {
      return next(
        new AppError("Only superadmin can create admin accounts", 403)
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        ...otherData,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "User created successfully",
      data: newUser,
    });
  }
);

export const bulkCreateUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { users } = req.body;

    const createdUsers = await prisma.$transaction(async (db) => {
      const results: any = [];

      for (const userData of users) {
        const {
          email,
          password,
          firstName,
          lastName,
          role = "user",
          ...otherData
        } = userData;

        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
          throw new AppError(`User with email ${email} already exists`, 400);
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await db.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            ...otherData,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
          },
        });

        results.push(newUser);
      }

      return results;
    });

    return sendResponse(res, {
      success: true,
      statusCode: 201,
      message: `Successfully created ${createdUsers.length} users`,
      data: createdUsers,
    });
  }
);

export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!userToUpdate) {
      return next(new AppError("User not found", 404));
    }

    const { role } = req.body;
    const requestUser = req.user!;

    if (
      requestUser.role !== "admin" &&
      requestUser.role !== "SUPERADMIN" &&
      requestUser.id !== userId
    ) {
      return next(new AppError("You can only update your own profile", 403));
    }

    if (
      role &&
      role !== userToUpdate.role &&
      requestUser.role !== "SUPERADMIN"
    ) {
      return next(new AppError("Only superadmin can change user roles", 403));
    }

    if (
      (userToUpdate.role === "ADMIN" || userToUpdate.role === "SUPERADMIN") &&
      requestUser.role !== "SUPERADMIN"
    ) {
      return next(
        new AppError("You don't have permission to modify this user", 403)
      );
    }

    const { password, ...updateData } = req.body;

    const dataToUpdate: any = { ...updateData };
    if (password) {
      dataToUpdate.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        profilePicture: true,
        updatedAt: true,
      },
    });

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User updated successfully",
      data: updatedUser,
    });
  }
);

const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!userToDelete) {
      return next(new AppError("User not found", 404));
    }

    if (
      (userToDelete.role === "ADMIN" || userToDelete.role === "SUPERADMIN") &&
      req.user!.role !== "SUPERADMIN"
    ) {
      return next(
        new AppError(
          "Only superadmin can delete admin or superadmin users",
          403
        )
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User deleted successfully",
    });
  }
);

export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    if (
      req.user!.role !== "ADMIN" &&
      req.user!.role !== "SUPERADMIN" &&
      req.user!.id !== userId
    ) {
      return next(new AppError("You can only view your own profile", 403));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User retrieved successfully",
      data: user,
    });
  }
);

export const getAllUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await prisma.user.count();

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Users retrieved successfully",
      data: users,
      meta: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  }
);
