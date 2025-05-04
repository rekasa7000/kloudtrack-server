import { Router } from "express";
import certificateRoute from "./certificate/certificate.route";
import stationRoute from "./metadata/metadata.route";

const router = Router();

router.use("/", stationRoute);
router.use("/certificate", certificateRoute);

export default router;
