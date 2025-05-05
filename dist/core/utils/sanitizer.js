"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizePathComponent = void 0;
const sanitizePathComponent = (input) => {
    if (!input)
        return "";
    return input
        .replace(/\.\./g, "")
        .replace(/[/\\:*?"<>|]/g, "_")
        .trim();
};
exports.sanitizePathComponent = sanitizePathComponent;
