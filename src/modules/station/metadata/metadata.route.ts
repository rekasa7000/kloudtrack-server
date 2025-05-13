import { Router, Request, Response } from "express";
import { validateRequest } from "../../../core/middlewares/validation.middleware";
import {
  createStationSchema,
  getAllStationsSchema,
  stationIdSchema,
  updateStationSchema,
} from "./metadata.schema";
import { protect } from "../../../core/middlewares/auth.middleware";
import StationController from "./metadata.controller";

const router = Router();

const stationController = new StationController();
router.get(
  "/",
  validateRequest(getAllStationsSchema),
  stationController.getAll
);
router.post(
  "/",
  protect,
  validateRequest(createStationSchema),
  stationController.create
);
router.put(
  "/:id",
  validateRequest(updateStationSchema),
  stationController.update
);
router.delete(
  "/:id",
  validateRequest(stationIdSchema),
  stationController.delete
);
router.get("/:id", validateRequest(stationIdSchema), stationController.getById);

export default router;
