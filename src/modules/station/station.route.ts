import { Router } from "express";
import certificateRoute from "./certificate/certificate.route";
import { StationRoutes } from "./metadata/metadata.route";

const router = Router();
const stationRoutes = new StationRoutes();

router.use("/", stationRoutes.getRouter());
router.use("/certificate", certificateRoute);

export default router;
