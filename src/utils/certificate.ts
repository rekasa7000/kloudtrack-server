import multer from "multer";
import path from "path";
import fs from "fs";

export const getCertificateDir = () => {
  const baseDir =
    process.env.NODE_ENV === "production"
      ? process.env.CERT_DIR || "/etc/ssl/private/station-certs"
      : path.join(__dirname, "../../certificates");

  return baseDir;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const stationId = req.body.id || "temp";
    const certDir = path.join(__dirname, "../../certificates", stationId);

    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    cb(null, certDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.originalname.endsWith(".key") ||
    file.originalname.endsWith(".crt") ||
    file.originalname.endsWith(".pem")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only .key and .crt files are allowed"));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});
