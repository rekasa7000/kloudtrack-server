import { Router } from "express";
import authRoute from "./auth.route";
import deviceRoute from "./device.routes";

const router = Router();

router.use("/api/auth", authRoute);
router.use("/api/device", deviceRoute);

export default router;
