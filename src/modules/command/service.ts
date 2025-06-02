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
    const command = await this.commandRepository.create(commandData);
    return command;
  }

  async createAndSendCommand(stationId: number, commandPayload: CommandPayload, userId: number) {
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
    const updateData: any = { status };

    if (status === CommandStatus.SENT) {
      updateData.sentAt = new Date();
    } else if (status === CommandStatus.EXECUTED && executedAt) {
      updateData.executedAt = executedAt;
    }

    const updatedCommand = await this.commandRepository.updateStatus(commandId, updateData);
    logger.info(`Command ${commandId} status updated to ${status}`);
    return updatedCommand;
  }

  async handleCommandExecutionResponse(commandId: number, success: boolean, response?: any) {
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
  }

  async retryCommand(commandId: number) {
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
  }

  async getPendingCommandsForStation(stationId: number) {
    return await this.commandRepository.findByStationAndStatus(stationId, [CommandStatus.PENDING, CommandStatus.SENT]);
  }

  async cancelCommand(commandId: number) {
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
  }

  async updateCommandExecuted(commandId: number) {
    return await this.updateCommandStatus(commandId, CommandStatus.EXECUTED, new Date());
  }

  async deleteCommand(commandId: number) {
    const deletedCommand = await this.commandRepository.delete(commandId);
    return deletedCommand;
  }

  async findAll(take: number, skip: number) {
    const commandData = await this.commandRepository.findAll(take, skip);
    return commandData;
  }

  async findCommandById(commandId: number) {
    const commandData = await this.commandRepository.findById(commandId);
    return commandData;
  }

  async getCommandStats(stationId?: number) {
    return await this.commandRepository.getCommandStats(stationId);
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
