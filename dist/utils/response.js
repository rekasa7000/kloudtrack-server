"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, data, statusCode = 200, message) => {
    const response = { success: true, data };
    if (message)
        response.message = message;
    res.status(statusCode).json(response);
};
exports.sendResponse = sendResponse;
