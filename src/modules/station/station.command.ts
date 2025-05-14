import { PrismaClient } from "@prisma/client";
import { CommandData } from "./station.types";

export class CommandService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async saveCommand(commandData: CommandData): Promise<number> {
    try {
      const command = await this.prisma.command.create({
        data: {
          stationId: commandData.stationId,
          issuedBy: commandData.issuedBy,
          command: commandData.command,
        },
      });
      return command.id;
    } catch (error) {
      console.error("Error saving command:", error);
      throw error;
    }
  }

  async updateCommandExecuted(commandId: number): Promise<void> {
    try {
      await this.prisma.command.update({
        where: { id: commandId },
        data: { executedAt: new Date() },
      });
    } catch (error) {
      console.error(`Error updating command executed status for ID ${commandId}:`, error);
      throw error;
    }
  }
}
