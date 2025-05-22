import { Request, Response } from "express";
import { AuthService } from "./service";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../core/utils/response";
import { AppError } from "../../core/utils/error";
import { logger } from "../../core/utils/logger";

export class AuthController {
  private service: AuthService;
  constructor(authService: AuthService) {
    this.service = authService;
  }

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { user, token } = await this.service.login(email, password, res);

      return sendResponse(
        res,
        {
          id: user.id,
          userName: user.userName,
          email: user.email,
          role: user.role,
          token,
        },
        201,
        "Login successful"
      );
    } catch (error) {
      logger.error(error);
      throw new AppError("Error on login controller", 500);
    }
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError("Unauthorized", 401);
      }
      const user = await this.service.getProfile(req.user.id);
      return sendResponse(res, user);
    } catch (error) {
      logger.error(error);
      throw new AppError("Error on get profile", 500);
    }
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      res.clearCookie("kloudtrack-jwt");
      return sendResponse(res, null, 200, "Logged out successful");
    } catch (error) {
      logger.error(error);
      throw new AppError("Error on logout controller", 500);
    }
  });

  requestPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      await this.service.requestPasswordReset(email);

      return sendResponse(res, null, 200, "Verification sent to your email.");
    } catch (error) {
      logger.error(error);
      throw new AppError("Error on password request reset controller", 500);
    }
  });

  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, newPassword } = req.body;
      if (!code || !newPassword) {
        throw new AppError("Verification code and new password is required", 401);
      }
      await this.service.resetPassword(code, newPassword);
      return sendResponse(res, null, 200, "Password reset successful");
    } catch (error) {
      logger.error(error);
      throw new AppError("Error on password reset controller", 500);
    }
  });
}
