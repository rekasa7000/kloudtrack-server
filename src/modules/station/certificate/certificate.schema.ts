import { z } from "zod";
import { CERTIFICATE_STATUSES, VERSION_PATTERN } from "./certificate.constant";

export const idSchema = z.object({
  id: z.string().or(z.number().int().positive().transform(String)),
});

export const stationIdSchema = z.object({
  stationId: z.string().or(z.number().int().positive().transform(String)),
});

export const certificateContentSchema = z.object({
  certificateText: z.string().min(1, "Certificate text is required"),
});

export const privateKeyContentSchema = z.object({
  privateKeyContent: z.string().min(1, "Private key content is required"),
});

export const versionSchema = z.object({
  version: z
    .string()
    .regex(VERSION_PATTERN, "Version must be in format CA1, CA2, etc.")
    .optional(),
});

export const statusSchema = z.object({
  status: z.enum(CERTIFICATE_STATUSES).optional(),
});

export const awsCertificateSchema = z.object({
  certificateId: z.string().optional(),
  certificateArn: z.string().optional(),
});

export const serialCodeSchema = z.object({
  serialCode: z
    .string()
    .min(1, "Serial code is required")
    .regex(/^[a-zA-Z0-9-_]+$/, "Serial code contains invalid characters"),
});

export const getRootCertificateSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({}),
});

export const createRootCertificateSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.union([certificateContentSchema.merge(versionSchema), versionSchema]),
});

export const updateRootCertificateSchema = z.object({
  params: idSchema,
  query: z.object({}),
  body: z.union([certificateContentSchema.merge(versionSchema), versionSchema]),
});

export const deleteRootCertificateSchema = z.object({
  params: idSchema,
  query: z.object({}),
  body: z.object({}),
});

export const activateRootCertificateSchema = z.object({
  params: idSchema,
  query: z.object({}),
  body: z.object({}),
});

export const listRootCertificatesSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({}),
});

export const getAllCertificatesSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({}),
});

export const uploadCertificateSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.union([
    serialCodeSchema.merge(
      certificateContentSchema.merge(
        privateKeyContentSchema.merge(awsCertificateSchema)
      )
    ),
    serialCodeSchema.merge(awsCertificateSchema),
  ]),
});

export const updateCertificateSchema = z.object({
  params: stationIdSchema,
  query: z.object({}),
  body: z.union([
    z
      .object({
        certificateContent: z.string().optional(),
        privateKeyContent: z.string().optional(),
      })
      .merge(awsCertificateSchema)
      .merge(statusSchema)
      .refine(
        (data) => {
          return (
            data.certificateContent !== undefined ||
            data.privateKeyContent !== undefined ||
            data.certificateId !== undefined ||
            data.certificateArn !== undefined ||
            data.status !== undefined
          );
        },
        { message: "At least one field is required for update" }
      ),
    awsCertificateSchema.merge(statusSchema).refine(
      (data) => {
        return (
          data.certificateId !== undefined ||
          data.certificateArn !== undefined ||
          data.status !== undefined
        );
      },
      { message: "At least one field is required for update" }
    ),
  ]),
});

export const deleteCertificateSchema = z.object({
  params: stationIdSchema,
  query: z.object({}),
  body: z.object({}),
});

export const getCertificateByStationIdSchema = z.object({
  params: stationIdSchema,
  query: z.object({}),
  body: z.object({}),
});
