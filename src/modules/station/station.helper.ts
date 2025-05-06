import { Station } from "@prisma/client";
import { StationLookup } from "./station.types";
import prisma from "../../config/database.config";
import { AppError } from "../../core/utils/error";

export const validateStationExists = async (
  lookup: StationLookup
): Promise<Station> => {
  const { serialCode, stationId, stationName } = lookup;

  const station = await prisma.station.findFirst({
    where: {
      ...(serialCode && { serialCode }),
      ...(stationName && { stationName }),
      ...(stationId && { id: stationId }),
    },
  });

  if (!station) {
    throw new AppError("Station not found with the given identifier(s)", 400);
  }

  return station;
};
