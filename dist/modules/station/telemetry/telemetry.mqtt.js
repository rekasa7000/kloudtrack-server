"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttService = exports.createMqttService = exports.createStationConnection = void 0;
const awsIot = __importStar(require("aws-iot-device-sdk"));
const events_1 = require("events");
const logger_1 = __importDefault(require("../../../core/utils/logger"));
const createStationConnection = (config) => {
    console.log(config.keyPath);
    const device = new awsIot.device({
        keyPath: config.keyPath,
        certPath: config.certPath,
        caPath: config.caPath,
        host: config.host,
        port: config.port || 8883,
        protocol: config.protocol || "mqtts",
        reconnectPeriod: config.reconnectPeriod || 5000,
    });
    const eventEmitter = new events_1.EventEmitter();
    let connected = false;
    const subscriptions = new Map();
    device.on("connect", () => {
        connected = true;
        logger_1.default.info(`MQTT client connected: ${config.stationName} (Station: ${config.stationId})`);
        eventEmitter.emit("connect", config.stationId);
        if (subscriptions.size > 0) {
            subscriptions.forEach((_, topic) => {
                device.subscribe(topic);
            });
        }
    });
    device.on("close", () => {
        connected = false;
        logger_1.default.info(`MQTT client disconnected: ${config.stationName} (Station: ${config.stationId})`);
        eventEmitter.emit("disconnect", config.stationId);
    });
    device.on("reconnect", () => {
        logger_1.default.info(`MQTT client reconnecting: ${config.stationName} (Station: ${config.stationId})`);
        eventEmitter.emit("reconnect", config.stationId);
    });
    device.on("offline", () => {
        connected = false;
        logger_1.default.info(`MQTT client offline: ${config.stationName} (Station: ${config.stationId})`);
        eventEmitter.emit("offline", config.stationId);
    });
    device.on("error", (error) => {
        logger_1.default.error(`MQTT client error: ${config.stationName} (Station: ${config.stationId})`, error);
        eventEmitter.emit("error", error, config.stationId);
    });
    device.on("message", (topic, payload) => {
        try {
            const message = JSON.parse(payload.toString());
            logger_1.default.debug(`Message received on topic ${topic} (Station: ${config.stationId}):`, message);
            const topicParts = topic.split("/");
            if (topicParts.length >= 2) {
                const deviceId = topicParts[1];
                message.deviceId = deviceId;
            }
            message.stationId = config.stationId;
            const subscribers = subscriptions.get(topic);
            if (subscribers) {
                subscribers.forEach((callback) => {
                    try {
                        callback(message, config.stationId);
                    }
                    catch (error) {
                        logger_1.default.error(`Error in subscriber callback for topic ${topic} (Station: ${config.stationId}):`, error);
                    }
                });
            }
            subscriptions.forEach((subscriberCallbacks, subscribedTopic) => {
                if (topicMatchesWildcard(topic, subscribedTopic) &&
                    subscribedTopic !== topic) {
                    subscriberCallbacks.forEach((callback) => {
                        try {
                            callback(message, config.stationId);
                        }
                        catch (error) {
                            logger_1.default.error(`Error in wildcard subscriber callback for topic ${subscribedTopic} (Station: ${config.stationId}):`, error);
                        }
                    });
                }
            });
            eventEmitter.emit("message", {
                topic,
                message,
                stationId: config.stationId,
            });
        }
        catch (error) {
            logger_1.default.error(`Failed to parse message on topic ${topic} (Station: ${config.stationId}):`, error);
            eventEmitter.emit("message", {
                topic,
                message: payload.toString(),
                stationId: config.stationId,
            });
        }
    });
    const topicMatchesWildcard = (actualTopic, wildcardTopic) => {
        const wildcardParts = wildcardTopic.split("/");
        const actualParts = actualTopic.split("/");
        if (wildcardParts.length !== actualParts.length) {
            return false;
        }
        for (let i = 0; i < wildcardParts.length; i++) {
            if (wildcardParts[i] !== "+" &&
                wildcardParts[i] !== "#" &&
                wildcardParts[i] !== actualParts[i]) {
                return false;
            }
            if (wildcardParts[i] === "#") {
                return true;
            }
        }
        return true;
    };
    return {
        config,
        eventEmitter,
        isConnected: () => connected,
        connect: () => {
            if (connected) {
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                const connectTimeout = setTimeout(() => {
                    reject(new Error(`Connection timeout for station ${config.stationId}`));
                }, 10000);
                const connectHandler = () => {
                    clearTimeout(connectTimeout);
                    resolve();
                };
                const errorHandler = (error) => {
                    clearTimeout(connectTimeout);
                    reject(error);
                };
                device.once("connect", connectHandler);
                device.once("error", errorHandler);
            });
        },
        disconnect: () => {
            if (device) {
                device.end(false);
            }
        },
        subscribe: (topic, callback) => {
            if (!subscriptions.has(topic)) {
                subscriptions.set(topic, new Set());
                if (connected) {
                    device.subscribe(topic);
                }
            }
            subscriptions.get(topic).add(callback);
            logger_1.default.info(`Subscribed to topic: ${topic} (Station: ${config.stationId})`);
        },
        unsubscribe: (topic, callback) => {
            if (!subscriptions.has(topic)) {
                return;
            }
            if (callback) {
                subscriptions.get(topic).delete(callback);
                if (subscriptions.get(topic).size === 0) {
                    subscriptions.delete(topic);
                    if (connected) {
                        device.unsubscribe(topic);
                    }
                }
            }
            else {
                subscriptions.delete(topic);
                if (connected) {
                    device.unsubscribe(topic);
                }
            }
            logger_1.default.info(`Unsubscribed from topic: ${topic} (Station: ${config.stationId})`);
        },
        publish: (topic, message, options = {}) => {
            return new Promise((resolve, reject) => {
                const messageStr = typeof message === "string" ? message : JSON.stringify(message);
                device.publish(topic, messageStr, { qos: options.qos || 0, retain: options.retain || false }, (error) => {
                    if (error) {
                        logger_1.default.error(`Failed to publish message to topic ${topic} (Station: ${config.stationId}):`, error);
                        reject(error);
                    }
                    else {
                        logger_1.default.debug(`Message published to topic ${topic} (Station: ${config.stationId}):`, message);
                        resolve();
                    }
                });
            });
        },
        getConnectedDevices: () => {
            const devices = new Set();
            subscriptions.forEach((_, topic) => {
                const match = topic.match(/^devices\/([^\/]+)\/.*$/);
                if (match && match[1] !== "+") {
                    devices.add(match[1]);
                }
            });
            return Array.from(devices);
        },
    };
};
exports.createStationConnection = createStationConnection;
const createMqttService = () => {
    const stations = new Map();
    const eventEmitter = new events_1.EventEmitter();
    return {
        addStation: (config) => {
            if (stations.has(config.stationId)) {
                logger_1.default.warn(`Station ${config.stationId} is already registered. Skipping.`);
                return;
            }
            try {
                const station = (0, exports.createStationConnection)(config);
                stations.set(config.stationId, station);
                station.eventEmitter.on("connect", (stationId) => {
                    eventEmitter.emit("connect", stationId);
                });
                station.eventEmitter.on("disconnect", (stationId) => {
                    eventEmitter.emit("disconnect", stationId);
                });
                station.eventEmitter.on("reconnect", (stationId) => {
                    eventEmitter.emit("reconnect", stationId);
                });
                station.eventEmitter.on("offline", (stationId) => {
                    eventEmitter.emit("offline", stationId);
                });
                station.eventEmitter.on("error", (error, stationId) => {
                    eventEmitter.emit("error", error, stationId);
                });
                station.eventEmitter.on("message", (data) => {
                    eventEmitter.emit("message", data);
                });
                logger_1.default.info(`Station ${config.stationId} added successfully`);
            }
            catch (error) {
                logger_1.default.error(`Failed to add station ${config.stationName}: ${error}`);
                throw error;
            }
        },
        removeStation: (stationId) => {
            const station = stations.get(stationId);
            if (!station) {
                logger_1.default.warn(`Station ${stationId} not found. Cannot remove.`);
                return;
            }
            station.disconnect();
            stations.delete(stationId);
            logger_1.default.info(`Station ${stationId} removed successfully`);
        },
        getStation: (stationId) => stations.get(stationId),
        getStationIds: () => Array.from(stations.keys()),
        isConnected: (stationId) => {
            const station = stations.get(stationId);
            return station ? station.isConnected() : false;
        },
        connect: async (stationId) => {
            const station = stations.get(stationId);
            if (!station) {
                throw new Error(`Station ${stationId} not found`);
            }
            return station.connect();
        },
        connectAll: async () => {
            const connections = Array.from(stations.values()).map((station) => station.connect().catch((error) => {
                logger_1.default.error(`Failed to connect station ${station.config.stationId}:`, error);
                return Promise.resolve();
            }));
            await Promise.all(connections);
        },
        disconnect: (stationId) => {
            const station = stations.get(stationId);
            if (station) {
                station.disconnect();
            }
        },
        disconnectAll: () => {
            stations.forEach((station) => station.disconnect());
        },
        subscribe: (topic, callback, stationId) => {
            if (stationId) {
                const station = stations.get(stationId);
                if (!station) {
                    throw new Error(`Station ${stationId} not found`);
                }
                station.subscribe(topic, callback);
            }
            else {
                stations.forEach((station) => {
                    station.subscribe(topic, callback);
                });
            }
        },
        unsubscribe: (topic, callback, stationId) => {
            if (stationId) {
                const station = stations.get(stationId);
                if (!station) {
                    throw new Error(`Station ${stationId} not found`);
                }
                station.unsubscribe(topic, callback);
            }
            else {
                stations.forEach((station) => {
                    station.unsubscribe(topic, callback);
                });
            }
        },
        publish: (topic, message, options = {}, stationId) => {
            if (stationId) {
                const station = stations.get(stationId);
                if (!station) {
                    return Promise.reject(new Error(`Station ${stationId} not found`));
                }
                return station.publish(topic, message, options);
            }
            else {
                const promises = Array.from(stations.values()).map((station) => station.publish(topic, message, options).catch((error) => {
                    logger_1.default.error(`Failed to publish to station ${station.config.stationId}:`, error);
                    return Promise.resolve();
                }));
                return Promise.all(promises).then(() => { });
            }
        },
        on: (event, listener) => {
            eventEmitter.on(event, listener);
        },
        off: (event, listener) => {
            eventEmitter.off(event, listener);
        },
        getConnectedDevices: (stationId) => {
            const result = {};
            if (stationId) {
                const station = stations.get(stationId);
                if (station) {
                    result[stationId] = station.getConnectedDevices();
                }
            }
            else {
                stations.forEach((station, id) => {
                    result[id] = station.getConnectedDevices();
                });
            }
            return result;
        },
    };
};
exports.createMqttService = createMqttService;
exports.mqttService = (0, exports.createMqttService)();
exports.default = exports.mqttService;
