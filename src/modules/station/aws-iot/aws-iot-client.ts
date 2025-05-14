import * as mqtt from "mqtt";
import { EventEmitter } from "events";
import { CertificateService } from "../station.certificate";
import { StationConfig, MqttMessage } from "../station.types";

export class AwsIotClient extends EventEmitter {
  private stationConfig: StationConfig;
  private certificateService: CertificateService;
  private client: mqtt.MqttClient | null = null;
  private endpoint: string;
  private subscriptions: Set<string>;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;

  constructor(stationConfig: StationConfig, certificateService: CertificateService, endpoint: string) {
    super();
    this.stationConfig = stationConfig;
    this.certificateService = certificateService;
    this.endpoint = endpoint;
    this.subscriptions = new Set();
  }

  async connect(): Promise<void> {
    try {
      // Get certificates for this station
      const { cert, key, rootCert } = await this.certificateService.getStationCertificate(this.stationConfig.stationId);

      const clientId = `backend-${this.stationConfig.awsThingName}`;

      // Configure MQTT connection options
      const options: mqtt.IClientOptions = {
        clientId,
        protocol: "mqtts",
        cert,
        key,
        ca: rootCert,
        reconnectPeriod: 5000,
        keepalive: 60,
      };

      // Connect to AWS IoT Core
      const connectionUrl = `mqtts://${this.endpoint}:8883`;
      this.client = mqtt.connect(connectionUrl, options);

      // Setup event handlers
      this.client.on("connect", () => {
        console.log(`Connected to AWS IoT Core for Thing: ${this.stationConfig.awsThingName}`);
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.resubscribe(); // Resubscribe to previously subscribed topics
        this.emit("connected", this.stationConfig.awsThingName);
      });

      this.client.on("message", (topic, payload) => {
        try {
          const message: MqttMessage = {
            topic,
            payload: JSON.parse(payload.toString()),
          };
          this.emit("message", message);
        } catch (error) {
          console.error(`Error processing message on topic ${topic}:`, error);
        }
      });

      this.client.on("error", (error) => {
        console.error(`AWS IoT Client error for Thing ${this.stationConfig.awsThingName}:`, error);
        this.emit("error", error);
      });

      this.client.on("offline", () => {
        console.log(`AWS IoT Client offline for Thing ${this.stationConfig.awsThingName}`);
        this.emit("offline");
      });

      this.client.on("reconnect", () => {
        this.reconnectAttempts++;
        console.log(
          `Reconnecting to AWS IoT Core for Thing ${this.stationConfig.awsThingName}, attempt ${this.reconnectAttempts}`
        );

        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
          console.log(`Max reconnect attempts reached for Thing ${this.stationConfig.awsThingName}`);
          this.close();
          this.emit("max_reconnect_attempts");
        }
      });
    } catch (error) {
      console.error(`Error connecting to AWS IoT Core for Thing ${this.stationConfig.awsThingName}:`, error);
      throw error;
    }
  }

  subscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error("Not connected to AWS IoT Core"));
        return;
      }

      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`Error subscribing to topic ${topic}:`, error);
          reject(error);
        } else {
          console.log(`Subscribed to topic: ${topic}`);
          this.subscriptions.add(topic); // Track subscriptions for reconnection
          resolve();
        }
      });
    });
  }

  publish(topic: string, message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error("Not connected to AWS IoT Core"));
        return;
      }

      const payload = typeof message === "string" ? message : JSON.stringify(message);

      this.client.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          console.error(`Error publishing to topic ${topic}:`, error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private resubscribe(): void {
    if (!this.client || !this.client.connected) return;

    this.subscriptions.forEach((topic) => {
      this.client!.subscribe(topic, (error) => {
        if (error) {
          console.error(`Error resubscribing to topic ${topic}:`, error);
        } else {
          console.log(`Resubscribed to topic: ${topic}`);
        }
      });
    });
  }

  close(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      console.log(`Closed connection to AWS IoT Core for Thing ${this.stationConfig.awsThingName}`);
    }
  }
}
