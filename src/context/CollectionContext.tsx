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

import cards from '../data/cards';
import { TarotCard, UserCardProgress } from '../types';

const PROGRESS_KEY = '@major-arcana/progress';
const FAVORITES_KEY = '@major-arcana/favorites';

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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rawProgress, rawFavorites] = await AsyncStorage.multiGet([
          PROGRESS_KEY,
          FAVORITES_KEY,
        ]);
        if (!active) return;
        setProgress(parseProgress(rawProgress[1]));
        setFavorites(parseFavorites(rawFavorites[1]));
      } catch {
        // อ่านไม่ได้ก็เริ่มจากค่าว่าง ดีกว่าแอปเปิดไม่ขึ้น
      } finally {
        if (active) {
          hydrated.current = true;
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch(() => {});
  }, [favorites]);

  const markViewed = useCallback((cardId: string) => {
    setProgress((prev) => {
      if (prev[cardId]?.isViewed) return prev;
      return {
        ...prev,
        [cardId]: { cardId, isViewed: true, viewedAt: new Date().toISOString() },
      };
    });
  }, []);

  const toggleFavorite = useCallback((cardId: string) => {
    setFavorites((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  }, []);

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
