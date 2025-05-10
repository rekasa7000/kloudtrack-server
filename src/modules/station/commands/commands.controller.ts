import { Request, Response } from "express";
import * as commandsService from "./commands.service";
import logger from "../../../core/utils/logger";
import { AppError } from "../../../core/utils/error";

export async function sendCommand(req: Request, res: Response) {
  try {
    const stationId = +req.params.stationId;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ message: "Command is required" });
    }

    const validCommands = ["REBOOT", "CONFIGURE", "UPDATE", "STATUS", "CUSTOM"];
    if (!validCommands.includes(command)) {
      return res.status(400).json({
        message: `Invalid command. Must be one of: ${validCommands.join(", ")}`,
      });
    }

    if (!req.user) {
      throw new AppError("Not authenticated", 400);
    }

    const result = await commandsService.sendCommandService(
      command,
      req.user.id,
      stationId
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error sending command:", error);
    return res.status(500).json({
      message: "Failed to send command",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getCommandHistory(req: Request, res: Response) {
  try {
    const stationId = +req.params.stationId;
    const { limit } = req.query;

    const recordLimit = limit ? parseInt(limit as string) : 50;
    if (isNaN(recordLimit) || recordLimit < 1) {
      return res.status(400).json({ message: "Invalid limit parameter" });
    }

    const commands = await commandsService.getCommandHistory(
      stationId,
      recordLimit
    );
    return res.status(200).json(commands);
  } catch (error) {
    logger.error("Error getting command history:", error);
    return res.status(500).json({
      message: "Failed to get command history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getCommand(req: Request, res: Response) {
  try {
    const commandId = +req.params.commandId;

    const command = await commandsService.getCommandById(commandId);
    return res.status(200).json(command);
  } catch (error) {
    logger.error("Error getting command:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to get command",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
