"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttService = void 0;
exports.setupMqttService = setupMqttService;
const mqtt_1 = require("../../config/mqtt");
const logger_1 = __importDefault(require("../../utils/logger"));
const service_1 = require("./service");
exports.mqttService = (0, service_1.createMqttService)(mqtt_1.mqttConfig);
function setupMqttService() {
    exports.mqttService.subscribe("devices/+/telemetry", (message) => {
        logger_1.default.info("Received telemetry data:", message);
        // * TODO: CREATE DATA IN THE DATABSE
    });
    exports.mqttService.subscribe("devices/+/status", (message) => {
        logger_1.default.info("Device status update:", message);
    });
    // Connect to AWS IoT Core
    exports.mqttService
        .connect()
        .then(() => {
        logger_1.default.info("Successfully connected to AWS IoT Core");
    })
        .catch((error) => {
        logger_1.default.error("Failed to connect to AWS IoT Core:", error);
        process.exit(1);
    });
    exports.mqttService.on("reconnect", () => {
        logger_1.default.info("MQTT client reconnecting");
    });
    exports.mqttService.on("offline", () => {
        logger_1.default.warn("MQTT client is offline");
    });
    exports.mqttService.on("error", (error) => {
        logger_1.default.error("MQTT client error:", error);
    });
    return exports.mqttService;
}
