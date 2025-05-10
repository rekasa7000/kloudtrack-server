import { Router, Request, Response } from "express";
import {
  createStation,
  deleteStation,
  getAllStations,
  getStationById,
  updateStation,
} from "./metadata.controller";
import { validateRequest } from "../../../core/middlewares/validation.middleware";
import {
  createStationSchema,
  getAllStationsSchema,
  stationIdSchema,
  updateStationSchema,
} from "./metadata.schema";
import { protect } from "../../../core/middlewares/auth.middleware";

const router = Router();

// ALL STATIONS
router.get("/", validateRequest(getAllStationsSchema), getAllStations);
// CREATE STATION
router.post("/", protect, validateRequest(createStationSchema), createStation);
// UPDATE STATION
router.put("/:id", validateRequest(updateStationSchema), updateStation);
// DELETE STATION
router.delete("/:id", validateRequest(stationIdSchema), deleteStation);
// GET STATION BY ID
router.get("/:id", validateRequest(stationIdSchema), getStationById);

export default router;
