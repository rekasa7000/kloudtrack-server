import * as awsIot from "aws-iot-device-sdk";
import { EventEmitter } from "events";
import logger from "../../../core/utils/logger";
import { saveTelemetryData } from "./telemetry.service";

// Types
export type MqttStation = {
  stationId: string;
  clientId: string;
  keyPath: string;
  certPath: string;
  caPath: string;
  host: string;
  port?: number;
  protocol?: string;
  reconnectPeriod?: number;
};

export type PublishOptions = {
  qos?: number;
  retain?: boolean;
};

export type MessageHandler = (message: any, stationId: string) => void;

export type MqttMessage = {
  topic: string;
  message: any;
  stationId: string;
};

// Create a connection for a single station
export function createStationConnection(config: MqttStation) {
  const device = new awsIot.device({
    keyPath: config.keyPath,
    certPath: config.certPath,
    caPath: config.caPath,
    clientId: config.clientId,
    host: config.host,
    port: config.port || 8883,
    protocol: config.protocol || "mqtts",
    reconnectPeriod: config.reconnectPeriod || 5000,
  });

  const eventEmitter = new EventEmitter();
  let connected = false;
  const subscriptions = new Map<string, Set<MessageHandler>>();

  // Setup event handlers
  device.on("connect", () => {
    connected = true;
    logger.info(
      `MQTT client connected: ${config.clientId} (Station: ${config.stationId})`
    );
    eventEmitter.emit("connect", config.stationId);

    // Resubscribe to topics after reconnection
    if (subscriptions.size > 0) {
      subscriptions.forEach((_, topic) => {
        device.subscribe(topic);
      });
    }
  });

  device.on("close", () => {
    connected = false;
    logger.info(
      `MQTT client disconnected: ${config.clientId} (Station: ${config.stationId})`
    );
    eventEmitter.emit("disconnect", config.stationId);
  });

  device.on("reconnect", () => {
    logger.info(
      `MQTT client reconnecting: ${config.clientId} (Station: ${config.stationId})`
    );
    eventEmitter.emit("reconnect", config.stationId);
  });

  device.on("offline", () => {
    connected = false;
    logger.info(
      `MQTT client offline: ${config.clientId} (Station: ${config.stationId})`
    );
    eventEmitter.emit("offline", config.stationId);
  });

  device.on("error", (error) => {
    logger.error(
      `MQTT client error: ${config.clientId} (Station: ${config.stationId})`,
      error
    );
    eventEmitter.emit("error", error, config.stationId);
  });

  device.on("message", (topic, payload) => {
    try {
      const message = JSON.parse(payload.toString());
      logger.debug(
        `Message received on topic ${topic} (Station: ${config.stationId}):`,
        message
      );

      // Extract deviceId from topic if available
      const topicParts = topic.split("/");
      if (topicParts.length >= 2) {
        const deviceId = topicParts[1];
        message.deviceId = deviceId;
      }

      message.stationId = config.stationId;

      // Notify subscribers for this exact topic
      const subscribers = subscriptions.get(topic);
      if (subscribers) {
        subscribers.forEach((callback) => {
          try {
            callback(message, config.stationId);
          } catch (error) {
            logger.error(
              `Error in subscriber callback for topic ${topic} (Station: ${config.stationId}):`,
              error
            );
          }
        });
      }

      // Check for wildcard matches
      subscriptions.forEach((subscriberCallbacks, subscribedTopic) => {
        if (
          topicMatchesWildcard(topic, subscribedTopic) &&
          subscribedTopic !== topic
        ) {
          subscriberCallbacks.forEach((callback) => {
            try {
              callback(message, config.stationId);
            } catch (error) {
              logger.error(
                `Error in wildcard subscriber callback for topic ${subscribedTopic} (Station: ${config.stationId}):`,
                error
              );
            }
          });
        }
      });

      // Emit message event
      eventEmitter.emit("message", {
        topic,
        message,
        stationId: config.stationId,
      });
    } catch (error) {
      logger.error(
        `Failed to parse message on topic ${topic} (Station: ${config.stationId}):`,
        error
      );
      eventEmitter.emit("message", {
        topic,
        message: payload.toString(),
        stationId: config.stationId,
      });
    }
  });

  // Helper function for wildcard topic matching
  function topicMatchesWildcard(
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

  // Station API
  return {
    config,
    eventEmitter,
    isConnected: () => connected,

    connect: (): Promise<void> => {
      if (connected) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const connectTimeout = setTimeout(() => {
          reject(
            new Error(`Connection timeout for station ${config.stationId}`)
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

        device.once("connect", connectHandler);
        device.once("error", errorHandler);
      });
    },

    disconnect: (): void => {
      if (device) {
        device.end(false);
      }
    },

    subscribe: (topic: string, callback: MessageHandler): void => {
      if (!subscriptions.has(topic)) {
        subscriptions.set(topic, new Set());
        if (connected) {
          device.subscribe(topic);
        }
      }

      subscriptions.get(topic)!.add(callback);
      logger.info(
        `Subscribed to topic: ${topic} (Station: ${config.stationId})`
      );
    },

    unsubscribe: (topic: string, callback?: MessageHandler): void => {
      if (!subscriptions.has(topic)) {
        return;
      }

      if (callback) {
        subscriptions.get(topic)!.delete(callback);

        if (subscriptions.get(topic)!.size === 0) {
          subscriptions.delete(topic);
          if (connected) {
            device.unsubscribe(topic);
          }
        }
      } else {
        subscriptions.delete(topic);
        if (connected) {
          device.unsubscribe(topic);
        }
      }

      logger.info(
        `Unsubscribed from topic: ${topic} (Station: ${config.stationId})`
      );
    },

    publish: (
      topic: string,
      message: any,
      options: PublishOptions = {}
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        const messageStr =
          typeof message === "string" ? message : JSON.stringify(message);

        device.publish(
          topic,
          messageStr,
          { qos: options.qos || 0, retain: options.retain || false },
          (error) => {
            if (error) {
              logger.error(
                `Failed to publish message to topic ${topic} (Station: ${config.stationId}):`,
                error
              );
              reject(error);
            } else {
              logger.debug(
                `Message published to topic ${topic} (Station: ${config.stationId}):`,
                message
              );
              resolve();
            }
          }
        );
      });
    },

    getConnectedDevices: (): string[] => {
      const devices = new Set<string>();

      subscriptions.forEach((_, topic) => {
        const match = topic.match(/^devices\/([^\/]+)\/.*$/);
        if (match && match[1] !== "+") {
          devices.add(match[1]);
        }
      });

      return Array.from(devices);
    },
  };
}

// Create the multi-station MQTT service
export function createMqttService() {
  const stations = new Map<
    string,
    ReturnType<typeof createStationConnection>
  >();
  const eventEmitter = new EventEmitter();

  return {
    addStation: (config: MqttStation): void => {
      if (stations.has(config.stationId)) {
        logger.warn(
          `Station ${config.stationId} is already registered. Skipping.`
        );
        return;
      }

      try {
        const station = createStationConnection(config);
        stations.set(config.stationId, station);

        // Forward station events to service event emitter
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

        logger.info(`Station ${config.stationId} added successfully`);
      } catch (error) {
        logger.error(`Failed to add station ${config.stationId}:`, error);
        throw error;
      }
    },

    removeStation: (stationId: string): void => {
      const station = stations.get(stationId);
      if (!station) {
        logger.warn(`Station ${stationId} not found. Cannot remove.`);
        return;
      }

      station.disconnect();
      stations.delete(stationId);
      logger.info(`Station ${stationId} removed successfully`);
    },

    getStation: (stationId: string) => stations.get(stationId),

    getStationIds: () => Array.from(stations.keys()),

    isConnected: (stationId: string): boolean => {
      const station = stations.get(stationId);
      return station ? station.isConnected() : false;
    },

    connect: async (stationId: string): Promise<void> => {
      const station = stations.get(stationId);
      if (!station) {
        throw new Error(`Station ${stationId} not found`);
      }
      return station.connect();
    },

    connectAll: async (): Promise<void> => {
      const connections = Array.from(stations.values()).map((station) =>
        station.connect().catch((error) => {
          logger.error(
            `Failed to connect station ${station.config.stationId}:`,
            error
          );
          return Promise.resolve();
        })
      );

      await Promise.all(connections);
    },

    disconnect: (stationId: string): void => {
      const station = stations.get(stationId);
      if (station) {
        station.disconnect();
      }
    },

    disconnectAll: (): void => {
      stations.forEach((station) => station.disconnect());
    },

    subscribe: (
      topic: string,
      callback: MessageHandler,
      stationId?: string
    ): void => {
      if (stationId) {
        const station = stations.get(stationId);
        if (!station) {
          throw new Error(`Station ${stationId} not found`);
        }
        station.subscribe(topic, callback);
      } else {
        stations.forEach((station) => {
          station.subscribe(topic, callback);
        });
      }
    },

    unsubscribe: (
      topic: string,
      callback?: MessageHandler,
      stationId?: string
    ): void => {
      if (stationId) {
        const station = stations.get(stationId);
        if (!station) {
          throw new Error(`Station ${stationId} not found`);
        }
        station.unsubscribe(topic, callback);
      } else {
        stations.forEach((station) => {
          station.unsubscribe(topic, callback);
        });
      }
    },

    publish: (
      topic: string,
      message: any,
      options: PublishOptions = {},
      stationId?: string
    ): Promise<void> => {
      if (stationId) {
        const station = stations.get(stationId);
        if (!station) {
          return Promise.reject(new Error(`Station ${stationId} not found`));
        }
        return station.publish(topic, message, options);
      } else {
        const promises = Array.from(stations.values()).map((station) =>
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
    },

    on: (event: string, listener: (...args: any[]) => void): void => {
      eventEmitter.on(event, listener);
    },

    off: (event: string, listener: (...args: any[]) => void): void => {
      eventEmitter.off(event, listener);
    },

    getConnectedDevices: (stationId?: string): Record<string, string[]> => {
      const result: Record<string, string[]> = {};

      if (stationId) {
        const station = stations.get(stationId);
        if (station) {
          result[stationId] = station.getConnectedDevices();
        }
      } else {
        stations.forEach((station, id) => {
          result[id] = station.getConnectedDevices();
        });
      }

      return result;
    },
  };
}

// Singleton instance for the application
export const mqttService = createMqttService();

// Export the singleton for use throughout the application
export default mqttService;
