import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';

const env = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.projectId,
    clientEmail: env.clientEmail,
    privateKey: env.privateKey,
  }),
});

const authAdmin = admin.auth();
const db = admin.firestore();

const email = process.argv[2];
if (!email) {
  console.error('Usage: node src/scripts/seedAdmin.js <email>');
  process.exit(1);
}

try {
  const user = await authAdmin.getUserByEmail(email);
  await authAdmin.setCustomUserClaims(user.uid, { role: 'ADMIN' });
  await db.collection('users').doc(user.uid).update({ role: 'ADMIN', updatedAt: new Date().toISOString() });
  console.log(`User ${email} promoted to ADMIN successfully`);
  process.exit(0);
} catch (error) {
  console.error('Error promoting user:', error.message);
  process.exit(1);
}
