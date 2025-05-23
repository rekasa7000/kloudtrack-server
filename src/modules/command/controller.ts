import { Prisma } from "@prisma/client";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { CommandService } from "./service";
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

    return sendResponse(res, data, 400, "Command sent successfully");
  });
  updateCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.service.updateCommandExecuted(+commandId);

    return sendResponse(res, data, 400, "Command updated successfully");
  });
  deleteCommand = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.service.deleteCommand(+commandId);

    return sendResponse(res, data, 400, "Command deleted successfully");
  });
  findCommandById = asyncHandler(async (req: Request, res: Response) => {
    const commandId = req.params.id;
    const data = await this.service.findCommandById(+commandId);

    return sendResponse(res, data, 400, "Command fetched");
  });
  findAllCommand = asyncHandler(async (req: Request, res: Response) => {
    const take = req.query.take ? +req.query.take : 10;
    const skip = req.query.skip ? +req.query.skip : 0;

    const data = await this.service.findAll(+take, +skip);

    return sendResponse(res, data, 400, "Command updated successfully");
  });
}
