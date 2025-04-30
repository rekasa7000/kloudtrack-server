import { Response } from "express";

type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export const sendResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
) => {
  const response: SuccessResponse<T> = { success: true, data };
  if (message) response.message = message;
  res.status(statusCode).json(response);
};
