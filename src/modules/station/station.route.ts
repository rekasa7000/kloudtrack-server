import { Router, Request, Response } from "express";
import {
  createStation,
  deleteStation,
  getAllStations,
  getStationById,
  updateStation,
  requestActivation,
  requestDeactivation } from "./station.controller";

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
// POST REQUEST ACTIVATION
router.post("/activate", requestActivation);
// POST REQUEST DEACTIVATION
router.post("/deactivate", requestDeactivation);
export default router;
