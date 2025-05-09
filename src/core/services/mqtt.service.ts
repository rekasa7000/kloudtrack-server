import * as awsIot from "aws-iot-device-sdk";
import { EventEmitter } from "events";
import { MqttStation } from "../../types/mqtt.types";
import logger from "../utils/logger";

export interface PublishOptions {
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

class StationConnection {
  private device!: awsIot.device;
  private connected: boolean = false;
  private subscriptions: Map<
    string,
    Set<(message: any, stationId: string) => void>
  > = new Map();
  public eventEmitter: EventEmitter = new EventEmitter();

  constructor(public config: MqttStation) {
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
      logger.error(
        `Failed to initialize MQTT connection for station ${this.config.stationId}:`,
        error
      );
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.device.on("connect", () => {
      this.connected = true;
      logger.info(
        `MQTT client connected: ${this.config.clientId} (Station: ${this.config.stationId})`
      );
      this.eventEmitter.emit("connect", this.config.stationId);

      if (this.subscriptions.size > 0) {
        this.subscriptions.forEach((_, topic) => {
          this.device.subscribe(topic);
        });
      }
    });

    this.device.on("close", () => {
      this.connected = false;
      logger.info(
        `MQTT client disconnected: ${this.config.clientId} (Station: ${this.config.stationId})`
      );
      this.eventEmitter.emit("disconnect", this.config.stationId);
    });

    this.device.on("reconnect", () => {
      logger.info(
        `MQTT client reconnecting: ${this.config.clientId} (Station: ${this.config.stationId})`
      );
      this.eventEmitter.emit("reconnect", this.config.stationId);
    });

    this.device.on("offline", () => {
      this.connected = false;
      logger.info(
        `MQTT client offline: ${this.config.clientId} (Station: ${this.config.stationId})`
      );
      this.eventEmitter.emit("offline", this.config.stationId);
    });

    this.device.on("error", (error) => {
      logger.error(
        `MQTT client error: ${this.config.clientId} (Station: ${this.config.stationId})`,
        error
      );
      this.eventEmitter.emit("error", error, this.config.stationId);
    });

    this.device.on("message", (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());
        logger.debug(
          `Message received on topic ${topic} (Station: ${this.config.stationId}):`,
          message
        );

        const topicParts = topic.split("/");
        if (topicParts.length >= 2) {
          const deviceId = topicParts[1];
          message.deviceId = deviceId;
        }

        message.stationId = this.config.stationId;

        const subscribers = this.subscriptions.get(topic);
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(message, this.config.stationId);
            } catch (error) {
              logger.error(
                `Error in subscriber callback for topic ${topic} (Station: ${this.config.stationId}):`,
                error
              );
            }
          });
        }

        this.subscriptions.forEach((subscriberCallbacks, subscribedTopic) => {
          if (
            this.topicMatchesWildcard(topic, subscribedTopic) &&
            subscribedTopic !== topic
          ) {
            subscriberCallbacks.forEach((callback) => {
              try {
                callback(message, this.config.stationId);
              } catch (error) {
                logger.error(
                  `Error in wildcard subscriber callback for topic ${subscribedTopic} (Station: ${this.config.stationId}):`,
                  error
                );
              }
            });
          }
        });

        this.eventEmitter.emit("message", {
          topic,
          message,
          stationId: this.config.stationId,
        });
      } catch (error) {
        logger.error(
          `Failed to parse message on topic ${topic} (Station: ${this.config.stationId}):`,
          error
        );
        this.eventEmitter.emit("message", {
          topic,
          message: payload.toString(),
          stationId: this.config.stationId,
        });
      }
    });
  }

  private topicMatchesWildcard(
    actualTopic: string,
    wildcardTopic: string
  ): boolean {
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
        return true;
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
        reject(
          new Error(`Connection timeout for station ${this.config.stationId}`)
        );
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

  public subscribe(
    topic: string,
    callback: (message: any, stationId: string) => void
  ): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      if (this.connected) {
        this.device.subscribe(topic);
      }
    }

    this.subscriptions.get(topic)!.add(callback);
    logger.info(
      `Subscribed to topic: ${topic} (Station: ${this.config.stationId})`
    );
  }

  public unsubscribe(
    topic: string,
    callback?: (message: any, stationId: string) => void
  ): void {
    if (!this.subscriptions.has(topic)) {
      return;
    }

    if (callback) {
      this.subscriptions.get(topic)!.delete(callback);

      if (this.subscriptions.get(topic)!.size === 0) {
        this.subscriptions.delete(topic);
        if (this.connected) {
          this.device.unsubscribe(topic);
        }
      }
    } else {
      this.subscriptions.delete(topic);
      if (this.connected) {
        this.device.unsubscribe(topic);
      }
    }

    logger.info(
      `Unsubscribed from topic: ${topic} (Station: ${this.config.stationId})`
    );
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
            logger.error(
              `Failed to publish message to topic ${topic} (Station: ${this.config.stationId}):`,
              error
            );
            reject(error);
          } else {
            logger.debug(
              `Message published to topic ${topic} (Station: ${this.config.stationId}):`,
              message
            );
            resolve();
          }
        }
      );
    });
  }

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

export class MultiStationMqttService {
  private stations: Map<string, StationConnection> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor() {}

  public addStation(config: MqttStation): void {
    if (this.stations.has(config.stationId)) {
      logger.warn(
        `Station ${config.stationId} is already registered. Skipping.`
      );
      return;
    }

    try {
      const station = new StationConnection(config);
      this.stations.set(config.stationId, station);

      station.eventEmitter.on("connect", (stationId) => {
        this.eventEmitter.emit("connect", stationId);
      });

      station.eventEmitter.on("disconnect", (stationId) => {
        this.eventEmitter.emit("disconnect", stationId);
      });

      station.eventEmitter.on("reconnect", (stationId) => {
        this.eventEmitter.emit("reconnect", stationId);
      });

      station.eventEmitter.on("offline", (stationId) => {
        this.eventEmitter.emit("offline", stationId);
      });

      station.eventEmitter.on("error", (error, stationId) => {
        this.eventEmitter.emit("error", error, stationId);
      });

      station.eventEmitter.on("message", (data) => {
        this.eventEmitter.emit("message", data);
      });

      logger.info(`Station ${config.stationId} added successfully`);
    } catch (error) {
      logger.error(`Failed to add station ${config.stationId}:`, error);
      throw error;
    }
  }

  public removeStation(stationId: string): void {
    const station = this.stations.get(stationId);
    if (!station) {
      logger.warn(`Station ${stationId} not found. Cannot remove.`);
      return;
    }

    station.disconnect();
    this.stations.delete(stationId);
    logger.info(`Station ${stationId} removed successfully`);
  }

  public getStation(stationId: string): StationConnection | undefined {
    return this.stations.get(stationId);
  }

  public getStationIds(): string[] {
    return Array.from(this.stations.keys());
  }

  public isConnected(stationId: string): boolean {
    const station = this.stations.get(stationId);
    return station ? station.isConnected() : false;
  }

  public async connect(stationId: string): Promise<void> {
    const station = this.stations.get(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }
    return station.connect();
  }

  public async connectAll(): Promise<void> {
    const connections = Array.from(this.stations.values()).map((station) =>
      station.connect().catch((error) => {
        logger.error(
          `Failed to connect station ${station.config.stationId}:`,
          error
        );
        return Promise.resolve();
      })
    );

    await Promise.all(connections);
  }

  public disconnect(stationId: string): void {
    const station = this.stations.get(stationId);
    if (station) {
      station.disconnect();
    }
  }

  public disconnectAll(): void {
    this.stations.forEach((station) => station.disconnect());
  }

  public subscribe(
    topic: string,
    callback: (message: any, stationId: string) => void,
    stationId?: string
  ): void {
    if (stationId) {
      const station = this.stations.get(stationId);
      if (!station) {
        throw new Error(`Station ${stationId} not found`);
      }
      station.subscribe(topic, callback);
    } else {
      this.stations.forEach((station) => {
        station.subscribe(topic, callback);
      });
    }
  }

  public unsubscribe(
    topic: string,
    callback?: (message: any, stationId: string) => void,
    stationId?: string
  ): void {
    if (stationId) {
      const station = this.stations.get(stationId);
      if (!station) {
        throw new Error(`Station ${stationId} not found`);
      }
      station.unsubscribe(topic, callback);
    } else {
      this.stations.forEach((station) => {
        station.unsubscribe(topic, callback);
      });
    }
  }

  public publish(
    topic: string,
    message: any,
    options: PublishOptions = {},
    stationId?: string
  ): Promise<void> {
    if (stationId) {
      const station = this.stations.get(stationId);
      if (!station) {
        return Promise.reject(new Error(`Station ${stationId} not found`));
      }
      return station.publish(topic, message, options);
    } else {
      const promises = Array.from(this.stations.values()).map((station) =>
        station.publish(topic, message, options).catch((error) => {
          logger.error(
            `Failed to publish to station ${station.config.stationId}:`,
            error
          );
          return Promise.resolve();
        })
      );

      return Promise.all(promises).then(() => {});
    }
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  public getConnectedDevices(stationId?: string): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    if (stationId) {
      const station = this.stations.get(stationId);
      if (station) {
        result[stationId] = station.getConnectedDevices();
      }
    } else {
      this.stations.forEach((station, id) => {
        result[id] = station.getConnectedDevices();
      });
    }

    return result;
  }
}

export const createMultiStationMqttService = (): MultiStationMqttService => {
  return new MultiStationMqttService();
};
