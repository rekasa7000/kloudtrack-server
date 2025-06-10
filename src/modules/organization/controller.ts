import { Request, Response } from "express";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../core/utils/response";
import { OrganizationService } from "./service";
import { PaginationOptions } from "./repository";

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

    return sendResponse(res, data, 200, "Organization retrieved successfully");
  });

  getOrganizations = asyncHandler(async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    const options: PaginationOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await this.service.findManyPaginated(options);

    return sendResponse(res, result, 200, "Organizations retrieved successfully");
  });

  searchOrganizations = asyncHandler(async (req: Request, res: Response) => {
    const { q: searchTerm } = req.query;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    const options: PaginationOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await this.service.searchOrganizations(searchTerm as string, options);

    return sendResponse(res, result, 200, "Organizations search completed successfully");
  });

  getAllOrganizations = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.findMany();

    return sendResponse(res, data, 200, "All organizations retrieved successfully");
  });
}
