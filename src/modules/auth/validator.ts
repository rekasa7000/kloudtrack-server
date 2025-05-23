import { z } from "zod";

export const LoginValidation = z.object({
  body: z.object({
    email: z.string().email("Invalid email address."),
    password: z.string().min(8, "Password is required."),
  }),
});

export const RequesPasswordResetValidation = z.object({
  body: z.object({
    email: z.string().email("Invalid email address."),
  }),
});

export const PasswordResetValidation = z.object({
  body: z.object({
    code: z.string().min(1, "Code is required."),
    newPassword: z.string().min(8, "New password is required."),
  }),
});
