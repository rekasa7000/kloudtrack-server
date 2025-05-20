import { Router } from "express";
import { AuthController } from "./controller";
import { protect } from "../../core/middlewares/auth.middleware";
import { validateRequest } from "../../core/middlewares/validation.middleware";
import { LoginValidation, RequesPasswordResetValidation } from "./validator";

export class AuthRoutes {
  private router: Router;
  private controller: AuthController;

  constructor(authController: AuthController) {
    this.router = Router();
    this.controller = authController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/login", validateRequest(LoginValidation), this.controller.login);
    this.router.post(
      "/password-reset/request",
      validateRequest(RequesPasswordResetValidation),
      this.controller.requestPasswordReset
    );
    this.router.post("/password-reset", this.controller.resetPassword);
    this.router.get("/profile", protect, this.controller.getProfile);
    this.router.post("/logout", protect, this.controller.logout);
  }

  public getRouter(): Router {
    return this.router;
  }
}
