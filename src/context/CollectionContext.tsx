import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { AppState } from 'react-native';

import cards from '../data/cards';
import {
  buildPayload,
  favoritesPolicy,
  hasCloudConfig,
  mergeFavorites,
  mergeViewed,
  needsWrite,
  parseSyncMeta,
  progressToViewed,
  sanitizeCloudUser,
  viewedToProgress,
  type CloudUser,
  type ProgressLike,
  type SyncMeta,
} from '../services/syncMerge';
import { TarotCard, UserCardProgress } from '../types';

const PROGRESS_KEY = '@major-arcana/progress';
const FAVORITES_KEY = '@major-arcana/favorites';
const SYNC_KEY = '@major-arcana/sync';

// ซิงก์กับ Firestore: AsyncStorage ยังเป็นแคช/ที่เก็บหลักที่แอปอ่านเขียนทันที ส่วนคลาวด์เป็นชั้นเสริม
// ถ้าไม่มี config หรือเชื่อมต่อไม่ได้ ทุกอย่างทำงานเหมือนไม่มีคลาวด์
const DEBOUNCE_MS = 1500; // รอให้หยุดเปลี่ยนข้อมูลก่อนเขียน Firestore ครั้งเดียว
const WRITE_TIMEOUT_MS = 10000; // ออฟไลน์แล้ว setDoc อาจค้างไม่จบ ถือว่ายังไม่สำเร็จ
const RETRY_MS = 15000; // เว้นระยะอย่างน้อยเท่านี้ก่อนลองเชื่อมต่อใหม่เมื่อครั้งก่อนล้มเหลว
const VALID_CARD_IDS: ReadonlySet<string> = new Set(cards.map((card) => card.id));

// โหลด cloud.ts (และ Firebase ทั้งก้อน) แบบ dynamic import เฉพาะเมื่อมี config ครบ เพื่อให้ bundle
// หลักไม่หนักขึ้น — ถ้าโหลดไม่ได้ ล้าง cache เพื่อให้ลองใหม่ได้
type CloudModule = typeof import('../services/cloud');
let cloudModulePromise: Promise<CloudModule> | null = null;
function loadCloud(): Promise<CloudModule> {
  if (!cloudModulePromise) {
    cloudModulePromise = import('../services/cloud').catch((error: unknown) => {
      cloudModulePromise = null;
      throw error;
    });
  }
  return cloudModulePromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

type SyncState = {
  meta: SyncMeta; // เก็บใน AsyncStorage: uid ที่ซิงก์ล่าสุด, มีการแก้ค้าง, เคยซิงก์สำเร็จแล้วหรือยัง
  ready: boolean; // อ่านเอกสารจากคลาวด์สำเร็จแล้วใน session นี้ (ก่อนหน้านี้ห้ามเขียนขึ้นคลาวด์)
  starting: boolean;
  flushing: boolean;
  active: boolean;
  version: number; // เพิ่มทุกครั้งที่ผู้ใช้แก้ข้อมูล ใช้ดูว่ามีการแก้ระหว่างเขียนอยู่หรือไม่
  timer: ReturnType<typeof setTimeout> | null;
  lastAttempt: number;
  cloudExists: boolean;
  cloud: CloudUser;
};

type ProgressMap = Record<string, UserCardProgress>;

// สถานะผู้ใช้ (UserCardProgress) เก็บแยกจากข้อมูลไพ่แบบ static ตาม PROJECT_BRIEF.md ข้อ 10
type CollectionContextValue = {
  cards: TarotCard[];
  isLoading: boolean;
  progress: ProgressMap;
  viewedCount: number;
  unviewedCount: number;
  totalCount: number;
  isViewed: (cardId: string) => boolean;
  markViewed: (cardId: string) => void;
  isFavorite: (cardId: string) => boolean;
  toggleFavorite: (cardId: string) => void;
  getCardById: (cardId: string) => TarotCard | undefined;
  getRandomCard: (excludeId?: string) => TarotCard;
};

const CollectionContext = createContext<CollectionContextValue | undefined>(undefined);

// AsyncStorage เก็บได้เฉพาะ string — กันข้อมูลเก่า/เสียไม่ให้ทำแอปพัง
function parseProgress(raw: string | null): ProgressMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as ProgressMap;
  } catch {
    return {};
  }
}

function parseFavorites(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  // กันไม่ให้ค่าเริ่มต้นตอนโหลดยังไม่เสร็จ ไปทับข้อมูลที่เก็บไว้
  const hydrated = useRef(false);

  // ค่าล่าสุดของ state สำหรับฟังก์ชันซิงก์ที่ทำงานนอก render (อัปเดตทุกครั้งที่ render)
  const latest = useRef({ progress, favorites });
  latest.current = { progress, favorites };

  const sync = useRef<SyncState>({
    meta: { uid: null, dirty: false, syncedOnce: false },
    ready: false,
    starting: false,
    flushing: false,
    active: true,
    version: 0,
    timer: null,
    lastAttempt: 0,
    cloudExists: false,
    cloud: { viewed: {}, favorites: [] },
  });
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const persistMeta = useCallback(() => {
    AsyncStorage.setItem(SYNC_KEY, JSON.stringify(sync.current.meta)).catch(() => {});
  }, []);

  // รอ DEBOUNCE_MS หลังการแก้ครั้งสุดท้าย แล้วเขียนขึ้นคลาวด์ครั้งเดียว
  const schedule = useCallback(() => {
    const s = sync.current;
    if (s.timer) clearTimeout(s.timer);
    s.timer = setTimeout(() => {
      s.timer = null;
      void flushRef.current();
    }, DEBOUNCE_MS);
  }, []);

  // เขียนทันทีโดยไม่รอ debounce — ใช้ตอนแอปไปอยู่เบื้องหลัง/แท็บถูกซ่อน
  const flushNow = useCallback(() => {
    const s = sync.current;
    if (s.timer) {
      clearTimeout(s.timer);
      s.timer = null;
    }
    void flushRef.current();
  }, []);

  // เขียน viewed/favorites ปัจจุบันขึ้น users/{uid} ด้วย merge ล้มเหลวก็เก็บ dirty ไว้ลองใหม่ภายหลัง
  // (ไม่วนลองซ้ำเอง กันยิงรัวเมื่อถูก rules ปฏิเสธ)
  flushRef.current = async () => {
    const s = sync.current;
    const uid = s.meta.uid;
    if (!s.ready || s.flushing || !s.meta.dirty || !uid) return;
    s.flushing = true;
    const startVersion = s.version;
    const viewed = progressToViewed(latest.current.progress as ProgressLike, VALID_CARD_IDS);
    const favorites = latest.current.favorites.filter((id) => VALID_CARD_IDS.has(id));
    try {
      const cloud = await loadCloud();
      await withTimeout(
        cloud.writeUserDoc(uid, buildPayload(viewed, favorites, s.cloudExists)),
        WRITE_TIMEOUT_MS
      );
      s.cloudExists = true;
      s.cloud = { viewed: mergeViewed(s.cloud.viewed, viewed), favorites };
      s.meta = { ...s.meta, syncedOnce: true, dirty: s.version === startVersion ? false : s.meta.dirty };
      persistMeta();
    } catch {
      // ออฟไลน์/ถูกปฏิเสธ/หมดเวลา: แอปใช้ข้อมูลในเครื่องต่อได้ตามปกติ
    } finally {
      s.flushing = false;
    }
    // ถ้าผู้ใช้แก้ข้อมูลระหว่างเขียน ให้เขียนรอบใหม่ (เฉพาะเมื่อรอบนี้สำเร็จ)
    if (s.meta.dirty && s.version !== startVersion && s.cloudExists && s.active) schedule();
  };

  // เริ่มซิงก์: ล็อกอิน Anonymous → อ่านเอกสารครั้งเดียว → รวมข้อมูล → เขียนกลับถ้าคลาวด์ยังขาด
  // ทุกขั้นที่ล้มเหลวถูกกลืนเงียบ ๆ และแอปทำงานแบบออฟไลน์ต่อ
  const startSync = useCallback(async () => {
    const s = sync.current;
    if (s.ready || s.starting || !hasCloudConfig()) return;
    s.starting = true;
    s.lastAttempt = Date.now();
    try {
      const cloud = await loadCloud();
      const user = await cloud.ensureSignedIn();
      if (!user || !s.active) return;
      const raw = await cloud.fetchUserDoc(user.uid);
      if (!s.active) return;

      const exists = raw !== null;
      const remote = sanitizeCloudUser(raw, VALID_CARD_IDS);
      const firstSync = s.meta.uid !== user.uid || !s.meta.syncedOnce;
      const localViewed = progressToViewed(latest.current.progress as ProgressLike, VALID_CARD_IDS);
      const viewed = mergeViewed(remote.viewed, localViewed);
      const favorites = mergeFavorites(
        latest.current.favorites,
        remote.favorites,
        favoritesPolicy(firstSync, s.meta.dirty)
      );

      setProgress((prev) => ({ ...prev, ...(viewedToProgress(viewed) as ProgressMap) }));
      setFavorites((prev) =>
        prev.length === favorites.length && prev.every((id, i) => id === favorites[i]) ? prev : favorites
      );

      s.ready = true;
      s.cloudExists = exists;
      s.cloud = remote;
      s.meta = { ...s.meta, uid: user.uid };
      if (needsWrite(exists, remote, { viewed, favorites })) {
        s.meta = { ...s.meta, dirty: true };
        s.version += 1;
        persistMeta();
        schedule();
      } else {
        s.meta = { ...s.meta, dirty: false, syncedOnce: true };
        persistMeta();
      }
    } catch {
      // ล็อกอินไม่ได้/ออฟไลน์/โหลดโมดูลไม่ได้: ใช้โหมดออฟไลน์เงียบ ๆ ลองใหม่เมื่อมีการแก้ข้อมูลครั้งถัดไป
    } finally {
      s.starting = false;
    }
  }, [persistMeta, schedule]);

  // เรียกทุกครั้งที่ผู้ใช้แก้ข้อมูลจริง (ไม่เรียกตอนโหลดค่าจากเครื่อง/คลาวด์เข้า state)
  const noteChange = useCallback(() => {
    if (!hasCloudConfig()) return;
    const s = sync.current;
    s.version += 1;
    if (!s.meta.dirty) {
      s.meta = { ...s.meta, dirty: true };
      persistMeta();
    }
    if (s.ready) schedule();
    else if (Date.now() - s.lastAttempt > RETRY_MS) void startSync();
  }, [persistMeta, schedule, startSync]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rawProgress, rawFavorites, rawSync] = await AsyncStorage.multiGet([
          PROGRESS_KEY,
          FAVORITES_KEY,
          SYNC_KEY,
        ]);
        if (!active) return;
        setProgress(parseProgress(rawProgress[1]));
        setFavorites(parseFavorites(rawFavorites[1]));
        sync.current.meta = parseSyncMeta(rawSync[1]);
      } catch {
        // อ่านไม่ได้ก็เริ่มจากค่าว่าง ดีกว่าแอปเปิดไม่ขึ้น
      } finally {
        if (active) {
          hydrated.current = true;
          setIsLoading(false);
          // ซิงก์ทำเบื้องหลังหลังหน้าจอพร้อมแล้ว ไม่รอ ไม่บล็อก UI
          void startSync();
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [startSync]);

  // แอปไปอยู่เบื้องหลัง/แท็บถูกซ่อน → เขียนค้างทันที (web ใช้ visibilitychange ผ่าน AppState)
  useEffect(() => {
    const s = sync.current;
    s.active = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flushNow();
    });
    return () => {
      subscription.remove();
      s.active = false;
      if (s.timer) clearTimeout(s.timer);
    };
  }, [flushNow]);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch(() => {});
  }, [favorites]);

  const markViewed = useCallback(
    (cardId: string) => {
      if (latest.current.progress[cardId]?.isViewed) return; // ดูแล้ว ไม่ต้องทำอะไร (ไม่เขียนคลาวด์ซ้ำ)
      setProgress((prev) => {
        if (prev[cardId]?.isViewed) return prev;
        return {
          ...prev,
          [cardId]: { cardId, isViewed: true, viewedAt: new Date().toISOString() },
        };
      });
      noteChange();
    },
    [noteChange]
  );

  const toggleFavorite = useCallback(
    (cardId: string) => {
      setFavorites((prev) =>
        prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
      );
      noteChange();
    },
    [noteChange]
  );

  const isViewed = useCallback((cardId: string) => Boolean(progress[cardId]?.isViewed), [progress]);
  const isFavorite = useCallback((cardId: string) => favorites.includes(cardId), [favorites]);

  const getCardById = useCallback((cardId: string) => cards.find((card) => card.id === cardId), []);

  // สุ่มไพ่ใบใหม่ โดยไม่ให้ซ้ำกับใบที่กำลังดูอยู่
  const getRandomCard = useCallback((excludeId?: string) => {
    const pool = excludeId ? cards.filter((card) => card.id !== excludeId) : cards;
    return pool[Math.floor(Math.random() * pool.length)] ?? cards[0];
  }, []);

  const viewedCount = useMemo(
    () => Object.values(progress).filter((p) => p.isViewed).length,
    [progress]
  );

  const value = useMemo<CollectionContextValue>(
    () => ({
      cards,
      isLoading,
      progress,
      viewedCount,
      unviewedCount: cards.length - viewedCount,
      totalCount: cards.length,
      isViewed,
      markViewed,
      isFavorite,
      toggleFavorite,
      getCardById,
      getRandomCard,
    }),
    [
      isLoading,
      progress,
      viewedCount,
      isViewed,
      markViewed,
      isFavorite,
      toggleFavorite,
      getCardById,
      getRandomCard,
    ]
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection ต้องใช้ภายใน <CollectionProvider>');
  }
  return context;
}
