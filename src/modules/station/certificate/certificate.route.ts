import { Router } from "express";
import {
  deleteCertificate,
  deleteRootCertificate,
  getCertificateByStationId,
  getRootCertificate,
  updateCertificate,
  updateRootCertificate,
  uploadCertificate,
  createRootCertificate,
  activateRootCertificate,
  listRootCertificates,
} from "./certificate.controller";
import { validateRequest } from "../../../core/middlewares/validation.middleware";
import {
  activateRootCertificateSchema,
  createRootCertificateSchema,
  deleteRootCertificateSchema,
  stationIdSchema,
  updateCertificateSchema,
  updateRootCertificateSchema,
  uploadCertificateSchema,
} from "./certificate.schema";
import { upload } from "./certificate.service";

const router = Router();

const rootCertificateRoute: string = "/root";
const certificateRoute: string = "/:stationId";

// *** AMAZON ROOT CERTIFICATE ***
// Get all root certificate
router.get(rootCertificateRoute, listRootCertificates);
// Get Root Certificate
router.get(`${rootCertificateRoute}/:id`, getRootCertificate);
// Upload Root Certificate
router.post(
  rootCertificateRoute,
  upload.single("file"),
  validateRequest(createRootCertificateSchema),
  createRootCertificate
);
// Update Root Certificate
router.put(
  `${rootCertificateRoute}/:id`,
  upload.single("file"),
  validateRequest(updateRootCertificateSchema),
  updateRootCertificate
);
// Delete Root Certificate
router.delete(
  `${rootCertificateRoute}/:id`,
  validateRequest(deleteRootCertificateSchema),
  deleteRootCertificate
);
// Activate Root Certificate
router.post(
  `${rootCertificateRoute}/:id`,
  validateRequest(activateRootCertificateSchema),
  activateRootCertificate
);

// *** CERTIFICATE PER STATIONS ***
// Upload Certificate
router.post(
  certificateRoute,
  validateRequest(uploadCertificateSchema),
  uploadCertificate
);
// Update Certificate
router.put(
  certificateRoute,
  validateRequest(updateCertificateSchema),
  updateCertificate
);
// Delete Certificate
router.delete(
  certificateRoute,
  validateRequest(stationIdSchema),
  deleteCertificate
);
// Get Certificate by Station ID
router.get(
  certificateRoute,
  validateRequest(stationIdSchema),
  getCertificateByStationId
);

export default router;
