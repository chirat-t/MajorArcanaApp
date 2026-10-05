import type { FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// เว็บ: getAuth เก็บ session ของผู้ใช้ไว้ใน IndexedDB ให้อัตโนมัติ (uid เดิมหลังรีเฟรช)
// ฝั่ง iOS/Android ใช้ไฟล์ firebaseAuth.native.ts แทน (Metro เลือกตามนามสกุลแพลตฟอร์ม)
export function createAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}
