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
exports.createMqttService = exports.MqttService = void 0;
const awsIot = __importStar(require("aws-iot-device-sdk"));
const logger_1 = __importDefault(require("../../utils/logger"));
const events_1 = require("events");
class MqttService {
    config;
    device;
    connected = false;
    subscriptions = new Map();
    eventEmitter = new events_1.EventEmitter();
    constructor(config) {
        this.config = config;
        this.init();
    }
    init() {
        try {
            console.log("[MQTT CONFIG PATHS]");
            console.log("keyPath:", this.config.keyPath);
            console.log("certPath:", this.config.certPath);
            console.log("caPath:", this.config.caPath);
            this.device = new awsIot.device({
                keyPath: this.config.keyPath,
                certPath: this.config.certPath,
                caPath: this.config.caPath,
                clientId: this.config.clientId,
                host: this.config.host,
                port: this.config.port || 8883,
                protocol: this.config.protocol || "mqtts",
                reconnectPeriod: this.config.reconnectPeriod || 5000,
            });
            this.setupEventHandlers();
        }
        catch (error) {
            logger_1.default.error("Failed to initialize MQTT connection:", error);
            throw error;
        }
    }
    setupEventHandlers() {
        this.device.on("connect", () => {
            this.connected = true;
            logger_1.default.info(`MQTT client connected: ${this.config.clientId}`);
            this.eventEmitter.emit("connect");
            if (this.subscriptions.size > 0) {
                this.subscriptions.forEach((_, topic) => {
                    this.device.subscribe(topic);
                });
            }
        });
        this.device.on("close", () => {
            this.connected = false;
            logger_1.default.info(`MQTT client disconnected: ${this.config.clientId}`);
            this.eventEmitter.emit("disconnect");
        });
        this.device.on("reconnect", () => {
            logger_1.default.info(`MQTT client reconnecting: ${this.config.clientId}`);
            this.eventEmitter.emit("reconnect");
        });
        this.device.on("offline", () => {
            this.connected = false;
            logger_1.default.info(`MQTT client offline: ${this.config.clientId}`);
            this.eventEmitter.emit("offline");
        });
        this.device.on("error", (error) => {
            logger_1.default.error(`MQTT client error: ${this.config.clientId}`, error);
            this.eventEmitter.emit("error", error);
        });
        this.device.on("message", (topic, payload) => {
            try {
                const message = JSON.parse(payload.toString());
                logger_1.default.debug(`Message received on topic ${topic}:`, message);
                const topicParts = topic.split("/");
                if (topicParts.length >= 2) {
                    const deviceId = topicParts[1];
                    message.deviceId = deviceId;
                }
                const subscribers = this.subscriptions.get(topic);
                if (subscribers) {
                    subscribers.forEach((callback) => {
                        try {
                            callback(message);
                        }
                        catch (error) {
                            logger_1.default.error(`Error in subscriber callback for topic ${topic}:`, error);
                        }
                    });
                }
                this.subscriptions.forEach((subscriberCallbacks, subscribedTopic) => {
                    if (this.topicMatchesWildcard(topic, subscribedTopic) &&
                        subscribedTopic !== topic) {
                        subscriberCallbacks.forEach((callback) => {
                            try {
                                callback(message);
                            }
                            catch (error) {
                                logger_1.default.error(`Error in wildcard subscriber callback for topic ${subscribedTopic}:`, error);
                            }
                        });
                    }
                });
                this.eventEmitter.emit("message", { topic, message });
            }
            catch (error) {
                logger_1.default.error(`Failed to parse message on topic ${topic}:`, error);
                this.eventEmitter.emit("message", {
                    topic,
                    message: payload.toString(),
                });
            }
        });
    }
    topicMatchesWildcard(actualTopic, wildcardTopic) {
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
    }
    isConnected() {
        return this.connected;
    }
    async connect() {
        if (this.connected) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const connectTimeout = setTimeout(() => {
                reject(new Error("Connection timeout"));
            }, 10000);
            const connectHandler = () => {
                clearTimeout(connectTimeout);
                resolve();
            };
            const errorHandler = (error) => {
                clearTimeout(connectTimeout);
                reject(error);
            };
            this.device.once("connect", connectHandler);
            this.device.once("error", errorHandler);
        });
    }
    disconnect() {
        if (this.device) {
            this.device.end(false);
        }
    }
    subscribe(topic, callback) {
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Set());
            if (this.connected) {
                this.device.subscribe(topic);
            }
        }
        this.subscriptions.get(topic).add(callback);
        logger_1.default.info(`Subscribed to topic: ${topic}`);
    }
    unsubscribe(topic, callback) {
        if (!this.subscriptions.has(topic)) {
            return;
        }
        if (callback) {
            this.subscriptions.get(topic).delete(callback);
            if (this.subscriptions.get(topic).size === 0) {
                this.subscriptions.delete(topic);
                if (this.connected) {
                    this.device.unsubscribe(topic);
                }
            }
        }
        else {
            this.subscriptions.delete(topic);
            if (this.connected) {
                this.device.unsubscribe(topic);
            }
        }
        logger_1.default.info(`Unsubscribed from topic: ${topic}`);
    }
    publish(topic, message, options = {}) {
        return new Promise((resolve, reject) => {
            const messageStr = typeof message === "string" ? message : JSON.stringify(message);
            this.device.publish(topic, messageStr, { qos: options.qos || 0, retain: options.retain || false }, (error) => {
                if (error) {
                    logger_1.default.error(`Failed to publish message to topic ${topic}:`, error);
                    reject(error);
                }
                else {
                    logger_1.default.debug(`Message published to topic ${topic}:`, message);
                    resolve();
                }
            });
        });
    }
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
    getConnectedDevices() {
        const devices = new Set();
        this.subscriptions.forEach((_, topic) => {
            const match = topic.match(/^devices\/([^\/]+)\/.*$/);
            if (match && match[1] !== "+") {
                devices.add(match[1]);
            }
        });
        return Array.from(devices);
    }
}
exports.MqttService = MqttService;
const createMqttService = (config) => {
    return new MqttService(config);
};
exports.createMqttService = createMqttService;
