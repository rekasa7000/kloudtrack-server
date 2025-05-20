import path from "path";
import config from "../../config/environment.config";

export const CERTIFICATE_STATUSES = ["ACTIVE", "INACTIVE", "REVOKED"] as const;
export const VERSION_PATTERN = /^CA\d+$/i;
export const CERTIFICATE_DIR =
  config.NODE_ENV === "production"
    ? config.CERT_DIR || "/etc/ssl/private/station-certs"
    : path.join(__dirname, "../../../../certificates");
export const CERTIFICATE_TYPES = {
  PRIVATE_KEY: "private.pem.key",
  CERTIFICATE: "certificate.pem.crt",
  ROOT_CA: ".pem",
};
