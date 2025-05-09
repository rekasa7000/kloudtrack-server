import { Router } from "express";
import stationRoute from "./modules/station/station.route";
import certificateRoute from "./modules/certificate/certificate.route";
import { authRouter } from "./modules/auth/auth.route";

const router = Router();

router.use("/auth", authRouter);
router.use("/api/station", stationRoute);
router.use("/api/station", certificateRoute);

export default router;
