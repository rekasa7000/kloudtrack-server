"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stationIdSchema = exports.updateCertificateSchema = exports.uploadCertificateSchema = exports.activateRootCertificateSchema = exports.deleteRootCertificateSchema = exports.updateRootCertificateSchema = exports.createRootCertificateSchema = void 0;
const zod_1 = require("zod");
const certificateTextSchema = zod_1.z
    .string()
    .refine((text) => text.includes("BEGIN CERTIFICATE") && text.includes("END CERTIFICATE"), { message: "Invalid certificate format. Must be a valid PEM certificate." });
const versionSchema = zod_1.z.string().regex(/^CA\d+$|^\d+$/, {
    message: "Version must be in format 'CA1', 'CA2', etc. or a number",
});
// CREATE Root Certificate
exports.createRootCertificateSchema = zod_1.z.object({
    body: zod_1.z.union([
        zod_1.z.object({
            uploadType: zod_1.z.literal("text"),
            certificateText: certificateTextSchema,
            version: versionSchema.optional().default("CA1"),
        }),
        zod_1.z
            .object({
            version: versionSchema.optional().default("CA1"),
        })
            .passthrough(),
        zod_1.z.object({}).passthrough(),
    ]),
});
// UPDATE Root Certificate
exports.updateRootCertificateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string()
            .or(zod_1.z.number())
            .transform((value) => typeof value === "string" ? parseInt(value, 10) : value),
    }),
    body: zod_1.z.union([
        zod_1.z.object({
            uploadType: zod_1.z.literal("text"),
            certificateText: certificateTextSchema,
            version: versionSchema.optional(),
        }),
        zod_1.z
            .object({
            version: versionSchema.optional(),
        })
            .passthrough(),
        zod_1.z.object({}).passthrough(),
    ]),
});
// DELETE Root Certificate
exports.deleteRootCertificateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string()
            .or(zod_1.z.number())
            .transform((value) => typeof value === "string" ? parseInt(value, 10) : value),
    }),
});
// ACTIVATE Root Certificate
exports.activateRootCertificateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string()
            .or(zod_1.z.number())
            .transform((value) => typeof value === "string" ? parseInt(value, 10) : value),
    }),
});
// UPLOAD Certificates and private key
exports.uploadCertificateSchema = zod_1.z.object({
    params: zod_1.z.object({
        stationId: zod_1.z
            .string()
            .or(zod_1.z.number())
            .transform((value) => typeof value === "string" ? parseInt(value, 10) : value),
    }),
    body: zod_1.z.discriminatedUnion("uploadType", [
        zod_1.z.object({
            uploadType: zod_1.z.literal("text"),
            serialCode: zod_1.z.string().min(1, "Station Serial is required"),
            certificateContent: zod_1.z.string().min(1, "Certificate content is required"),
            privateKeyContent: zod_1.z.string().min(1, "Private key content is required"),
            certificateId: zod_1.z.string().optional(),
            certificateArn: zod_1.z.string().optional(),
        }),
        zod_1.z.object({
            uploadType: zod_1.z.literal("file"),
            serialCode: zod_1.z.string().min(1, "Station Serial is required"),
            certificateId: zod_1.z.string().optional(),
            certificateArn: zod_1.z.string().optional(),
        }),
    ]),
});
// UPDATE certificate and private key
exports.updateCertificateSchema = zod_1.z.object({
    params: zod_1.z.object({
        stationId: zod_1.z
            .string()
            .or(zod_1.z.number())
            .transform((value) => typeof value === "string" ? parseInt(value, 10) : value),
    }),
    body: zod_1.z.discriminatedUnion("uploadType", [
        zod_1.z.object({
            uploadType: zod_1.z.literal("text"),
            serialCode: zod_1.z.string().min(1, "Station Serial is required"),
            certificateContent: zod_1.z.string().min(1, "Certificate content is required"),
            privateKeyContent: zod_1.z.string().min(1, "Private key content is required"),
            certificateId: zod_1.z.string().optional(),
            certificateArn: zod_1.z.string().optional(),
        }),
        zod_1.z.object({
            uploadType: zod_1.z.literal("file"),
            serialCode: zod_1.z.string().min(1, "Station Serial is required"),
            certificateId: zod_1.z.string().optional(),
            certificateArn: zod_1.z.string().optional(),
        }),
    ]),
});
exports.stationIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        stationId: zod_1.z
            .string()
            .or(zod_1.z.number())
            .transform((value) => typeof value === "string" ? parseInt(value, 10) : value),
    }),
});
