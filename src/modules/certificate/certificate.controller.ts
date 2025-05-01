import { asyncHandler } from "../../core/middlewares/error-handler.middleware";

// * ALL CERTIFICATES
export const getAllCertificates = asyncHandler(
  (req: Request, res: Response) => {}
);

// * UPLOAD ROOT CERTIFICATE
export const uploadCertificate = asyncHandler(
  (req: Request, res: Response) => {}
);

// * UPDATE CERTIFICATE
export const updateCertificate = asyncHandler(
  (req: Request, res: Response) => {}
);

// * DELETE CERTIFICATE
export const deleteCertificate = asyncHandler(
  (req: Request, res: Response) => {}
);

// * GET CERTIFICATE BY Station Id
export const getCertificateByStationId = asyncHandler(
  (req: Request, res: Response) => {}
);

// * GET ROOT CERTIFICATE
export const getRootCertificate = asyncHandler(
  (req: Request, res: Response) => {}
);

// * UPLOAD ROOT CERTIFICATE
export const uploadRootCertificate = asyncHandler(
  (req: Request, res: Response) => {}
);

// * UPDATE ROOT CERTIFICATE
export const updateRootCertificate = asyncHandler(
  (req: Request, res: Response) => {}
);

// * DELETE ROOT CERTIFICATE
export const deleteRootCertificate = asyncHandler(
  (req: Request, res: Response) => {}
);
