import { Router } from "express";
import UserController from "./controller";

export class UserRoutes {
  private router: Router;
  private controller: UserController;

  constructor(userController: UserController) {
    this.router = Router();
    this.controller = userController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/", this.controller.createUser.bind(this.controller));
    this.router.post("/bulk", this.controller.bulkCreateUsers.bind(this.controller));
    this.router.post("/picture", this.controller.uploadProfilePicture.bind(this.controller));
    this.router.put("/:id", this.controller.updateUser.bind(this.controller));
    this.router.delete("/:id", this.controller.deleteUser.bind(this.controller));
    this.router.get("/", this.controller.getCurrentUser.bind(this.controller));
    this.router.get("/:id", this.controller.getUserById.bind(this.controller));
    this.router.get("/many", this.controller.getUsers.bind(this.controller));
    this.router.get("/no-org", this.controller.getUsersWithoutOrganization.bind(this.controller));
    this.router.get("/exp-pass", this.controller.getUsersWithoutOrganization.bind(this.controller));
  }

  public getRouter(): Router {
    return this.router;
  }
}
