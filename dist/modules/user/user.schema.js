"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkCreateUserSchema = exports.CreateUserSchema = exports.BaseUserSchema = exports.UserRoleEnum = void 0;
const zod_1 = require("zod");
exports.UserRoleEnum = zod_1.z.enum(["user", "admin", "superadmin"]);
exports.BaseUserSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    role: exports.UserRoleEnum.default("user"),
});
exports.CreateUserSchema = exports.BaseUserSchema.extend({
    phoneNumber: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
});
exports.BulkCreateUserSchema = zod_1.z.object({
    users: zod_1.z.array(exports.CreateUserSchema).min(1, "At least one user is required"),
});
