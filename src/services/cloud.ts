import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, signInAnonymously, type Auth, type User } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';

import { createAuth } from './firebaseAuth';
import { SCHEMA_VERSION, type UserDocPayload } from './syncMerge';

// ค่า config อ่านจาก EXPO_PUBLIC_* ซึ่ง Expo แทนค่าลงไปตอน build — ต้องเขียน
// process.env.EXPO_PUBLIC_XXX ตรง ๆ ทีละตัว (อ่านแบบ dynamic เช่น process.env[name] จะไม่ถูกแทนค่า)
// ค่าพวกนี้เป็น web config ของ Firebase ซึ่งเปิดเผยได้ตามการออกแบบ ความปลอดภัยมาจาก Security Rules
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ไม่มี config ครบ (เช่น รันในเครื่องโดยไม่มี .env หรือ fork repo ไป) → แอปทำงานแบบ local
// อย่างเดียวเหมือนเดิม ไม่ throw ไม่ต่อเน็ต
export const cloudEnabled = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0
);

// ใช้ emulator เฉพาะตอนพัฒนา/ทดสอบ (ตั้ง EXPO_PUBLIC_USE_EMULATOR=1 ใน .env ของเครื่อง)
const useEmulator = process.env.EXPO_PUBLIC_USE_EMULATOR === '1';

export type CloudServices = { app: FirebaseApp; auth: Auth; db: Firestore };

let services: CloudServices | null = null;

// สร้าง Firebase แบบ lazy ครั้งเดียว — ยังไม่ต่อเน็ตจนกว่าจะเรียก ensureSignedIn/อ่านเขียนข้อมูล
// Firestore ใช้ memory cache ค่าเริ่มต้น เพราะชั้น offline หลักของแอปคือ AsyncStorage
export function getCloud(): CloudServices | null {
  if (!cloudEnabled) return null;
  if (services) return services;

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = createAuth(app);
  const db = getFirestore(app);
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  services = { app, auth, db };
  return services;
}

let signInPromise: Promise<User | null> | null = null;

// คืนผู้ใช้ปัจจุบัน ถ้ายังไม่มีจะล็อกอินแบบ Anonymous ให้ — รอ authStateReady() ก่อนเสมอ
// เพื่อให้ session ที่เก็บไว้ (IndexedDB/AsyncStorage) ถูกโหลดกลับมาก่อน ไม่งั้นจะสร้าง uid ใหม่
// ซ้อนทุกครั้งที่เปิดแอป เรียกพร้อมกันหลายที่ก็ล็อกอินครั้งเดียว (แชร์ promise) และถ้าล้มเหลว
// (เช่น offline) จะล้าง promise เพื่อให้ลองใหม่ได้ในครั้งถัดไป
export function ensureSignedIn(): Promise<User | null> {
  const cloud = getCloud();
  if (!cloud) return Promise.resolve(null);
  if (cloud.auth.currentUser) return Promise.resolve(cloud.auth.currentUser);

  if (!signInPromise) {
    signInPromise = (async () => {
      await cloud.auth.authStateReady();
      if (cloud.auth.currentUser) return cloud.auth.currentUser;
      const credential = await signInAnonymously(cloud.auth);
      return credential.user;
    })().catch((error: unknown) => {
      signInPromise = null;
      throw error;
    });
  }
  return signInPromise;
}

// อ่านเอกสาร users/{uid} ครั้งเดียว (ไม่ใช้ listener เพื่อประหยัดโควตา) — คืน null ถ้ายังไม่มีเอกสาร
// throw ถ้าอ่านไม่ได้ (ออฟไลน์/ถูกปฏิเสธ) ให้ผู้เรียกจับเอง
export async function fetchUserDoc(uid: string): Promise<unknown | null> {
  const cloud = getCloud();
  if (!cloud) throw new Error('cloud disabled');
  const snap = await getDoc(doc(cloud.db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// เขียน viewed/favorites ด้วย merge เพื่อไม่ทับ field ที่ขั้นอื่นเพิ่ม (lastReadingId/lastReadingAt)
// รูปแบบตรงกับ firestore.rules: updatedAt ต้องเป็น serverTimestamp และ schemaVersion = 1
export async function writeUserDoc(uid: string, payload: UserDocPayload): Promise<void> {
  const cloud = getCloud();
  if (!cloud) throw new Error('cloud disabled');
  await setDoc(
    doc(cloud.db, 'users', uid),
    { ...payload, updatedAt: serverTimestamp(), schemaVersion: SCHEMA_VERSION },
    { merge: true }
  );
}
