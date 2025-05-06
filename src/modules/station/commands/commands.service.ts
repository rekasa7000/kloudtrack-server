import prisma from "../../../config/database.config";
import logger from "../../../core/utils/logger";
import mqttService from "../telemetry/telemetry.mqtt";

export const getCommandHistory = async (
  stationId: number,
  limit: number = 50
): Promise<any[]> => {
  try {
    const commands = await prisma.command.findMany({
      where: {
        stationId: stationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return commands.map((cmd) => ({
      ...cmd,
      command:
        typeof cmd.command === "string"
          ? JSON.parse(cmd.command)
          : typeof cmd.command === "object"
          ? cmd.command
          : null,
    }));
  } catch (error) {
    logger.error(
      `Failed to get command history for station ${stationId}:`,
      error
    );
    throw error;
  }
};

export const getCommandById = async (commandId: number): Promise<any> => {
  try {
    const command = await prisma.command.findUnique({
      where: {
        id: commandId,
      },
    });

    if (!command) {
      throw new Error(`Command ${commandId} not found`);
    }

    return {
      ...command,
      command:
        typeof command.command === "string"
          ? JSON.parse(command.command)
          : typeof command.command === "object"
          ? command.command
          : null,
    };
  } catch (error) {
    logger.error(`Failed to get command ${commandId}:`, error);
    throw error;
  }
};

export const sendCommandService = async (
  command: string,
  userId: number,
  stationId: number
) => {
  try {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { serialCode: true },
    });

    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }

    await mqttService.publish(`/kloudtrack/${station.serialCode}/command`, {
      command: { command },
    });
  } catch (error) {
    logger.error(`Failed to send command ${stationId}:`, error);
    throw error;
  }
};
