import { z } from "zod";

// UPLOAD Certificates and private key
export const uploadCertificateSchema = z.object({
  params: z.object({
    stationId: z
      .string()
      .or(z.number())
      .transform((value) => (typeof value === "string" ? parseInt(value, 10) : value)),
  }),
  body: z.discriminatedUnion("uploadType", [
    z.object({
      uploadType: z.literal("text"),
      serialCode: z.string().min(1, "Station Serial is required"),
      certificateContent: z.string().min(1, "Certificate content is required"),
      privateKeyContent: z.string().min(1, "Private key content is required"),
      certificateId: z.string().optional(),
      certificateArn: z.string().optional(),
    }),
    z.object({
      uploadType: z.literal("file"),
      serialCode: z.string().min(1, "Station Serial is required"),
      certificateId: z.string().optional(),
      certificateArn: z.string().optional(),
    }),
  ]),
});

// UPDATE certificate and private key
export const updateCertificateSchema = z.object({
  params: z.object({
    stationId: z
      .string()
      .or(z.number())
      .transform((value) => (typeof value === "string" ? parseInt(value, 10) : value)),
  }),
  body: z.discriminatedUnion("uploadType", [
    z.object({
      uploadType: z.literal("text"),
      serialCode: z.string().min(1, "Station Serial is required"),
      certificateContent: z.string().min(1, "Certificate content is required"),
      privateKeyContent: z.string().min(1, "Private key content is required"),
      certificateId: z.string().optional(),
      certificateArn: z.string().optional(),
    }),
    z.object({
      uploadType: z.literal("file"),
      serialCode: z.string().min(1, "Station Serial is required"),
      certificateId: z.string().optional(),
      certificateArn: z.string().optional(),
    }),
  ]),
});

export const stationIdSchema = z.object({
  params: z.object({
    stationId: z
      .string()
      .or(z.number())
      .transform((value) => (typeof value === "string" ? parseInt(value, 10) : value)),
  }),
});
