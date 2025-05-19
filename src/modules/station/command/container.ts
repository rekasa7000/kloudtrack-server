import { CommandRepository } from "./command.repository";
import prisma from "../../../config/database.config";
import { CommandService } from "./command.service";

const commandRepository = new CommandRepository(prisma);
const commandService = new CommandService(commandRepository);

export default commandService;
