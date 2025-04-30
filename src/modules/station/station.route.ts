import { Router, Request, Response } from "express";
import {
  createStation,
  deleteStation,
  getAllStations,
  getStationById,
  updateStation,
} from "./station.controller";

const router = Router();

// ALL STATIONS
router.get("/", getAllStations);
// CREATE STATION
router.post("/", createStation);
// UPDATE STATION
router.put("/:id", updateStation);
// DELETE STATION
router.delete("/:id", deleteStation);
// GET STATION BY ID
router.get("/:id", getStationById);

export default router;
