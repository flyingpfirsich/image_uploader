import multer from 'multer';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { config } from '../config.js';
import { generateId } from '../utils/nanoid.js';

// Ensure uploads directory exists
const mediaDir = join(config.uploadsDir, 'media');
const avatarsDir = join(config.uploadsDir, 'avatars');
mkdirSync(mediaDir, { recursive: true });
mkdirSync(avatarsDir, { recursive: true });

// Storage for post media
const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, mediaDir);
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop() || 'bin';
    cb(null, `${generateId()}.${ext}`);
  },
});

// Storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop() || 'bin';
    cb(null, `${generateId()}.${ext}`);
  },
});

// File filter for images and videos
const mediaFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`));
  }
};

// File filter for images only (avatars)
const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image type: ${file.mimetype}`));
  }
};

export const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFilter,
  limits: { fileSize: config.maxFileSize },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
});






