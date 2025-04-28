"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttService = void 0;
const service_1 = require("./service");
const mqtt_1 = require("../../config/mqtt");
exports.mqttService = (0, service_1.createMqttService)(mqtt_1.mqttConfig);
