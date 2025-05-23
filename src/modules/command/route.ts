import { Router } from "express";
import { CommandController } from "./controller";

export class CommandRoutes {
  private router: Router;
  private controller: CommandController;

  constructor(commandController: CommandController) {
    this.router = Router();
    this.controller = commandController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", this.controller.findAllCommand.bind(this.controller));
    this.router.get("/:id", this.controller.findCommandById.bind(this.controller));
    this.router.post("/", this.controller.newCommand.bind(this.controller));
    this.router.put("/:id", this.controller.updateCommand.bind(this.controller));
    this.router.delete("/:id", this.controller.deleteCommand.bind(this.controller));
  }

  public getRouter(): Router {
    return this.router;
  }
}
