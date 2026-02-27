import { db } from '../config/firebase.js';
import { sendSuccess, sendError, now } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

export async function getAllComplaints(req, res) {
  try {
    const { status, category, dateFrom, dateTo, page = 1, limit = 20, search } = req.query;

    let query = db.collection('complaints').orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);

    const snapshot = await query.get();
    let complaints = snapshot.docs.map(doc => doc.data());

    if (dateFrom) complaints = complaints.filter(c => c.createdAt >= dateFrom);
    if (dateTo) complaints = complaints.filter(c => c.createdAt <= dateTo);

    if (search) {
      const s = search.toLowerCase();
      complaints = complaints.filter(c =>
        c.title.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s) ||
        c.userName.toLowerCase().includes(s)
      );
    }

    const total = complaints.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    sendSuccess(res, complaints.slice(offset, offset + limitNum), undefined, 200, {
      page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Admin get complaints error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch complaints', 500);
  }
}

export async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid status', 400);
    }

    const docRef = db.collection('complaints').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return sendError(res, 'NOT_FOUND', 'Complaint not found', 404);
    }

    const complaint = doc.data();
    const statusEntry = {
      status,
      timestamp: now(),
      note: note || `Status changed to ${status}`,
      changedBy: req.user.uid,
    };

    const updatedHistory = [...complaint.statusHistory, statusEntry];
    await docRef.update({
      status,
      statusHistory: updatedHistory,
      updatedAt: now(),
    });

    sendSuccess(res, { ...complaint, status, statusHistory: updatedHistory }, 'Status updated');
  } catch (error) {
    logger.error('Update status error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to update status', 500);
  }
}

export async function getStats(req, res) {
  try {
    const snapshot = await db.collection('complaints').get();
    const complaints = snapshot.docs.map(doc => doc.data());

    sendSuccess(res, {
      total: complaints.length,
      submitted: complaints.filter(c => c.status === 'SUBMITTED').length,
      inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
      resolved: complaints.filter(c => c.status === 'RESOLVED').length,
      rejected: complaints.filter(c => c.status === 'REJECTED').length,
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch stats', 500);
  }
}

export async function getAnalytics(req, res) {
  try {
    const snapshot = await db.collection('complaints').get();
    const complaints = snapshot.docs.map(doc => doc.data());

    const categoryDistribution = {};
    for (const c of complaints) {
      categoryDistribution[c.category] = (categoryDistribution[c.category] || 0) + 1;
    }

    const monthlyTrends = {};
    for (const c of complaints) {
      const month = c.createdAt.substring(0, 7);
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1;
    }

    const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED');
    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        const created = new Date(c.createdAt);
        const resolvedEntry = c.statusHistory?.find(h => h.status === 'RESOLVED');
        if (resolvedEntry) {
          return sum + (new Date(resolvedEntry.timestamp) - created) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedComplaints.length);
    }

    const withAi = complaints.filter(c => c.aiVerification);
    const aiVerification = {
      verified: withAi.filter(c => c.aiVerification.verificationStatus === 'VERIFIED').length,
      flagged: withAi.filter(c => c.aiVerification.verificationStatus === 'FLAGGED').length,
      suspicious: withAi.filter(c => c.aiVerification.verificationStatus === 'SUSPICIOUS').length,
      total: withAi.length,
    };

    sendSuccess(res, { categoryDistribution, monthlyTrends, avgResolutionHours, aiVerification });
  } catch (error) {
    logger.error('Get analytics error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch analytics', 500);
  }
}

export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = snapshot.docs.map(doc => doc.data());

    const total = users.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    sendSuccess(res, users.slice(offset, offset + limitNum), undefined, 200, {
      page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Get users error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch users', 500);
  }
}
