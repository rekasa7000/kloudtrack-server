import { PrismaClient } from "@prisma/client";
import { MetadataRepository } from "./metadata.repository";
import prisma from "../../../config/database.config";
import { MetadataService } from "./metadata.service";

const metadataRepository = new MetadataRepository(prisma);
const metadataService = new MetadataService(metadataRepository);

export default metadataService;
