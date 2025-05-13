import jwt from "jsonwebtoken";
import { Response } from "express";

export const generateToken = (payload: { id: number }): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
};

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie("kloudtrack-jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });
};
