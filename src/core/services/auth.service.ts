import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import config from "../../config/environment";

export const generateToken = (userId: number, res: Response): string => {
  const token = jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: "7d" });

  res.cookie("kloudtrack-jwt", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000, //30 dayums
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
  });

  return token;
};

export const clearAuthCookie = (res: Response): void => {
  res.cookie("zorb-jwt", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
  });
};

export const extractToken = (req: Request): string | null => {
  if (req.headers.authorization?.startsWith("Bearer")) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.cookies && req.cookies["zorb-jwt"]) {
    return req.cookies["zorb-jwt"];
  }

  return null;
};
