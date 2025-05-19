import { TelemetryRepository } from "./telemetry.repository";
import prisma from "../../../config/database.config";
import { TelemetryService } from "./telemetry.service";

const telemetryRepository = new TelemetryRepository(prisma);
const telemetryService = new TelemetryService(telemetryRepository);

export default telemetryService;
