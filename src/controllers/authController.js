import { db, auth } from '../config/firebase.js';
import { sendSuccess, sendError, now } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

export async function register(req, res) {
  try {
    const { displayName } = req.body;
    const { uid, email } = req.user;

    const existingUser = await db.collection('users').doc(uid).get();
    if (existingUser.exists) {
      return sendError(res, 'CONFLICT', 'User already registered', 409);
    }

    await auth.setCustomUserClaims(uid, { role: 'USER' });

    const userData = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      role: 'USER',
      createdAt: now(),
      updatedAt: now(),
    };
    await db.collection('users').doc(uid).set(userData);

    sendSuccess(res, userData, 'Registration complete', 201);
  } catch (error) {
    logger.error('Register error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Registration failed', 500);
  }
}

export async function getMe(req, res) {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) {
      return sendError(res, 'NOT_FOUND', 'User not found', 404);
    }
    sendSuccess(res, doc.data());
  } catch (error) {
    logger.error('GetMe error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch user', 500);
  }
}
