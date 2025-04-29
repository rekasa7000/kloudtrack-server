import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.middleware";
import prisma from "../config/db";
import { upload } from "../utils/certificate";
import path from "path";
import fs from "fs";

const router = Router();

router.post(
  "/create",
  upload.fields([
    { name: "key", maxCount: 1 },
    { name: "cert", maxCount: 1 },
    { name: "pem", maxCount: 1 },
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const {
      stationName,
      stationType,
      location,
      barangay,
      city,
      province,
      country,
    } = req.body;

    if (!files.key || !files.cert) {
      return res
        .status(400)
        .json({ error: "Both key and certificate files are required" });
    }

    const certDir = path.join(
      __dirname,
      "../../certificates",
      stationName.toString()
    );
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    const keyFile = files.key[0];
    const certFile = files.cert[0];

    if (keyFile.path.includes("temp")) {
      const newKeyPath = path.join(certDir, keyFile.originalname);
      fs.renameSync(keyFile.path, newKeyPath);
      keyFile.path = newKeyPath;
    }

    if (certFile.path.includes("temp")) {
      const newCertPath = path.join(certDir, certFile.originalname);
      fs.renameSync(certFile.path, newCertPath);
      certFile.path = newCertPath;
    }

    const updatedStation = await prisma.station.update({
      where: { stationName },
      data: {
        keyPath: keyFile.path,
        certPath: certFile.path,
      },
    });

    res.status(201).json(updatedStation);
  })
);

router.put(
  "/update",
  asyncHandler((req: Request, res: Response) => {})
);
router.post(
  "/delete",
  asyncHandler((req: Request, res: Response) => {})
);
router.get(
  "/:id",
  asyncHandler((req: Request, res: Response) => {})
);

export default router;
