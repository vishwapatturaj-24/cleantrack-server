import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let firebaseInitialized = false;

if (!admin.apps.length) {
  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey,
      }),
    });
    firebaseInitialized = true;
    logger.info('Firebase Admin initialized');
  } else {
    logger.warn('Firebase credentials not configured - running without Firebase');
  }
} else {
  firebaseInitialized = true;
}

export const db = firebaseInitialized ? admin.firestore() : null;
export const auth = firebaseInitialized ? admin.auth() : null;
export { firebaseInitialized };
export default admin;
