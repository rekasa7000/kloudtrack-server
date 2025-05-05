"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metadata_controller_1 = require("./metadata.controller");
const validation_middleware_1 = require("../../../core/middlewares/validation.middleware");
const metadata_schema_1 = require("./metadata.schema");
const router = (0, express_1.Router)();
// ALL STATIONS
router.get("/", (0, validation_middleware_1.validateRequest)(metadata_schema_1.getAllStationsSchema), metadata_controller_1.getAllStations);
// CREATE STATION
router.post("/", (0, validation_middleware_1.validateRequest)(metadata_schema_1.createStationSchema), metadata_controller_1.createStation);
// UPDATE STATION
router.put("/:id", (0, validation_middleware_1.validateRequest)(metadata_schema_1.updateStationSchema), metadata_controller_1.updateStation);
// DELETE STATION
router.delete("/:id", (0, validation_middleware_1.validateRequest)(metadata_schema_1.stationIdSchema), metadata_controller_1.deleteStation);
// GET STATION BY ID
router.get("/:id", (0, validation_middleware_1.validateRequest)(metadata_schema_1.stationIdSchema), metadata_controller_1.getStationById);
exports.default = router;
