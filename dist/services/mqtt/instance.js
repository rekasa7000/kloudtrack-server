"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMultiStationMqttService = exports.MultiStationMqttService = exports.setupMqttService = void 0;
exports.getMqttService = getMqttService;
const setup_1 = require("./setup");
Object.defineProperty(exports, "setupMqttService", { enumerable: true, get: function () { return setup_1.setupMqttService; } });
const service_1 = require("./service");
Object.defineProperty(exports, "MultiStationMqttService", { enumerable: true, get: function () { return service_1.MultiStationMqttService; } });
Object.defineProperty(exports, "createMultiStationMqttService", { enumerable: true, get: function () { return service_1.createMultiStationMqttService; } });
let mqttServiceInstance;
async function getMqttService() {
    if (!mqttServiceInstance) {
        mqttServiceInstance = await (0, setup_1.setupMqttService)();
    }
    return mqttServiceInstance;
}
exports.default = {
    setupMqttService: setup_1.setupMqttService,
    getMqttService,
    createMultiStationMqttService: service_1.createMultiStationMqttService,
};
