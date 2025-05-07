"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.getUserById = exports.updateUser = exports.bulkCreateUsers = exports.createUser = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const response_1 = require("../../core/utils/response");
const password_1 = require("../../core/utils/password");
const error_1 = require("../../core/utils/error");
const error_handler_middleware_1 = require("../../core/middlewares/error-handler.middleware");
exports.createUser = (0, error_handler_middleware_1.asyncHandler)(async (req, res, next) => {
    const { email, password, firstName, lastName, role, ...otherData } = req.body;
    const existingUser = await database_config_1.default.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        return next(new error_1.AppError("User with this email already exists", 400));
    }
    if (role !== "user" && req.user?.role !== "superadmin") {
        return next(new error_1.AppError("Only superadmin can create admin accounts", 403));
    }
    const hashedPassword = await (0, password_1.hashPassword)(password);
    const newUser = await database_config_1.default.user.create({
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
    return (0, response_1.sendResponse)(res, {
        success: true,
        statusCode: 201,
        message: "User created successfully",
        data: newUser,
    });
});
exports.bulkCreateUsers = (0, error_handler_middleware_1.asyncHandler)(async (req, res, next) => {
    const { users } = req.body;
    const createdUsers = await database_config_1.default.$transaction(async (db) => {
        const results = [];
        for (const userData of users) {
            const { email, password, firstName, lastName, role = "user", ...otherData } = userData;
            const existing = await db.user.findUnique({ where: { email } });
            if (existing) {
                throw new error_1.AppError(`User with email ${email} already exists`, 400);
            }
            const hashedPassword = await (0, password_1.hashPassword)(password);
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
    return (0, response_1.sendResponse)(res, {
        success: true,
        statusCode: 201,
        message: `Successfully created ${createdUsers.length} users`,
        data: createdUsers,
    });
});
exports.updateUser = (0, error_handler_middleware_1.asyncHandler)(async (req, res, next) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return next(new error_1.AppError("Invalid user ID", 400));
    }
    const userToUpdate = await database_config_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!userToUpdate) {
        return next(new error_1.AppError("User not found", 404));
    }
    const { role } = req.body;
    const requestUser = req.user;
    if (requestUser.role !== "admin" &&
        requestUser.role !== "SUPERADMIN" &&
        requestUser.id !== userId) {
        return next(new error_1.AppError("You can only update your own profile", 403));
    }
    if (role &&
        role !== userToUpdate.role &&
        requestUser.role !== "SUPERADMIN") {
        return next(new error_1.AppError("Only superadmin can change user roles", 403));
    }
    if ((userToUpdate.role === "ADMIN" || userToUpdate.role === "SUPERADMIN") &&
        requestUser.role !== "SUPERADMIN") {
        return next(new error_1.AppError("You don't have permission to modify this user", 403));
    }
    const { password, ...updateData } = req.body;
    const dataToUpdate = { ...updateData };
    if (password) {
        dataToUpdate.password = await (0, password_1.hashPassword)(password);
    }
    const updatedUser = await database_config_1.default.user.update({
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
    return (0, response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "User updated successfully",
        data: updatedUser,
    });
});
const deleteUser = (0, error_handler_middleware_1.asyncHandler)(async (req, res, next) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return next(new error_1.AppError("Invalid user ID", 400));
    }
    const userToDelete = await database_config_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!userToDelete) {
        return next(new error_1.AppError("User not found", 404));
    }
    if ((userToDelete.role === "ADMIN" || userToDelete.role === "SUPERADMIN") &&
        req.user.role !== "SUPERADMIN") {
        return next(new error_1.AppError("Only superadmin can delete admin or superadmin users", 403));
    }
    await database_config_1.default.user.delete({
        where: { id: userId },
    });
    return (0, response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "User deleted successfully",
    });
});
exports.getUserById = (0, error_handler_middleware_1.asyncHandler)(async (req, res, next) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return next(new error_1.AppError("Invalid user ID", 400));
    }
    if (req.user.role !== "ADMIN" &&
        req.user.role !== "SUPERADMIN" &&
        req.user.id !== userId) {
        return next(new error_1.AppError("You can only view your own profile", 403));
    }
    const user = await database_config_1.default.user.findUnique({
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
        return next(new error_1.AppError("User not found", 404));
    }
    return (0, response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "User retrieved successfully",
        data: user,
    });
});
exports.getAllUsers = (0, error_handler_middleware_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const totalUsers = await database_config_1.default.user.count();
    const users = await database_config_1.default.user.findMany({
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
    return (0, response_1.sendResponse)(res, {
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
});
