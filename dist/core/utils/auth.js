"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractToken = exports.clearAuthCookie = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_config_1 = __importDefault(require("../../config/environment.config"));
const generateToken = (userId, res) => {
    const token = jsonwebtoken_1.default.sign({ userId }, environment_config_1.default.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("zorb-jwt", token, {
        maxAge: 30 * 24 * 60 * 60 * 1000, //30 dayums
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
        path: "/",
    });
    return token;
};
exports.generateToken = generateToken;
const clearAuthCookie = (res) => {
    res.cookie("zorb-jwt", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
        path: "/",
    });
};
exports.clearAuthCookie = clearAuthCookie;
const extractToken = (req) => {
    if (req.headers.authorization?.startsWith("Bearer")) {
        return req.headers.authorization.split(" ")[1];
    }
    if (req.cookies && req.cookies["zorb-jwt"]) {
        return req.cookies["zorb-jwt"];
    }
    return null;
};
exports.extractToken = extractToken;
