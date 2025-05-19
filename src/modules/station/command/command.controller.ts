import { Prisma } from "@prisma/client";
import { asyncHandler } from "../../../core/middlewares/error-handler.middleware";
import { CommandService } from "./command.service";
import { Request, Response } from "express";
import { sendResponse } from "../../../core/utils/response";
import { AppError } from "../../../core/utils/error";

export class CommandController {
  private commandService: CommandService;

  constructor(commandService: CommandService) {
    this.commandService = commandService;
  }

  newCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandData: Prisma.CommandUncheckedCreateInput = req.body;
    const data = await this.commandService.newCommand(commandData);

    return sendResponse(res, data, 400, "Command sent successfully");
  });
  updateCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.commandService.updateCommandExecuted(+commandId);

    return sendResponse(res, data, 400, "Command updated successfully");
  });
  deleteCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.commandService.deleteCommand(+commandId);

    return sendResponse(res, data, 400, "Command deleted successfully");
  });
  findCommandById = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.commandService.findCommandById(+commandId);

    return sendResponse(res, data, 400, "Command fetched");
  });
  findAllCommand = asyncHandler(async (req: Request, res: Response) => {
    const take = req.query.take ? +req.query.take : 10;
    const skip = req.query.skip ? +req.query.skip : 0;

    const data = await this.commandService.findAll(+take, +skip);

    return sendResponse(res, data, 400, "Command updated successfully");
  });
}
