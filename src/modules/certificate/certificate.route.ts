import { Router, Request, Response } from "express";
import {
  deleteCertificate,
  deleteRootCertificate,
  getCertificateByStationId,
  getRootCertificate,
  updateCertificate,
  updateRootCertificate,
  uploadCertificate,
  uploadRootCertificate,
} from "./certificate.controller";

const router = Router();

const certificateRoute: string = "/:stationId/certificate";
const rootCertificateRoute: string = "/certificate/root";

// *** CERTIFICATE PER STATIONS ***
// Upload Certificate
router.post(certificateRoute, uploadCertificate);
// Update Certificate
router.put(certificateRoute, updateCertificate);
// Delete Certificate
router.delete(certificateRoute, deleteCertificate);
// Get Certificate by Station ID
router.get(certificateRoute, getCertificateByStationId);

// *** AMAZON ROOT CERTIFICATE ***
// Upload Root Certificate
router.post(rootCertificateRoute, uploadRootCertificate);
// Update Root Certificate
router.put(rootCertificateRoute, updateRootCertificate);
// Delete Root Certificate
router.delete(rootCertificateRoute, deleteRootCertificate);
// Get Root Certificate
router.get(rootCertificateRoute, getRootCertificate);

export default router;
