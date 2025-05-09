"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTelemetryService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../../core/utils/logger"));
const telemetry_mqtt_1 = __importDefault(require("./telemetry.mqtt"));
const telemetry_service_1 = require("./telemetry.service");
const station_config_1 = require("../station.config");
const prisma = new client_1.PrismaClient();
const initializeTelemetryService = async () => {
    try {
        const stations = await prisma.station.findMany({
            where: {
                isActive: true,
            },
            include: {
                certificate: true,
            },
        });
        const rootCertificate = await prisma.rootCertificate.findFirst({
            where: { status: "ACTIVE" },
        });
        if (!rootCertificate) {
            logger_1.default.warn(`Root Certificate not found.`);
            return;
        }
        logger_1.default.info(`Setting up MQTT for ${stations.length} active stations`);
        for (const station of stations) {
            if (!station.certificate) {
                logger_1.default.warn(`Station ${station.id} has no certificates. Skipping.`);
                continue;
            }
            const config = (0, station_config_1.createStationConfig)({
                stationId: station.id,
                stationName: station.stationName,
                certPath: station.certificate.certPath,
                keyPath: station.certificate.keyPath,
                caPath: rootCertificate.path,
            });
            telemetry_mqtt_1.default.addStation(config);
            logger_1.default.info(`Added station ${station.stationName} to MQTT service`);
        }
        await telemetry_mqtt_1.default.connectAll();
        logger_1.default.info("All stations connected to MQTT service");
        telemetry_mqtt_1.default.on("message", processIncomingMessage);
        stations.forEach((station) => {
            telemetry_mqtt_1.default.subscribe(`devices/${station.serialCode}/data`, telemetryHandler, station.id);
            telemetry_mqtt_1.default.subscribe(`devices/+/data`, telemetryHandler, station.id);
        });
        telemetry_mqtt_1.default.on("reconnect", (stationName) => {
            logger_1.default.info(`MQTT client for station ${stationName} reconnecting`);
        });
        telemetry_mqtt_1.default.on("offline", (stationName) => {
            logger_1.default.warn(`MQTT client for station ${stationName} is offline`);
        });
        telemetry_mqtt_1.default.on("error", (error, stationName) => {
            logger_1.default.error(`MQTT client error for station ${stationName}:`, error);
        });
        logger_1.default.info("Telemetry service initialized successfully");
    }
    catch (error) {
        logger_1.default.error("Failed to initialize telemetry service:", error);
        throw error;
    }
};
exports.initializeTelemetryService = initializeTelemetryService;
const processIncomingMessage = ({ topic, message, stationId, }) => {
    if (topic.includes("/data")) {
        telemetryHandler(message, stationId);
    }
};
const telemetryHandler = async (message, stationId) => {
    try {
        if (!message || !message.weather) {
            logger_1.default.warn(`Invalid telemetry data format from station ${stationId}`);
            return;
        }
        const weather = message.weather;
        const telemetryData = {
            stationId: weather.stationId,
            recordedAt: weather.recordedAt || new Date(),
            temperature: weather.temperature,
            humidity: weather.humidity,
            pressure: weather.pressure,
            windSpeed: weather.windSpeed,
            windDirection: weather.windDirection,
            precipitation: weather.precipitation,
            lightIntensity: weather.lightIntensity,
            distance: weather.distance,
        };
        await (0, telemetry_service_1.saveTelemetryData)(telemetryData);
        logger_1.default.debug(`Telemetry data saved for station ${stationId}`);
    }
    catch (error) {
        logger_1.default.error(`Failed to process telemetry data from ${stationId}:`, error);
    }
};
exports.default = {
    initializeTelemetryService: exports.initializeTelemetryService,
};
