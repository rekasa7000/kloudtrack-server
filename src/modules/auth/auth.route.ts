import { Router } from "express";
import { AuthController } from "./auth.controller";
import { protect } from "../../core/middlewares/auth.middleware";
import { validateRequest } from "../../core/middlewares/validation.middleware";
import { LoginValidation, RequesPasswordResetValidation } from "./auth.validator";

export class AuthRoutes {
  private router: Router;
  private authController: AuthController;

  constructor(authController: AuthController) {
    this.router = Router();
    this.authController = authController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/login", validateRequest(LoginValidation), this.authController.login);
    this.router.post(
      "/password-reset/request",
      validateRequest(RequesPasswordResetValidation),
      this.authController.requestPasswordReset
    );
    this.router.post("/password-reset", this.authController.resetPassword);

    // Protected
    this.router.get("/profile", protect, this.authController.getProfile);
    this.router.post("/logout", protect, this.authController.logout);
  }

  public getRouter(): Router {
    return this.router;
  }
}
