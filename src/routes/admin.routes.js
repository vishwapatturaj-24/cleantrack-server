import { Router } from 'express';
import { getAllComplaints, updateComplaintStatus, getStats, getAnalytics, getAllUsers } from '../controllers/adminController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.get('/users', getAllUsers);

export default router;
