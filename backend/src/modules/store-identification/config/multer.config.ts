// File: backend/src/modules/store-identification/config/multer.config.ts

import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import multer from 'multer';

export const multerConfig: MulterOptions = {
  // Store in memory for processing
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images
    files: 1, // Only one file at a time
  },

  fileFilter: (req, file, callback) => {
    // Allowed MIME types for images only
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

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
