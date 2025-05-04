import path from "path";

export const getCertificateDir = () => {
  const baseDir =
    process.env.NODE_ENV === "production"
      ? process.env.CERT_DIR || "/etc/ssl/private/station-certs"
      : path.join(__dirname, "../../../certificates");

  return baseDir;
};
