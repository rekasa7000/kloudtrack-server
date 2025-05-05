"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stationIdSchema = exports.updateStationSchema = exports.createStationSchema = exports.getAllStationsSchema = exports.IdParamSchema = exports.PaginationQuerySchema = exports.UpdateStationSchema = exports.CreateStationSchema = exports.StationMetadataSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.StationMetadataSchema = zod_1.z.object({
    stationName: zod_1.z.string().min(1, "Station name is required"),
    stationType: zod_1.z.nativeEnum(client_1.StationType, {
        errorMap: () => ({ message: "Invalid station type" }),
    }),
    location: zod_1.z.string().min(1, "Location is required"),
    barangay: zod_1.z.string().min(1, "Barangay is required"),
    city: zod_1.z.string().min(1, "City is required"),
    province: zod_1.z.string().min(1, "Province is required"),
    country: zod_1.z.string().min(1, "Country is required"),
    serialCode: zod_1.z.string().min(1, "Serial code is required"),
    elevation: zod_1.z.number().nonnegative("Elevation must be a non-negative number"),
    stationPicture: zod_1.z.string().url("Station picture must be a valid URL"),
    isActive: zod_1.z.boolean().default(false),
    activatedAt: zod_1.z
        .string()
        .datetime({ message: "Must be a valid ISO datetime string" })
        .optional(),
    firmwareVersion: zod_1.z.string().min(1, "Firmware version is required"),
    createdAt: zod_1.z
        .string()
        .datetime({ message: "Must be a valid ISO datetime string" })
        .optional(),
    updatedAt: zod_1.z
        .string()
        .datetime({ message: "Must be a valid ISO datetime string" })
        .optional(),
});
exports.CreateStationSchema = exports.StationMetadataSchema.omit({
    createdAt: true,
    updatedAt: true,
});
exports.UpdateStationSchema = exports.StationMetadataSchema.partial();
exports.PaginationQuerySchema = zod_1.z.object({
    skip: zod_1.z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Skip must be a non-negative number",
    }),
    take: zod_1.z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Take must be a positive number",
    }),
});
exports.IdParamSchema = zod_1.z.object({
    id: zod_1.z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "ID must be a positive number",
    }),
});
exports.getAllStationsSchema = zod_1.z.object({
    query: exports.PaginationQuerySchema,
});
exports.createStationSchema = zod_1.z.object({
    body: exports.CreateStationSchema,
});
exports.updateStationSchema = zod_1.z.object({
    params: exports.IdParamSchema,
    body: exports.UpdateStationSchema,
});
exports.stationIdSchema = zod_1.z.object({
    params: exports.IdParamSchema,
});
