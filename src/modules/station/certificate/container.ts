import { CertificateRepository } from "./certificate.repository";
import prisma from "../../../config/database.config";
import { CertificateService } from "./certificate.service";
import { CERTIFICATE_DIR } from "./certificate.constant";

const certificateRepository = new CertificateRepository(prisma);
const certificateService = new CertificateService(CERTIFICATE_DIR, certificateRepository);

export default certificateService;
