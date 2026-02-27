import cloudinary, { cloudinaryInitialized } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';

export async function uploadImage(fileBuffer, folder = 'cleantrack') {
  if (!cloudinaryInitialized) {
    logger.warn('Cloudinary not configured — skipping image upload');
    return { url: null, publicId: null };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteImage(publicId) {
  if (!cloudinaryInitialized || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Cloudinary image deleted: ${publicId}`);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
  }
}
