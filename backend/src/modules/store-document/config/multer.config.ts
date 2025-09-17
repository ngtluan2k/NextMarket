import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';

export const multerConfig: MulterOptions = {
  // Store in memory for processing
  storage: undefined, // Use memory storage (default)
  
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1, // Only one file at a time
  },
  
  fileFilter: (req, file, callback) => {
    // Allowed MIME types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
        ),
        false
      );
    }
  },
};
