import { Router } from "express";
import authRoute from "./modules/auth/auth.route";
import stationRoute from "./modules/station/station.route";
import certificateRoute from "./modules/certificate/certificate.route";

const router = Router();

router.use("/api/auth", authRoute);
router.use("/api/station", stationRoute);
router.use("/api/certificate", certificateRoute);

export default router;
