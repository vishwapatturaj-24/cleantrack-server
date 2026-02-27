import { auth } from '../config/firebase.js';
import { sendError } from '../utils/helpers.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'Access token required', 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || 'USER',
    };
    next();
  } catch (error) {
    sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions', 403);
    }
    next();
  };
}
