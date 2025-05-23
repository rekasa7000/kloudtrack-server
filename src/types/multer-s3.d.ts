import "multer";

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        key?: string;
        location?: string;
        bucket?: string;
        contentType?: string;
        metadata?: any;
        size?: number;
        etag?: string;
        serverSideEncryption?: string;
        versionId?: string;
      }
    }
  }
}
