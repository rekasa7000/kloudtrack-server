import { Request, Response } from "express";
import { AuthService } from "./service";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../core/utils/response";
import { AppError } from "../../core/utils/error";
import { config } from "../../config/environment";

export class AuthController {
  private service: AuthService;
  constructor(authService: AuthService) {
    this.service = authService;
  }

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    console.log(req.body);
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
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }
    const user = await this.service.getProfile(req.user.id);
    return sendResponse(res, user);
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.clearCookie(config.cookie);
    return sendResponse(res, null, 200, "Logged out successful");
  });

  requestPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    await this.service.requestPasswordReset(email);

    return sendResponse(res, null, 200, "Verification sent to your email.");
  });

  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code, newPassword } = req.body;
    if (!code || !newPassword) {
      throw new AppError("Verification code and new password is required", 401);
    }
    await this.service.resetPassword(code, newPassword);
    return sendResponse(res, null, 200, "Password reset successful");
  });
}
