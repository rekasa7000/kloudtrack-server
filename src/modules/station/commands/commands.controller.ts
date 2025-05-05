import { Request, Response } from "express";
import * as commandsService from "./commands.service";
import logger from "../../../core/utils/logger";

/**
 * Send a command to a station
 * @route POST /api/stations/:stationId/commands
 */
export async function sendCommand(req: Request, res: Response) {
  try {
    const { stationId } = req.params;
    const { command, parameters } = req.body;

    // Validate command
    if (!command) {
      return res.status(400).json({ message: "Command is required" });
    }

    // Ensure command is valid
    const validCommands = ["REBOOT", "CONFIGURE", "UPDATE", "STATUS", "CUSTOM"];
    if (!validCommands.includes(command)) {
      return res.status(400).json({
        message: `Invalid command. Must be one of: ${validCommands.join(", ")}`,
      });
    }

    // Send command and wait for response
    const result = await commandsService.sendCommand({
      stationId,
      command: command as commandsService.CommandType,
      parameters,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error sending command:", error);
    return res.status(500).json({
      message: "Failed to send command",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get command history for a station
 * @route GET /api/stations/:stationId/commands
 */
export async function getCommandHistory(req: Request, res: Response) {
  try {
    const { stationId } = req.params;
    const { limit } = req.query;

    // Parse and validate limit
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

/**
 * Get a specific command by ID
 * @route GET /api/stations/commands/:commandId
 */
export async function getCommand(req: Request, res: Response) {
  try {
    const { commandId } = req.params;

    const command = await commandsService.getCommandById(commandId);
    return res.status(200).json(command);
  } catch (error) {
    logger.error("Error getting command:", error);

    // Check if it's a "not found" error
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to get command",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
