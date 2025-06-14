export enum CommandStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  EXECUTED = "EXECUTED",
  FAILED = "FAILED",
  TIMEOUT = "TIMEOUT",
}

export enum CommandType {
  reset = "RESET",
  activate = "ACTIVATE",
  deactivate = "DEACTIVATE",
  update = "FIRMWARE_UPDATE",
  sync = "SYNC_DATA",
  data = "FETCH_DATA",
}

export type Commands = "reset" | "activate" | "deactivate" | "update" | "sync" | "data";

export interface CommandPayload {
  command: Commands;
  url?: string;
  force?: boolean;
}
