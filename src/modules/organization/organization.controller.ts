import { Request, Response } from "express";
import prisma from "../../config/database.config";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../core/utils/response";
import logger from "../../core/utils/logger";

export const createOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const { organizationName, description } = req.body;
    const userId = req.user!.id;

    // Create organization and assign user as admin in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the organization
      const organization = await prisma.organization.create({
        data: {
          organizationName,
          description,
        },
      });

      // Create user-organization relationship with admin privileges
      await prisma.userOrganization.create({
        data: {
          userId,
          organizationId: organization.id,
          isAdmin: true,
        },
      });

      return organization;
    });

    logger.info(
      `Organization created: ${organizationName} by user ID: ${userId}`
    );
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
  }
);

export const getUserOrganizations = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const role = req.user!.role;

    let organizations;

    // Superadmins can see all organizations
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

      // Format the response
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

      return sendResponse(
        res,
        formattedOrganizations,
        200,
        "All organizations retrieved successfully"
      );
    }

    // Regular users and admins only see their organizations
    organizations = await prisma.userOrganization.findMany({
      where: {
        userId,
      },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                userOrganizations: true,
                station: true,
              },
            },
          },
        },
      },
      orderBy: {
        organization: {
          organizationName: "asc",
        },
      },
    });

    // Format the response
    const formattedOrganizations = organizations.map((userOrg) => ({
      id: userOrg.organization.id,
      name: userOrg.organization.organizationName,
      description: userOrg.organization.description,
      displayPicture: userOrg.organization.displayPicture,
      createdAt: userOrg.organization.createdAt,
      updatedAt: userOrg.organization.updatedAt,
      isAdmin: userOrg.isAdmin,
      userCount: userOrg.organization._count.userOrganizations,
      stationCount: userOrg.organization._count.station,
    }));

    return sendResponse(
      res,
      formattedOrganizations,
      200,
      "User organizations retrieved successfully"
    );
  }
);

/**
 * Get organization details by ID
 */
export const getOrganizationById = asyncHandler(
  async (req: Request, res: Response) => {
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

    // Check if user is organization admin to determine what data to include
    const userOrg = organization.userOrganizations.find(
      (uo) => uo.user.id === req.user!.id
    );
    const isAdmin = userOrg?.isAdmin || req.user!.role === "SUPERADMIN";

    // Format the response based on user access
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
      // Only include detailed user list if admin
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
      // Only include API keys if admin
      apiKeys: isAdmin
        ? organization.apiKey.map((key) => ({
            id: key.id,
            keyValue: key.keyValue.substring(0, 8) + "...",
            expiresAt: key.expiresAt,
          }))
        : undefined,
      // Include stations for all users with access
      stations: organization.station.map((station) => ({
        id: station.id,
        name: station.stationName,
        type: station.stationType,
        isActive: station.isActive,
      })),
    };

    logger.info(
      `Organization ${
        organization.organizationName
      } details accessed by user ID: ${req.user!.id}`
    );
    return sendResponse(
      res,
      formattedResponse,
      200,
      "Organization details retrieved successfully"
    );
  }
);

/**
 * Update organization details
 */
export const updateOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationName, description } = req.body;
    const organizationId = parseInt(id);

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        organizationName,
        description,
      },
    });

    logger.info(
      `Organization ${
        updatedOrganization.organizationName
      } updated by user ID: ${req.user!.id}`
    );
    return sendResponse(
      res,
      updatedOrganization,
      200,
      "Organization updated successfully"
    );
  }
);
