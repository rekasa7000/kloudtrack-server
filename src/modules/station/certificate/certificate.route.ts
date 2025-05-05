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
  deleteCertificateSchema,
  deleteRootCertificateSchema,
  getCertificateByStationIdSchema,
  getRootCertificateSchema,
  listRootCertificatesSchema,
  updateCertificateSchema,
  updateRootCertificateSchema,
  uploadCertificateSchema,
} from "./certificate.schema";

const router = Router();

const rootCertificateRoute: string = "/root";
const certificateRoute: string = "/:stationId";

// *** AMAZON ROOT CERTIFICATE ***
// Upload Root Certificate
router.post(
  rootCertificateRoute,
  validateRequest(createRootCertificateSchema),
  createRootCertificate
);
// Update Root Certificate
router.put(
  `${rootCertificateRoute}/:id`,
  validateRequest(updateRootCertificateSchema),
  updateRootCertificate
);
// Delete Root Certificate
router.delete(
  `${rootCertificateRoute}/:id`,
  validateRequest(deleteRootCertificateSchema),
  deleteRootCertificate
);
// Get Root Certificate
router.get(
  `${rootCertificateRoute}/:id`,
  validateRequest(getRootCertificateSchema),
  getRootCertificate
);
// Activate Root Certificate
router.post(
  `${rootCertificateRoute}/:id`,
  validateRequest(activateRootCertificateSchema),
  activateRootCertificate
);
// Get all root certificate
router.post(
  rootCertificateRoute,
  validateRequest(listRootCertificatesSchema),
  listRootCertificates
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
  validateRequest(deleteCertificateSchema),
  deleteCertificate
);
// Get Certificate by Station ID
router.get(
  certificateRoute,
  validateRequest(getCertificateByStationIdSchema),
  getCertificateByStationId
);

export default router;
