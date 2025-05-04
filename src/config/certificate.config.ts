import path from "path";
import config from "./environment.config";

export const CERTIFICATE_TYPES = {
  PRIVATE_KEY: "private.pem.key",
  CERTIFICATE: "certificate.pem.key",
  ROOT_CA: "AmazonRootCA1.pem",
};

export const CERTIFICATE_DIR =
  config.NODE_ENV === "production"
    ? config.CERT_DIR || "/etc/ssl/private/station-certs"
    : path.join(__dirname, "../../../certificates");

export const ROOT_CA_VERSIONS = {
  CA1: "AmazonRootCA1.pem",
  CA2: "AmazonRootCA2.pem",
  CA3: "AmazonRootCA3.pem",
  CA4: "AmazonRootCA4.pem",
};
