import prisma from "../../config/database.config";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import { generateToken } from "../../core/services/auth.service";
import logger from "../../core/utils/logger";
import { sendResponse } from "../../core/utils/response";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      userName: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      password: true,
      userOrganizations: {
        include: {
          organization: {
            select: {
              id: true,
              organizationName: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const token = generateToken(user.id, res);

  const userData = {
    id: user.id,
    userName: user.userName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    organizations: user.userOrganizations.map((uo) => ({
      id: uo.organization.id,
      name: uo.organization.organizationName,
      isAdmin: uo.isAdmin,
    })),
  };

  return res.status(200).json({
    success: true,
    message: "Sign in successful",
    token,
    user: userData,
  });
});

export const checkAuth = asyncHandler(async (req: Request, res: Response) => {
  logger.info(`${req.user?.email} - User authenticated`);
  return sendResponse(res, req.user, 200, "Authenticated");
});
