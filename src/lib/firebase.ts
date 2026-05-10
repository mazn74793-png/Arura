import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Using initializeFirestore instead of getFirestore to enable long-polling
// This helps bypass connection issues in restricted network environments (previews)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Connectivity check
async function testConnection() {
  try {
    const testDoc = await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore Connected successfully", testDoc.exists());
  } catch (error) {
    console.error("Firestore connection failed:", error);
  }
}
testConnection();
