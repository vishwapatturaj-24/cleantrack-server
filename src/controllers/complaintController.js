import { db } from '../config/firebase.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { analyzeComplaint } from '../services/aiVerification.js';
import { sendSuccess, sendError, now } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

export async function createComplaint(req, res) {
  try {
    const { category, title, description, lat, lng, address } = req.body;
    const { uid, email } = req.user;

    let imageUrl = null;
    let imagePublicId = null;
    if (req.file) {
      const result = await uploadImage(req.file.buffer);
      imageUrl = result.url;
      imagePublicId = result.publicId;
    }

    const aiVerification = analyzeComplaint({ title, description, category });

    const userDoc = await db.collection('users').doc(uid).get();
    const userName = userDoc.exists ? userDoc.data().displayName : email;

    const complaintRef = db.collection('complaints').doc();
    const complaint = {
      id: complaintRef.id,
      userId: uid,
      userEmail: email,
      userName,
      category,
      title,
      description,
      imageUrl,
      imagePublicId,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || '',
      },
      status: 'SUBMITTED',
      statusHistory: [
        { status: 'SUBMITTED', timestamp: now(), note: 'Initial submission' },
      ],
      aiVerification,
      createdAt: now(),
      updatedAt: now(),
    };

    await complaintRef.set(complaint);

    sendSuccess(res, complaint, 'Complaint submitted successfully', 201);
  } catch (error) {
    logger.error('Create complaint error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to submit complaint', 500);
  }
}

export async function getUserComplaints(req, res) {
  try {
    const { uid } = req.user;
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = db.collection('complaints')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = db.collection('complaints')
        .where('userId', '==', uid)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    const allComplaints = snapshot.docs.map(doc => doc.data());

    const total = allComplaints.length;
    const offset = (pageNum - 1) * limitNum;
    const complaints = allComplaints.slice(offset, offset + limitNum);

    sendSuccess(res, complaints, undefined, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Get user complaints error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch complaints', 500);
  }
}

export async function getComplaintById(req, res) {
  try {
    const { id } = req.params;
    const doc = await db.collection('complaints').doc(id).get();

    if (!doc.exists) {
      return sendError(res, 'NOT_FOUND', 'Complaint not found', 404);
    }

    const complaint = doc.data();

    if (complaint.userId !== req.user.uid && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    sendSuccess(res, complaint);
  } catch (error) {
    logger.error('Get complaint error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch complaint', 500);
  }
}
