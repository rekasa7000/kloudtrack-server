import { Router } from "express";
import { UserController, uploadProfilePictureMiddleware } from "./controller";

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
    this.router.get("/", this.controller.getCurrentUser.bind(this.controller));
    this.router.get("/many", this.controller.getUsers.bind(this.controller));
    this.router.get("/:id", this.controller.getUserById.bind(this.controller));
    this.router.put("/:id", this.controller.updateUser.bind(this.controller));
    this.router.delete("/:id", this.controller.deleteUser.bind(this.controller));

    // Profile picture upload
    this.router.post(
      "/:id/picture",
      uploadProfilePictureMiddleware,
      this.controller.uploadProfilePicture.bind(this.controller)
    );

    // Password management
    this.router.put("/:id/change-password", this.controller.changePassword.bind(this.controller));

    // Organization-related routes
    this.router.get("/organization/:organizationId", this.controller.getUsersByOrganization.bind(this.controller));
    this.router.get(
      "/organization/:organizationId/simple",
      this.controller.getUsersByOrganizationSimple.bind(this.controller)
    );
    this.router.get(
      "/organization/:organizationId/admins",
      this.controller.getAdminUsersByOrganization.bind(this.controller)
    );

    // User-Organization relationship management
    this.router.post("/organization/add-user", this.controller.addUserToOrganization.bind(this.controller));
    this.router.post("/organization/add-users", this.controller.addUsersToOrganization.bind(this.controller));
    this.router.delete(
      "/organization/:organizationId/user/:userId",
      this.controller.removeUserFromOrganization.bind(this.controller)
    );
    this.router.put(
      "/organization/:organizationId/user/:userId/role",
      this.controller.updateUserOrganizationRole.bind(this.controller)
    );

    // Utility routes
    this.router.get("/no-organization", this.controller.getUsersWithoutOrganization.bind(this.controller));
    this.router.get("/expired-passwords", this.controller.getUsersWithExpiredPasswords.bind(this.controller));
  }

  public getRouter(): Router {
    return this.router;
  }
}
