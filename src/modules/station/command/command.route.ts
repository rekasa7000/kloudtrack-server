import { Router } from "express";
import { CommandController } from "./command.controller";
import commandService from "./container";

export class CommandRoutes {
  private router: Router;
  private commandController: CommandController;

  constructor() {
    this.router = Router();
    this.commandController = new CommandController(commandService);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", this.commandController.findAllCommand.bind(this.commandController));
    this.router.get("/:id", this.commandController.findCommandById.bind(this.commandController));
    this.router.post("/", this.commandController.newCommand.bind(this.commandController));
    this.router.put("/:id", this.commandController.updateCommand.bind(this.commandController));
    this.router.delete("/:id", this.commandController.deleteCommand.bind(this.commandController));
  }

  public getRouter(): Router {
    return this.router;
  }
}
