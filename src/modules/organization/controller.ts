import { Request, Response } from "express";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../core/utils/response";
import { OrganizationService } from "./service";

export class OrganizationController {
  private service: OrganizationService;

  constructor(organizationService: OrganizationService) {
    this.service = organizationService;
  }

  createOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { organizationName, description } = req.body;

    const data = await this.service.createOrganization({ organizationName, description });

    return sendResponse(
      res,
      {
        id: data.id,
        organizationName: data.organizationName,
        description: data.description,
        displayPicture: data.displayPicture,
        createdAt: data.createdAt,
      },
      201,
      "Organization created successfully"
    );
  });

  updateOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationName, description } = req.body;

    const updatedOrganization = await this.service.update({ organizationName, description }, +id);
    return sendResponse(res, updatedOrganization, 200, "Organization updated successfully");
  });

  deleteOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await this.service.delete(+id);
    return sendResponse(res, undefined, 200, "Organization deleted successfully");
  });

  getOrganizationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const data = await this.service.findById(+id);
    return sendResponse(res, data, 200, "Organization deleted successfully");
  });
}
