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
} from "./certificate.controller";

const router = Router();

const rootCertificateRoute: string = "/root";
const certificateRoute: string = "/:stationId";

// *** AMAZON ROOT CERTIFICATE ***
// Upload Root Certificate
router.post(rootCertificateRoute, createRootCertificate);
// Update Root Certificate
router.put(rootCertificateRoute, updateRootCertificate);
// Delete Root Certificate
router.delete(rootCertificateRoute, deleteRootCertificate);
// Get Root Certificate
router.get(rootCertificateRoute, getRootCertificate);

// *** CERTIFICATE PER STATIONS ***
// Upload Certificate
router.post(certificateRoute, uploadCertificate);
// Update Certificate
router.put(certificateRoute, updateCertificate);
// Delete Certificate
router.delete(certificateRoute, deleteCertificate);
// Get Certificate by Station ID
router.get(certificateRoute, getCertificateByStationId);

export default router;
