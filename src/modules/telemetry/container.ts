import { TelemetryRepository } from "./repository";
import prisma from "../../config/database.config";
import { TelemetryService } from "./service";

const telemetryRepository = new TelemetryRepository(prisma);
const telemetryService = new TelemetryService(telemetryRepository);

export default telemetryService;
