import { z } from "zod";

export const UserRoleEnum = z.enum(["USER", "ADMIN", "SUPERADMIN"]);

export const BaseUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: UserRoleEnum.default("USER"),
});

export const CreateUserSchema = BaseUserSchema.extend({
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const BulkCreateUserSchema = z.object({
  users: z.array(CreateUserSchema).min(1, "At least one user is required"),
});
