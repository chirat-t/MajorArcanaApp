// ฟังก์ชันล้วน ๆ สำหรับซิงก์ progress/favorites กับ Firestore — ห้าม import Firebase ในไฟล์นี้
// เพื่อให้ CollectionContext import แบบปกติได้โดยไม่ดึง Firebase เข้า bundle หลัก (Firebase
// อยู่ใน cloud.ts ที่โหลดด้วย dynamic import) และทดสอบด้วย Node ตรง ๆ ได้ (tests/sync-merge.test.mjs)
// ไม่มี import ใด ๆ ทั้งสิ้น: Node รันไฟล์ .ts นี้ได้ด้วยการตัด type ออกอย่างเดียว

export type ViewedMap = Record<string, string>; // cardId -> ISO time ที่ดูครั้งแรก
type ProgressEntry = { cardId: string; isViewed: boolean; viewedAt?: string };
export type ProgressLike = Record<string, ProgressEntry>;

export const SCHEMA_VERSION = 1;
export const MAX_FAVORITES = 22; // ต้องตรงกับ firestore.rules

// ตรวจแค่ว่าตั้งค่า Firebase ครบหรือไม่ โดยไม่ import Firebase — ต้องเขียน process.env.EXPO_PUBLIC_XXX
// ตรง ๆ ทีละตัวเหมือน cloud.ts เพื่อให้ Expo แทนค่าตอน build (ซ้ำกับเงื่อนไขใน cloud.ts โดยตั้งใจ)
export function hasCloudConfig(): boolean {
  const values = [
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  ];
  return values.every((value) => typeof value === 'string' && value.length > 0);
}

// progress ในเครื่อง -> viewed บนคลาวด์ (เฉพาะใบที่ดูแล้วและเป็น id ไพ่จริง)
export function progressToViewed(progress: ProgressLike, validIds: ReadonlySet<string>): ViewedMap {
  const viewed: ViewedMap = {};
  for (const [cardId, entry] of Object.entries(progress)) {
    if (!validIds.has(cardId) || !entry?.isViewed) continue;
    viewed[cardId] = typeof entry.viewedAt === 'string' && entry.viewedAt ? entry.viewedAt : new Date().toISOString();
  }
  return viewed;
}

export function viewedToProgress(viewed: ViewedMap): ProgressLike {
  const progress: ProgressLike = {};
  for (const [cardId, viewedAt] of Object.entries(viewed)) {
    progress[cardId] = { cardId, isViewed: true, viewedAt };
  }
  return progress;
}

// union ของสองฝั่ง ถ้าใบเดียวกันมีทั้งคู่ เก็บเวลาที่ดูครั้งแรก (เก่ากว่า) — ผลลัพธ์ไม่มีวันลดลง
export function mergeViewed(a: ViewedMap, b: ViewedMap): ViewedMap {
  const out: ViewedMap = { ...a };
  for (const [cardId, time] of Object.entries(b)) {
    const existing = out[cardId];
    if (existing === undefined) {
      out[cardId] = time;
    } else {
      const ta = Date.parse(existing);
      const tb = Date.parse(time);
      if (!Number.isNaN(tb) && (Number.isNaN(ta) || tb < ta)) out[cardId] = time;
    }
  }
  return out;
}

export type CloudUser = { viewed: ViewedMap; favorites: string[] };

// ข้อมูลจากคลาวด์ถือเป็นข้อมูลไม่น่าเชื่อถือ: ตัด key/id ที่ไม่ใช่ไพ่จริง ค่าที่ไม่ใช่สตริง และรายการซ้ำ
export function sanitizeCloudUser(data: unknown, validIds: ReadonlySet<string>): CloudUser {
  const record = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const viewed: ViewedMap = {};
  if (record.viewed && typeof record.viewed === 'object' && !Array.isArray(record.viewed)) {
    for (const [cardId, time] of Object.entries(record.viewed as Record<string, unknown>)) {
      if (validIds.has(cardId) && typeof time === 'string') viewed[cardId] = time;
    }
  }
  const favorites: string[] = [];
  if (Array.isArray(record.favorites)) {
    for (const id of record.favorites) {
      if (typeof id === 'string' && validIds.has(id) && !favorites.includes(id)) favorites.push(id);
    }
  }
  return { viewed, favorites: favorites.slice(0, MAX_FAVORITES) };
}

export type FavoritesPolicy = 'union' | 'local' | 'cloud';

// ซิงก์ครั้งแรกของ uid นี้ → union (ห้ามทับของคลาวด์ด้วยของที่น้อยกว่า)
// ซิงก์แล้วและมีการแก้ค้าง (dirty) → ใช้ของในเครื่อง (รวมการยกเลิกบันทึกที่ผู้ใช้ตั้งใจทำ)
// ซิงก์แล้วและไม่มีอะไรค้าง → ใช้ของคลาวด์
export function favoritesPolicy(firstSync: boolean, dirty: boolean): FavoritesPolicy {
  if (firstSync) return 'union';
  return dirty ? 'local' : 'cloud';
}

export function mergeFavorites(local: string[], cloud: string[], policy: FavoritesPolicy): string[] {
  if (policy === 'local') return local.slice(0, MAX_FAVORITES);
  if (policy === 'cloud') return cloud.slice(0, MAX_FAVORITES);
  const out = [...cloud];
  for (const id of local) if (!out.includes(id)) out.push(id);
  return out.slice(0, MAX_FAVORITES);
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

// ต้องเขียนขึ้นคลาวด์ไหม: ยังไม่มีเอกสาร / มีไพ่ที่ดูแล้วที่คลาวด์ยังไม่มี / favorites ต่างกัน
export function needsWrite(
  cloudExists: boolean,
  cloud: CloudUser,
  merged: { viewed: ViewedMap; favorites: string[] }
): boolean {
  if (!cloudExists) return true;
  if (Object.keys(merged.viewed).some((cardId) => !(cardId in cloud.viewed))) return true;
  return !sameSet(merged.favorites, cloud.favorites);
}

export type UserDocPayload = { viewed?: ViewedMap; favorites: string[] };

// ข้อมูลที่จะเขียน (ยังไม่ใส่ updatedAt/schemaVersion ซึ่งเติมตอนเขียนจริงใน cloud.ts)
// viewed ว่างและคลาวด์มีเอกสารอยู่แล้ว → ไม่ส่ง viewed เลย กัน SDK ตีความ {} ว่าแทนที่ทั้ง field
export function buildPayload(viewed: ViewedMap, favorites: string[], cloudExists: boolean): UserDocPayload {
  const payload: UserDocPayload = { favorites: favorites.slice(0, MAX_FAVORITES) };
  if (!(cloudExists && Object.keys(viewed).length === 0)) payload.viewed = viewed;
  return payload;
}

export type SyncMeta = { uid: string | null; dirty: boolean; syncedOnce: boolean };

export function parseSyncMeta(raw: string | null): SyncMeta {
  const empty: SyncMeta = { uid: null, dirty: false, syncedOnce: false };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Partial<SyncMeta> | null;
    if (!parsed || typeof parsed !== 'object') return empty;
    return {
      uid: typeof parsed.uid === 'string' ? parsed.uid : null,
      dirty: parsed.dirty === true,
      syncedOnce: parsed.syncedOnce === true,
    };
  } catch {
    return empty;
  }
}
