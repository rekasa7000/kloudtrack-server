import { Router } from "express";
import authRoute from "./modules/auth/auth.route";
import stationRoute from "./modules/station/station.route";
import certificateRoute from "./modules/certificate/certificate.route";
import dataAnalysisRoute from "./modules/data-analysis/data-analysis.route";
import requestActivation from "./modules/station/station.route";

const router = Router();

router.use("/auth", authRoute);
router.use("/station", stationRoute);
router.use("/station", certificateRoute);
router.use("/data-analysis", dataAnalysisRoute)

export default router;
