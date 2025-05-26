import { Prisma } from "@prisma/client";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { CommandService, CommandPayload } from "./service";
import { Request, Response } from "express";
import { sendResponse } from "../../core/utils/response";
import { AppError } from "../../core/utils/error";

export class CommandController {
  private service: CommandService;

  constructor(commandService: CommandService) {
    this.service = commandService;
  }

  newCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandData: Prisma.CommandUncheckedCreateInput = req.body;
    const data = await this.service.newCommand(commandData);
    return sendResponse(res, data, 201, "Command created successfully");
  });

  createAndSendCommand = asyncHandler(async (req: Request, res: Response) => {
    const { stationId, commandPayload } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!stationId || !commandPayload) {
      throw new AppError("Station ID and command payload are required", 400);
    }

    const data = await this.service.createAndSendCommand(stationId, commandPayload, userId);
    return sendResponse(res, data, 201, "Command created and sent successfully");
  });

  updateCommandExecuted = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.service.updateCommandExecuted(+commandId);
    return sendResponse(res, data, 200, "Command status updated to executed");
  });

  handleCommandExecutionResponse = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const { success, response } = req.body;

    if (typeof success !== "boolean") {
      throw new AppError("Success field is required and must be boolean", 400);
    }

    const data = await this.service.handleCommandExecutionResponse(+commandId, success, response);
    return sendResponse(res, data, 200, "Command execution response handled successfully");
  });

  retryCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.service.retryCommand(+commandId);
    return sendResponse(res, data, 200, "Command retried successfully");
  });

  cancelCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.service.cancelCommand(+commandId);
    return sendResponse(res, data, 200, "Command cancelled successfully");
  });

  getPendingCommandsForStation = asyncHandler(async (req: Request, res: Response) => {
    const stationId = req.params.stationId;
    const data = await this.service.getPendingCommandsForStation(+stationId);
    return sendResponse(res, data, 200, "Pending commands fetched successfully");
  });

  deleteCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.service.deleteCommand(+commandId);
    return sendResponse(res, data, 200, "Command deleted successfully");
  });

  findCommandById = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.service.findCommandById(+commandId);

    if (!data) {
      throw new AppError("Command not found", 404);
    }

    return sendResponse(res, data, 200, "Command fetched successfully");
  });

  findAllCommands = asyncHandler(async (req: Request, res: Response) => {
    const take = req.query.take ? +req.query.take : 10;
    const skip = req.query.skip ? +req.query.skip : 0;

    const data = await this.service.findAll(take, skip);
    return sendResponse(res, data, 200, "Commands fetched successfully");
  });

  getCommandStats = asyncHandler(async (req: Request, res: Response) => {
    const stationId = req.query.stationId ? +req.query.stationId : undefined;
    const data = await this.service.getCommandStats(stationId);
    return sendResponse(res, data, 200, "Command statistics fetched successfully");
  });
}
