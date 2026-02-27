import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let cloudinaryInitialized = false;

if (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  cloudinaryInitialized = true;
} else {
  logger.warn('Cloudinary credentials not configured — image uploads will be skipped');
}

export { cloudinaryInitialized };
export default cloudinary;
