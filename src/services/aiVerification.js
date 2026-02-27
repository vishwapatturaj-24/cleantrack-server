import { logger } from '../utils/logger.js';

const CATEGORY_KEYWORDS = {
  pothole: {
    primary: ['pothole', 'pit', 'crater', 'hole in road', 'road damage', 'road hole'],
    secondary: ['road', 'street', 'asphalt', 'pavement', 'concrete', 'highway',
      'bumpy', 'broken road', 'crack', 'sinkhole', 'dip'],
  },
  drainage: {
    primary: ['drain', 'drainage', 'sewer', 'flooding', 'waterlog', 'clog', 'blocked drain'],
    secondary: ['water', 'flood', 'overflow', 'stagnant', 'sewage', 'gutter',
      'manhole', 'pipe', 'rainwater', 'storm drain', 'puddle'],
  },
  garbage: {
    primary: ['garbage', 'trash', 'waste', 'rubbish', 'litter', 'dump', 'debris'],
    secondary: ['bin', 'dustbin', 'collection', 'smell', 'stink', 'pile',
      'overflowing bin', 'cleanup', 'sanitation', 'dirty', 'filth'],
  },
  water_leak: {
    primary: ['leak', 'water leak', 'pipe burst', 'broken pipe', 'water supply',
      'tap', 'leaking'],
    secondary: ['water', 'pipe', 'plumbing', 'supply', 'pressure', 'wet',
      'dripping', 'burst', 'seepage', 'valve', 'meter'],
  },
  electric_issue: {
    primary: ['electric', 'power', 'outage', 'blackout', 'wire', 'cable',
      'transformer', 'streetlight'],
    secondary: ['light', 'pole', 'voltage', 'spark', 'short circuit', 'fuse',
      'electricity', 'current', 'bulb', 'lamp', 'grid'],
  },
};

export function analyzeComplaint({ title, description, category }) {
  const text = `${title} ${description}`.toLowerCase();
  const matchedKeywords = [];
  const scores = {};

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    for (const kw of keywords.primary) {
      if (text.includes(kw)) {
        score += 3;
        matchedKeywords.push(kw);
      }
    }

    for (const kw of keywords.secondary) {
      if (text.includes(kw)) {
        score += 1;
        matchedKeywords.push(kw);
      }
    }

    scores[cat] = score;
  }

  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);
  const [predictedCategory, topScore] = entries[0];
  const totalScore = entries.reduce((sum, [, s]) => sum + s, 0);

  let confidence;
  if (totalScore === 0) {
    confidence = 0.3;
  } else {
    const rawConfidence = topScore / Math.max(totalScore, 1);
    const absoluteBonus = Math.min(topScore / 15, 0.3);
    confidence = Math.min(rawConfidence * 0.7 + absoluteBonus + 0.1, 0.99);
  }
  confidence = Math.round(confidence * 100) / 100;

  const categoryMatches = predictedCategory === category;
  let verificationStatus;

  if (categoryMatches && confidence > 0.7) {
    verificationStatus = 'VERIFIED';
  } else if (confidence >= 0.5 && confidence <= 0.7) {
    verificationStatus = 'FLAGGED';
  } else if (!categoryMatches && confidence < 0.5) {
    verificationStatus = 'SUSPICIOUS';
  } else if (categoryMatches) {
    verificationStatus = 'FLAGGED';
  } else {
    verificationStatus = 'FLAGGED';
  }

  const result = {
    predictedCategory,
    confidence,
    verificationStatus,
    keywords: [...new Set(matchedKeywords)],
    analyzedAt: new Date().toISOString(),
  };

  logger.info(`AI Verification: selected=${category}, predicted=${predictedCategory}, confidence=${confidence}, status=${verificationStatus}`);

  return result;
}
