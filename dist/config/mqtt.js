"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMqttClient = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("../core/utils/logger"));
(0, dotenv_1.config)();
const env = process.env;
const mqttConfig = {
    brokerUrl: env.MQTT_BROKER_URL || "mqtt://localhost:1883",
    clientId: env.MQTT_CLIENT_ID ||
        `kloudtrack_server_${Math.random().toString(16).substring(2, 10)}`,
    options: {
        username: env.MQTT_USERNAME,
        password: env.MQTT_PASSWORD,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
    },
};
const createMqttClient = () => {
    try {
        const client = mqtt_1.default.connect(mqttConfig.brokerUrl, {
            ...mqttConfig.options,
            clientId: mqttConfig.clientId,
        });
        logger_1.default.info(`MQTT client connecting to ${mqttConfig.brokerUrl}`);
        return client;
    }
    catch (error) {
        logger_1.default.error("Failed to create MQTT client", error);
        throw error;
    }
};
exports.createMqttClient = createMqttClient;
exports.default = mqttConfig;
