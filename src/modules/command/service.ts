import { Prisma } from "@prisma/client";
import { AppError } from "../../core/utils/error";
import { CommandRepository } from "./repository";
import { IoTManager } from "../iot/service";
import { logger } from "../../core/utils/logger";
import { CommandPayload, CommandStatus, CommandType } from "./type";

export class CommandService {
  private commandRepository: CommandRepository;
  private iotManager?: IoTManager;

  constructor(commandRepository: CommandRepository) {
    this.commandRepository = commandRepository;
  }

  public setIoTManager(iotManager: IoTManager): void {
    this.iotManager = iotManager;
  }

  async newCommand(commandData: Prisma.CommandUncheckedCreateInput) {
    try {
      const command = await this.commandRepository.create(commandData);
      return command;
    } catch (error) {
      logger.error("Error saving command:", error);
      throw new AppError("Error saving command", 500);
    }
  }

  async createAndSendCommand(stationId: number, commandPayload: CommandPayload, userId: number) {
    try {
      const commandData: Prisma.CommandUncheckedCreateInput = {
        stationId,
        type: this.checkCommandType(commandPayload),
        command: JSON.stringify(commandPayload),
        status: CommandStatus.PENDING,
        issuedBy: userId,
        executedAt: null,
      };

      const command = await this.commandRepository.create(commandData);
      logger.info(`Command ${command.id} created for station ${stationId}`);

      if (this.iotManager) {
        try {
          await this.sendCommandToStation(command.id, stationId, commandPayload);
          await this.updateCommandStatus(command.id, CommandStatus.SENT, new Date());
          this.setCommandTimeout(command.id, 30);

          logger.info(`Command ${command.id} sent to station ${stationId}`);
        } catch (iotError) {
          await this.updateCommandStatus(command.id, CommandStatus.FAILED);
          logger.error(`Failed to send command ${command.id} to station ${stationId}:`, iotError);
          throw new AppError(`Failed to send command to station: ${iotError}`, 500);
        }
      } else {
        logger.warn("IoT Manager not available, command created but not sent");
      }

      return await this.findCommandById(command.id);
    } catch (error) {
      logger.error("Error creating and sending command:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Error creating and sending command", 500);
    }
  }

  private async sendCommandToStation(
    commandId: number,
    stationId: number,
    commandPayload: CommandPayload
  ): Promise<void> {
    if (!this.iotManager) {
      throw new Error("IoT Manager not available");
    }

    const iotCommand = {
      commandId,
      type: this.checkCommandType(commandPayload),
      command: JSON.stringify(commandPayload),
      timestamp: new Date().toISOString(),
      timeout: 30,
    };

    await this.iotManager.sendCommand(stationId, iotCommand);
  }

  private setCommandTimeout(commandId: number, timeoutSeconds: number): void {
    setTimeout(async () => {
      try {
        const command = await this.findCommandById(commandId);

        if (command && (command.status === CommandStatus.PENDING || command.status === CommandStatus.SENT)) {
          await this.updateCommandStatus(commandId, CommandStatus.TIMEOUT);
          logger.warn(`Command ${commandId} timed out after ${timeoutSeconds} seconds`);
        }
      } catch (error) {
        logger.error(`Error handling timeout for command ${commandId}:`, error);
      }
    }, timeoutSeconds * 1000);
  }

  async updateCommandStatus(commandId: number, status: CommandStatus, executedAt?: Date) {
    try {
      const updateData: any = { status };

      if (status === CommandStatus.SENT) {
        updateData.sentAt = new Date();
      } else if (status === CommandStatus.EXECUTED && executedAt) {
        updateData.executedAt = executedAt;
      }

      const updatedCommand = await this.commandRepository.updateStatus(commandId, updateData);
      logger.info(`Command ${commandId} status updated to ${status}`);
      return updatedCommand;
    } catch (error) {
      logger.error(`Error updating command status for ID ${commandId}:`, error);
      throw new AppError(`Error updating command status for ID ${commandId}`, 500);
    }
  }

  // Method to handle command execution confirmation from device
  async handleCommandExecutionResponse(commandId: number, success: boolean, response?: any) {
    try {
      const status = success ? CommandStatus.EXECUTED : CommandStatus.FAILED;
      const executedAt = success ? new Date() : undefined;

      const updateData: any = {
        status,
        response: response ? JSON.stringify(response) : null,
      };

      if (executedAt) {
        updateData.executedAt = executedAt;
      }

      const updatedCommand = await this.commandRepository.updateStatus(commandId, updateData);

      logger.info(`Command ${commandId} execution ${success ? "confirmed" : "failed"}`);
      return updatedCommand;
    } catch (error) {
      logger.error(`Error handling command execution response for ID ${commandId}:`, error);
      throw new AppError(`Error handling command execution response for ID ${commandId}`, 500);
    }
  }

  async retryCommand(commandId: number) {
    try {
      const command = await this.findCommandById(commandId);

      if (!command) {
        throw new AppError("Command not found", 404);
      }

      if (command.status !== CommandStatus.FAILED && command.status !== CommandStatus.TIMEOUT) {
        throw new AppError("Can only retry failed or timed out commands", 400);
      }

      const commandPayload = {
        command: typeof command.command === "string" ? JSON.parse(command.command) : command.command,
      };

      await this.updateCommandStatus(commandId, CommandStatus.PENDING);

      if (this.iotManager) {
        await this.sendCommandToStation(commandId, command.stationId, commandPayload);
        await this.updateCommandStatus(commandId, CommandStatus.SENT, new Date());
        this.setCommandTimeout(commandId, 30);
      }

      return await this.findCommandById(commandId);
    } catch (error) {
      logger.error(`Error retrying command ${commandId}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError("Error retrying command", 500);
    }
  }

  async getPendingCommandsForStation(stationId: number) {
    try {
      return await this.commandRepository.findByStationAndStatus(stationId, [
        CommandStatus.PENDING,
        CommandStatus.SENT,
      ]);
    } catch (error) {
      logger.error(`Error getting pending commands for station ${stationId}:`, error);
      throw new AppError("Error getting pending commands", 500);
    }
  }

  async cancelCommand(commandId: number) {
    try {
      const command = await this.findCommandById(commandId);

      if (!command) {
        throw new AppError("Command not found", 404);
      }

      if (command.status === CommandStatus.EXECUTED) {
        throw new AppError("Cannot cancel executed command", 400);
      }

      await this.updateCommandStatus(commandId, CommandStatus.FAILED);
      logger.info(`Command ${commandId} cancelled`);

      return await this.findCommandById(commandId);
    } catch (error) {
      logger.error(`Error cancelling command ${commandId}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError("Error cancelling command", 500);
    }
  }

  async updateCommandExecuted(commandId: number) {
    return await this.updateCommandStatus(commandId, CommandStatus.EXECUTED, new Date());
  }

  async deleteCommand(commandId: number) {
    try {
      const deletedCommand = await this.commandRepository.delete(commandId);
      return deletedCommand;
    } catch (error) {
      logger.error(`Error deleting command for ID ${commandId}:`, error);
      throw new AppError(`Error deleting command for ID ${commandId}`, 500);
    }
  }

  async findAll(take: number, skip: number) {
    try {
      const commandData = await this.commandRepository.findAll(take, skip);
      return commandData;
    } catch (error) {
      logger.error(`Error getting commands:`, error);
      throw new AppError(`Error getting commands`, 500);
    }
  }

  async findCommandById(commandId: number) {
    try {
      const commandData = await this.commandRepository.findById(commandId);
      return commandData;
    } catch (error) {
      logger.error(`Error getting command:`, error);
      throw new AppError(`Error getting command`, 500);
    }
  }

  async getCommandStats(stationId?: number) {
    try {
      return await this.commandRepository.getCommandStats(stationId);
    } catch (error) {
      logger.error("Error getting command statistics:", error);
      throw new AppError("Error getting command statistics", 500);
    }
  }

  checkCommandType(commandPayload: CommandPayload) {
    switch (commandPayload.command) {
      case "activate":
        return CommandType.activate;
      case "deactivate":
        return CommandType.deactivate;
      case "reset":
        return CommandType.reset;
      case "update":
        return CommandType.update;
      case "sync":
        return CommandType.sync;
      default:
        throw new Error(`Invalid command: ${commandPayload.command}`);
    }
  }
}
