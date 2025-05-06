"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("../utils/error");
const database_config_1 = __importDefault(require("../../config/database.config"));
const environment_config_1 = __importDefault(require("../../config/environment.config"));
const generateToken = (userId, res) => {
    const token = jsonwebtoken_1.default.sign({ userId }, environment_config_1.default.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("zorb-jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    });
    return token;
};
exports.generateToken = generateToken;
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            return next(new error_1.AppError("You are not logged in. Please log in to get access.", 401));
        }
        const decoded = jsonwebtoken_1.default.verify(token, environment_config_1.default.JWT_SECRET);
        const currentUser = await database_config_1.default.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                passwordChangedAt: true,
            },
        });
        if (!currentUser) {
            return next(new error_1.AppError("The user belonging to this token no longer exists.", 401));
        }
        if (currentUser.passwordChangedAt) {
            const changedTimestamp = Math.floor(new Date(currentUser.passwordChangedAt).getTime() / 1000);
            if (decoded.iat < changedTimestamp) {
                return next(new error_1.AppError("User recently changed password! Please log in again.", 401));
            }
        }
        req.user = currentUser;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new error_1.AppError("Invalid token. Please log in again.", 401));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new error_1.AppError("Your token has expired! Please log in again.", 401));
        }
        return next(new error_1.AppError("Authentication failed", 401));
    }
};
exports.protect = protect;
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_1.AppError("You are not logged in", 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new error_1.AppError("You do not have permission to perform this action", 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
