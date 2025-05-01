"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("./modules/auth/auth.route"));
const station_route_1 = __importDefault(require("./modules/station/station.route"));
const certificate_route_1 = __importDefault(require("./modules/certificate/certificate.route"));
const data_analysis_route_1 = __importDefault(require("./modules/data-analysis/data-analysis.route"));
const router = (0, express_1.Router)();
router.use("/auth", auth_route_1.default);
router.use("/station", station_route_1.default);
router.use("/station", certificate_route_1.default);
router.use("/data-analysis", data_analysis_route_1.default);
exports.default = router;
