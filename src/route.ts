import { Router } from "express";
import authRoute from "./modules/auth/auth.route";
import stationRoute from "./modules/station/station.route";

const router = Router();

router.use("/api/auth", authRoute);
router.use("/api/station", stationRoute);

export default router;
