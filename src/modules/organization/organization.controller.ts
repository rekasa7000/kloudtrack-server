import { Request, Response } from "express";
import prisma from "../../config/database.config";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../core/utils/response";
import logger from "../../core/utils/logger";
import { OrganizationService } from "./organization.service";

export class OrganizationController {
  private organizationService: OrganizationService;
  constructor(organizationService: OrganizationService) {
    this.organizationService = organizationService;
  }

  createOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { organizationName, description } = req.body;
    const userId = req.user!.id;

    const result = await prisma.$transaction(async (prisma) => {
      const organization = await this.organizationService.create({ organizationName, description });

      await prisma.userOrganization.create({
        data: {
          userId,
          organizationId: organization.id,
          isAdmin: true,
        },
      });

      return organization;
    });

    logger.info(`Organization created: ${organizationName} by user ID: ${userId}`);
    return sendResponse(
      res,
      {
        id: result.id,
        organizationName: result.organizationName,
        description: result.description,
        displayPicture: result.displayPicture,
        createdAt: result.createdAt,
      },
      201,
      "Organization created successfully"
    );
  });

  getUserOrganization = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const role = req.user!.role;

    let organizations;

    if (role === "SUPERADMIN") {
      organizations = await prisma.organization.findMany({
        include: {
          _count: {
            select: {
              userOrganizations: true,
            },
          },
          userOrganizations: {
            where: {
              userId,
            },
            select: {
              isAdmin: true,
            },
          },
        },
        orderBy: {
          organizationName: "asc",
        },
      });

      const formattedOrganizations = organizations.map((org) => ({
        id: org.id,
        name: org.organizationName,
        description: org.description,
        displayPicture: org.displayPicture,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        userCount: org._count.userOrganizations,
        isAdmin: org.userOrganizations[0]?.isAdmin || false,
      }));

      return sendResponse(res, formattedOrganizations, 200, "All organizations retrieved successfully");
    }
  });

  getOrganizationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = parseInt(id);

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      include: {
        _count: {
          select: {
            userOrganizations: true,
            station: true,
          },
        },
        userOrganizations: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePicture: true,
                role: true,
              },
            },
          },
        },
        station: {
          select: {
            id: true,
            stationName: true,
            stationType: true,
            isActive: true,
          },
        },
        apiKey: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            keyValue: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const userOrg = organization.userOrganizations.find((uo) => uo.user.id === req.user!.id);
    const isAdmin = userOrg?.isAdmin || req.user!.role === "SUPERADMIN";

    const formattedResponse = {
      id: organization.id,
      name: organization.organizationName,
      description: organization.description,
      displayPicture: organization.displayPicture,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      statistics: {
        userCount: organization._count.userOrganizations,
        stationCount: organization._count.station,
      },
      members: isAdmin
        ? organization.userOrganizations.map((uo) => ({
            id: uo.user.id,
            userName: uo.user.userName,
            firstName: uo.user.firstName,
            lastName: uo.user.lastName,
            email: uo.user.email,
            profilePicture: uo.user.profilePicture,
            role: uo.user.role,
            isAdmin: uo.isAdmin,
          }))
        : undefined,
      apiKeys: isAdmin
        ? organization.apiKey.map((key) => ({
            id: key.id,
            keyValue: key.keyValue.substring(0, 8) + "...",
            expiresAt: key.expiresAt,
          }))
        : undefined,
      stations: organization.station.map((station) => ({
        id: station.id,
        name: station.stationName,
        type: station.stationType,
        isActive: station.isActive,
      })),
    };

    logger.info(`Organization ${organization.organizationName} details accessed by user ID: ${req.user!.id}`);
    return sendResponse(res, formattedResponse, 200, "Organization details retrieved successfully");
  });

  updateOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationName, description } = req.body;

    const updatedOrganization = await this.organizationService.update({ organizationName, description }, +id);
    return sendResponse(res, updatedOrganization, 200, "Organization updated successfully");
  });
}
