// src/services/mqtt.service.ts

import * as awsIot from "aws-iot-device-sdk";
import logger from "../../utils/logger";
import { EventEmitter } from "events";

export interface MqttConfig {
  keyPath: string;
  certPath: string;
  caPath: string;
  clientId: string;
  host: string;
  port?: number;
  protocol?: "mqtts" | "wss";
  reconnectPeriod?: number;
}

export interface PublishOptions {
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

export class MqttService {
  private device!: awsIot.device;
  private connected: boolean = false;
  private subscriptions: Map<string, Set<(message: any) => void>> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor(private config: MqttConfig) {
    this.init();
  }

  private init(): void {
    try {
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
    } catch (error) {
      logger.error("Failed to initialize MQTT connection:", error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.device.on("connect", () => {
      this.connected = true;
      logger.info(`MQTT client connected: ${this.config.clientId}`);
      this.eventEmitter.emit("connect");

      // Resubscribe to all topics if reconnected
      if (this.subscriptions.size > 0) {
        this.subscriptions.forEach((_, topic) => {
          this.device.subscribe(topic);
        });
      }
    });

    this.device.on("close", () => {
      this.connected = false;
      logger.info(`MQTT client disconnected: ${this.config.clientId}`);
      this.eventEmitter.emit("disconnect");
    });

    this.device.on("reconnect", () => {
      logger.info(`MQTT client reconnecting: ${this.config.clientId}`);
      this.eventEmitter.emit("reconnect");
    });

    this.device.on("offline", () => {
      this.connected = false;
      logger.info(`MQTT client offline: ${this.config.clientId}`);
      this.eventEmitter.emit("offline");
    });

    this.device.on("error", (error) => {
      logger.error(`MQTT client error: ${this.config.clientId}`, error);
      this.eventEmitter.emit("error", error);
    });

    this.device.on("message", (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());
        logger.debug(`Message received on topic ${topic}:`, message);

        // Extract deviceId from topic for additional context
        const topicParts = topic.split("/");
        if (topicParts.length >= 2) {
          // For topics like "devices/deviceId/telemetry"
          const deviceId = topicParts[1];
          message.deviceId = deviceId;
        }

        // Notify all subscribers for this topic
        const subscribers = this.subscriptions.get(topic);
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(message);
            } catch (error) {
              logger.error(
                `Error in subscriber callback for topic ${topic}:`,
                error
              );
            }
          });
        }

        // Handle wildcard subscriptions
        this.subscriptions.forEach((subscriberCallbacks, subscribedTopic) => {
          if (
            this.topicMatchesWildcard(topic, subscribedTopic) &&
            subscribedTopic !== topic
          ) {
            subscriberCallbacks.forEach((callback) => {
              try {
                callback(message);
              } catch (error) {
                logger.error(
                  `Error in wildcard subscriber callback for topic ${subscribedTopic}:`,
                  error
                );
              }
            });
          }
        });

        this.eventEmitter.emit("message", { topic, message });
      } catch (error) {
        logger.error(`Failed to parse message on topic ${topic}:`, error);
        // Forward the raw payload if parsing fails
        this.eventEmitter.emit("message", {
          topic,
          message: payload.toString(),
        });
      }
    });
  }

  private topicMatchesWildcard(
    actualTopic: string,
    wildcardTopic: string
  ): boolean {
    // Convert wildcard topic pattern to regex
    const wildcardParts = wildcardTopic.split("/");
    const actualParts = actualTopic.split("/");

    if (wildcardParts.length !== actualParts.length) {
      return false;
    }

    for (let i = 0; i < wildcardParts.length; i++) {
      if (
        wildcardParts[i] !== "+" &&
        wildcardParts[i] !== "#" &&
        wildcardParts[i] !== actualParts[i]
      ) {
        return false;
      }

      if (wildcardParts[i] === "#") {
        return true; // # matches everything from this point
      }
    }

    return true;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async connect(): Promise<void> {
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

      const errorHandler = (error: Error) => {
        clearTimeout(connectTimeout);
        reject(error);
      };

      this.device.once("connect", connectHandler);
      this.device.once("error", errorHandler);
    });
  }

  public disconnect(): void {
    if (this.device) {
      this.device.end(false);
    }
  }

  public subscribe(topic: string, callback: (message: any) => void): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      if (this.connected) {
        this.device.subscribe(topic);
      }
    }

    this.subscriptions.get(topic)!.add(callback);
    logger.info(`Subscribed to topic: ${topic}`);
  }

  public unsubscribe(topic: string, callback?: (message: any) => void): void {
    if (!this.subscriptions.has(topic)) {
      return;
    }

    if (callback) {
      // Remove specific callback
      this.subscriptions.get(topic)!.delete(callback);

      // If no callbacks left, unsubscribe from topic
      if (this.subscriptions.get(topic)!.size === 0) {
        this.subscriptions.delete(topic);
        if (this.connected) {
          this.device.unsubscribe(topic);
        }
      }
    } else {
      // Remove all callbacks for this topic
      this.subscriptions.delete(topic);
      if (this.connected) {
        this.device.unsubscribe(topic);
      }
    }

    logger.info(`Unsubscribed from topic: ${topic}`);
  }

  public publish(
    topic: string,
    message: any,
    options: PublishOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const messageStr =
        typeof message === "string" ? message : JSON.stringify(message);

      this.device.publish(
        topic,
        messageStr,
        { qos: options.qos || 0, retain: options.retain || false },
        (error) => {
          if (error) {
            logger.error(`Failed to publish message to topic ${topic}:`, error);
            reject(error);
          } else {
            logger.debug(`Message published to topic ${topic}:`, message);
            resolve();
          }
        }
      );
    });
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  // Get all connected devices (from active subscriptions)
  public getConnectedDevices(): string[] {
    const devices = new Set<string>();

    this.subscriptions.forEach((_, topic) => {
      const match = topic.match(/^devices\/([^\/]+)\/.*$/);
      if (match && match[1] !== "+") {
        devices.add(match[1]);
      }
    });

    return Array.from(devices);
  }
}

// Export a factory function to create an MQTT service
export const createMqttService = (config: MqttConfig): MqttService => {
  return new MqttService(config);
};
