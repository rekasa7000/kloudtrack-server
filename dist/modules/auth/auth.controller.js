"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = exports.login = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const error_handler_middleware_1 = require("../../core/middlewares/error-handler.middleware");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_service_1 = require("../../core/services/auth.service");
const logger_1 = __importDefault(require("../../core/utils/logger"));
const response_1 = require("../../core/utils/response");
exports.login = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await database_config_1.default.user.findUnique({
        where: { email },
        select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            password: true,
            userOrganizations: {
                include: {
                    organization: {
                        select: {
                            id: true,
                            organizationName: true,
                        },
                    },
                },
            },
        },
    });
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }
    const token = (0, auth_service_1.generateToken)(user.id, res);
    const userData = {
        id: user.id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizations: user.userOrganizations.map((uo) => ({
            id: uo.organization.id,
            name: uo.organization.organizationName,
            isAdmin: uo.isAdmin,
        })),
    };
    return res.status(200).json({
        success: true,
        message: "Sign in successful",
        token,
        user: userData,
    });
});
exports.checkAuth = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    logger_1.default.info(`${req.user?.email} - User authenticated`);
    return (0, response_1.sendResponse)(res, req.user, 200, "Authenticated");
});
