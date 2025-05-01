"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const station_controller_1 = require("./station.controller");
const router = (0, express_1.Router)();
// ALL STATIONS
router.get("/", station_controller_1.getAllStations);
// CREATE STATION
router.post("/", station_controller_1.createStation);
// UPDATE STATION
router.put("/:id", station_controller_1.updateStation);
// DELETE STATION
router.delete("/:id", station_controller_1.deleteStation);
// GET STATION BY ID
router.get("/:id", station_controller_1.getStationById);
// POST REQUEST ACTIVATION
router.post("/activate", station_controller_1.requestActivation);
// POST REQUEST DEACTIVATION
router.post("/deactivate", station_controller_1.requestDeactivation);
exports.default = router;
