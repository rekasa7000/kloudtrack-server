import path from "path";
import { CERTIFICATE_DIR } from "../../../config/certificate.config";

export const normalizeVersion = (version: string | number): string => {
  return version.toString().toUpperCase().replace("CA", "");
};

export const formatVersion = (version: string): string => {
  return `CA${version}`;
};

export const getCertificatePath = (version: string): string => {
  const formattedVersion = formatVersion(version);
  const fileName = `AmazonRoot${formattedVersion}.pem`;
  return path.join(CERTIFICATE_DIR, fileName);
};
