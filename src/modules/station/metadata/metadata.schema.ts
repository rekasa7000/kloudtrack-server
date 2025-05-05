import { z } from "zod";

export enum StationType {
  WEATHERSTATION = "AWS",
  RAINGAUGE = "ARG",
  RIVERLEVEL = "RLMS",
  COASTALLEVEL = "CLMS",
}

export const StationMetadataSchema = z.object({
  stationName: z.string().min(1, "Station name is required"),
  stationType: z.nativeEnum(StationType, {
    errorMap: () => ({ message: "Invalid station type" }),
  }),
  location: z.string().min(1, "Location is required"),
  barangay: z.string().min(1, "Barangay is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  country: z.string().min(1, "Country is required"),
  serialCode: z.string().min(1, "Serial code is required"),
  elevation: z.number().nonnegative("Elevation must be a non-negative number"),
  stationPicture: z.string().url("Station picture must be a valid URL"),
  isActive: z.boolean().default(false),
  activatedAt: z
    .string()
    .datetime({ message: "Must be a valid ISO datetime string" })
    .optional(),
  firmwareVersion: z.string().min(1, "Firmware version is required"),
  createdAt: z
    .string()
    .datetime({ message: "Must be a valid ISO datetime string" })
    .optional(),
  updatedAt: z
    .string()
    .datetime({ message: "Must be a valid ISO datetime string" })
    .optional(),
});

export const CreateStationSchema = StationMetadataSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateStationSchema = StationMetadataSchema.partial();

export const PaginationQuerySchema = z.object({
  skip: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Skip must be a non-negative number",
  }),
  take: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Take must be a positive number",
  }),
});

export const IdParamSchema = z.object({
  id: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "ID must be a positive number",
  }),
});

export const getAllStationsSchema = z.object({
  query: PaginationQuerySchema,
});
export const createStationSchema = z.object({
  body: CreateStationSchema,
});
export const updateStationSchema = z.object({
  params: IdParamSchema,
  body: UpdateStationSchema,
});
export const stationIdSchema = z.object({
  params: IdParamSchema,
});
