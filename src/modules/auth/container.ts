import { PrismaClient } from "@prisma/client";
import { AuthController } from "./controller";
import { AuthRepository } from "./repository";
import { AuthRoutes } from "./route";
import { AuthService } from "./service";
import { createTransporter } from "../../config/mail.config";

export class AuthContainer {
  public readonly repository: AuthRepository;
  public readonly service: AuthService;
  public readonly controller: AuthController;
  public readonly route: AuthRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new AuthRepository(prisma);
    this.service = new AuthService(createTransporter(), this.repository);
    this.controller = new AuthController(this.service);
    this.route = new AuthRoutes(this.controller);
  }
}
