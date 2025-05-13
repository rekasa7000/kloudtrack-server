import { Router } from "express";
import stationRoute from "./modules/station/station.route";
import { protect } from "./core/middlewares/auth.middleware";
import { AuthRoutes } from "./modules/auth/auth.route";
import { AuthController } from "./modules/auth/auth.controller";
import { AuthService } from "./modules/auth/auth.service";
import nodemailer from "nodemailer";
import { AuthRepository } from "./modules/auth/auth.repository";

const router = Router();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "no-reply@kloudtechsea.com",
    pass: process.env.SMTP_PASSWORD || "Kloudtech123456789!",
  },
});
const authRepository = new AuthRepository();
const authService = new AuthService(transporter, authRepository);
const authController = new AuthController(authService);

const authRoutes = new AuthRoutes(authController);

router.use("/api/auth", authRoutes.getRouter());
router.use("/api/station", protect, stationRoute);

export default router;
