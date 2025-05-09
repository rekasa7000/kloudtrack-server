"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificate_controller_1 = require("./certificate.controller");
const router = (0, express_1.Router)();
const certificateRoute = "/:stationId/certificate";
const rootCertificateRoute = "/certificate/root";
// *** CERTIFICATE PER STATIONS ***
// Upload Certificate
router.post(certificateRoute, certificate_controller_1.uploadCertificate);
// Update Certificate
router.put(certificateRoute, certificate_controller_1.updateCertificate);
// Delete Certificate
router.delete(certificateRoute, certificate_controller_1.deleteCertificate);
// Get Certificate by Station ID
router.get(certificateRoute, certificate_controller_1.getCertificateByStationId);
// *** AMAZON ROOT CERTIFICATE ***
// Upload Root Certificate
router.post(rootCertificateRoute, certificate_controller_1.uploadRootCertificate);
// Update Root Certificate
router.put(rootCertificateRoute, certificate_controller_1.updateRootCertificate);
// Delete Root Certificate
router.delete(rootCertificateRoute, certificate_controller_1.deleteRootCertificate);
// Get Root Certificate
router.get(rootCertificateRoute, certificate_controller_1.getRootCertificate);
exports.default = router;
