import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { setAuthCookie } from "../../core/utils/jwt.util";
import { sendResponse } from "../../core/utils/response";
import { AppError } from "../../core/utils/error";

export class AuthController {
  constructor(private authService: AuthService) {}

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const { user, token } = await this.authService.login(email, password);

    setAuthCookie(res, token);

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
    const user = await this.authService.getProfile(req.user.id);
    return sendResponse(res, user);
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.clearCookie("kloudtrack-jwt");
    return sendResponse(res, null, 200, "Logged out successful");
  });

  requestPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    await this.authService.requestPasswordReset(email);

    return sendResponse(res, null, 200, "Verification sent to your email.");
  });

  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code, newPassword } = req.body;
    if (!code || !newPassword) {
      throw new AppError("Verification code and new password is required", 401);
    }
    await this.authService.resetPassword(code, newPassword);
    return sendResponse(res, null, 200, "Password reset successful");
  });
}
