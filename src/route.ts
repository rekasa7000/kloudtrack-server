import { Router } from "express";
import stationRoute from "./modules/station/station.route";
import authRoute from "./modules/auth/auth.route";
import { protect } from "./core/middlewares/auth.middleware";

const router = Router();

router.use("/api/auth", authRoute);
router.use("/api/station", protect, stationRoute);

export default router;
