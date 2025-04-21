"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, config_1.default.JWT_SECRET, { expiresIn: "7d" });
};
exports.generateToken = generateToken;
const setAuthCookie = (res, token) => {
    res.cookie("zorb-jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    });
};
exports.setAuthCookie = setAuthCookie;
