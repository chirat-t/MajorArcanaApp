import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

// ตอนรันจริง Metro (iOS/Android) resolve @firebase/auth ผ่าน export condition "react-native"
// ซึ่งมี getReactNativePersistence อยู่ แต่ TypeScript หยุดที่ condition "types" ตัวแรกของแพ็กเกจ
// (auth-public.d.ts) ที่ไม่ได้ประกาศฟังก์ชันนี้ไว้ จึงประกาศ type เพิ่มตรงนี้ (ตาม signature ของ
// dist/rn/index.rn.d.ts) แทนการแก้ tsconfig ทั้งโปรเจกต์
declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage
  ): import('firebase/auth').Persistence;
}

// iOS/Android: React Native ไม่มี IndexedDB จึงต้องบอก Firebase Auth ให้เก็บ session ใน
// AsyncStorage เอง (แนวทางของ Expo สำหรับ Firebase JS SDK v10 ขึ้นไป) ไม่งั้นจะได้ uid ใหม่
// ทุกครั้งที่เปิดแอป — initializeAuth เรียกได้ครั้งเดียวต่อ app ถ้าถูกเรียกซ้ำ (เช่น fast
// refresh ตอนพัฒนา) จะ throw จึงถอยไปใช้ instance เดิมผ่าน getAuth
export function createAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}
