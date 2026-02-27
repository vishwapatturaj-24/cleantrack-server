import { Router } from 'express';
import { createComplaint, getUserComplaints, getComplaintById } from '../controllers/complaintController.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { createComplaintSchema } from '../validators/complaintValidator.js';
import { complaintLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authMiddleware);

router.post('/', complaintLimiter, upload.single('image'), validate(createComplaintSchema), createComplaint);
router.get('/', getUserComplaints);
router.get('/:id', getComplaintById);

export default router;
