import { z } from "zod";

const certificateTextSchema = z
  .string()
  .refine((text) => text.includes("BEGIN CERTIFICATE") && text.includes("END CERTIFICATE"), {
    message: "Invalid certificate format. Must be a valid PEM certificate.",
  });

const versionSchema = z.string().regex(/^CA\d+$|^\d+$/, {
  message: "Version must be in format 'CA1', 'CA2', etc. or a number",
});

// CREATE Root Certificate
export const createRootCertificateSchema = z.object({
  body: z.union([
    z.object({
      uploadType: z.literal("text"),
      certificateText: certificateTextSchema,
      version: versionSchema.optional().default("CA1"),
    }),
    z
      .object({
        version: versionSchema.optional().default("CA1"),
      })
      .passthrough(),
    z.object({}).passthrough(),
  ]),
});

// UPDATE Root Certificate
export const updateRootCertificateSchema = z.object({
  params: z.object({
    id: z
      .string()
      .or(z.number())
      .transform((value) => (typeof value === "string" ? parseInt(value, 10) : value)),
  }),
  body: z.union([
    z.object({
      uploadType: z.literal("text"),
      certificateText: certificateTextSchema,
      version: versionSchema.optional(),
    }),
    z
      .object({
        version: versionSchema.optional(),
      })
      .passthrough(),
    z.object({}).passthrough(),
  ]),
});

// DELETE Root Certificate
export const deleteRootCertificateSchema = z.object({
  params: z.object({
    id: z
      .string()
      .or(z.number())
      .transform((value) => (typeof value === "string" ? parseInt(value, 10) : value)),
  }),
});

// ACTIVATE Root Certificate
export const activateRootCertificateSchema = z.object({
  params: z.object({
    id: z
      .string()
      .or(z.number())
      .transform((value) => (typeof value === "string" ? parseInt(value, 10) : value)),
  }),
});
