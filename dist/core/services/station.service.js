"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMqttService = void 0;
const mqtt_config_1 = require("../../config/mqtt.config");
const logger_1 = __importDefault(require("../utils/logger"));
const mqtt_service_1 = require("./mqtt.service");
const mqttService = (0, mqtt_service_1.createMultiStationMqttService)();
const setupMqttService = async () => {
    // const stations = await prisma.station.findMany();
    // stations.map((station) => {
    //   mqttService.addStation(createStationConfig(station.stationName));
    // });
    mqttService.addStation((0, mqtt_config_1.createStationConfig)("test"));
    await mqttService.connectAll();
    // mqttService.subscribe("kloudtrack/KTB61815AC/activation", (message) => {
    //   console.log(message);
    // });
    // mqttService.publish("kloudtrack/KTB61815AC/activation", {
    //   action: "activate",
    //   key: "KT-SECURE-KEY-12345",
    // });
    // mqttService.subscribe("kloudtrack/KTB61815AC/data", (message) => {
    //   console.log(message);
    // });
    mqttService.on("message", async ({ stationId, topic, message }) => {
        try {
            logger_1.default.info(`Message received from ${stationId} on topic ${topic}`);
            logger_1.default.info(`Data saved for station ${stationId}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to process message from ${stationId}:`, error);
        }
    });
    // * LOGIC HERE
    // default handlers
    mqttService.on("reconnect", (stationId) => {
        logger_1.default.info(`MQTT client for station ${stationId} reconnecting`);
    });
    mqttService.on("offline", (stationId) => {
        logger_1.default.warn(`MQTT client for station ${stationId} is offline`);
    });
    mqttService.on("error", (error, stationId) => {
        logger_1.default.error(`MQTT client error for station ${stationId}:`, error);
    });
    mqttService.publish("devices/device123/control", { command: "ON" });
    return mqttService;
};
exports.setupMqttService = setupMqttService;
