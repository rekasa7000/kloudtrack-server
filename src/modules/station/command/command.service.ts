import { Prisma } from "@prisma/client";
import { AppError } from "../../../core/utils/error";
import { CommandRepository } from "./command.repository";

export class CommandService {
  private commandRepository: CommandRepository;

  constructor(commandRepository: CommandRepository) {
    this.commandRepository = commandRepository;
  }

  async newCommand(commandData: Prisma.CommandUncheckedCreateInput) {
    try {
      const command = await this.commandRepository.create(commandData);
      return command;
    } catch (error) {
      console.error("Error saving command:", error);
      throw new AppError("Error saving command", 500);
    }
  }

  async updateCommandExecuted(commandId: number) {
    try {
      const updatedCommand = await this.commandRepository.update(commandId);
      return updatedCommand;
    } catch (error) {
      console.error(`Error updating command executed status for ID ${commandId}:`, error);
      throw new AppError(`Error updating command executed status for ID ${commandId}`, 500);
    }
  }

  async deleteCommand(commandId: number) {
    try {
      const deletedCommand = await this.commandRepository.delete(commandId);
      return deletedCommand;
    } catch (error) {
      console.error(`Error updating command executed status for ID ${commandId}:`, error);
      throw new AppError(`Error updating command executed status for ID ${commandId}`, 500);
    }
  }

  async findAll(take: number, skip: number) {
    try {
      const commandData = await this.commandRepository.findAll(take, skip);
      return commandData;
    } catch (error) {
      console.error(`Error getting commands:`, error);
      throw new AppError(`Error getting commands`, 500);
    }
  }
  async findCommandById(commandId: number) {
    try {
      const commandData = await this.commandRepository.findById(commandId);
      return commandData;
    } catch (error) {
      console.error(`Error getting commands:`, error);
      throw new AppError(`Error getting commands`, 500);
    }
  }
}
