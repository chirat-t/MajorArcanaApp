import { useMemo, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Appbar, Button, Text, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CardBack from '../../components/CardBack';
import cards from '../../data/cards';
import topics from '../../data/topics';
import { createDailyRandom } from '../../utils/cardDraw';
import { pickRandomN } from '../../utils/random';
import { colors, fonts } from '../../theme';
import type { DrawnCard } from '../../types';
import type { PredictStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PredictStackParamList, 'PredictDraw'>;

const CARD_WIDTH = 90;
const DOT_COUNT = 18;

// ไพ่ทั้งกอง (ไม่ใช่แค่ตามจำนวนตำแหน่ง) สับเรียงเป็นแถวเดียวให้เลื่อนดูได้ — ผู้ใช้
// แตะใบไหนก่อนก็ได้จากทั้งกอง ลำดับที่ "แตะเลือก" (ไม่ใช่ตำแหน่งในแถว) เป็นตัวกำหนด
// ว่าไพ่ใบนั้นตกเป็นตำแหน่งไหนใน spread (เลือกก่อน = ตำแหน่งแรก ฯลฯ)
function useShuffledDeck(seedRandom: () => number) {
  return useMemo(() => {
    const shuffled = pickRandomN(cards, cards.length, seedRandom);
    return shuffled.map((card) => ({ cardId: card.id, reversed: seedRandom() < 0.5 }));
  }, [seedRandom]);
}

// แถบบอกตำแหน่งการเลื่อนภายในกองไพ่ทั้งหมด — ไม่แสดงถ้าเนื้อหาสั้นกว่าพื้นที่มองเห็น
// อยู่แล้ว (เลื่อนไม่ได้ก็ไม่ต้องมีแถบ)
function ScrollProgressBar({
  scrollX,
  viewportWidth,
  contentWidth,
}: {
  scrollX: number;
  viewportWidth: number;
  contentWidth: number;
}) {
  if (viewportWidth <= 0 || contentWidth <= viewportWidth) return null;

  const thumbWidthRatio = Math.min(1, viewportWidth / contentWidth);
  const maxScroll = contentWidth - viewportWidth;
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollX / maxScroll)) : 0;
  const thumbLeftRatio = progress * (1 - thumbWidthRatio);

  return (
    <View style={styles.trackWrap}>
      <View style={styles.dotsRow} pointerEvents="none">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>
      <View style={[styles.thumb, { left: `${thumbLeftRatio * 100}%`, width: `${thumbWidthRatio * 100}%` }]} />
    </View>
  );
}

// จั่วไพ่คว่ำหน้าจากกองทั้งหมด เลื่อนซ้าย-ขวาดูได้ แตะใบไหนก่อนก็ได้ไม่บังคับลำดับ —
// ยังไม่เปิดหน้าไพ่ที่นี่ (ข้อ Level 2: "เห็นแต่ด้านหลังไพ่และตำแหน่งของไพ่") การเปิดไพ่
// จริงเกิดที่ PredictResultScreen
export default function PredictDrawScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { topicId } = route.params;
  const topic = topics.find((t) => t.id === topicId)!;
  const spread = topic.spread;
  const slotWidth = spread.cardCount === 1 ? 90 : 64;

  const seedRandom = useMemo(
    () => (topicId === 'daily' ? createDailyRandom() : Math.random),
    [topicId]
  );
  const deck = useShuffledDeck(seedRandom);

  // ลำดับ index ในกองที่ถูกแตะเลือก — ตำแหน่งใน array นี้เอง (ไม่ใช่ index ในกอง) คือ
  // ตัวกำหนดว่าไพ่ใบนั้นไปอยู่ตำแหน่งไหนของ spread (แตะก่อน = spread.positions[0] ฯลฯ)
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const selectedSet = useMemo(() => new Set(selectedOrder), [selectedOrder]);
  const allSelected = selectedOrder.length >= spread.cardCount;
  const nextPosition = spread.positions[selectedOrder.length];

  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const handleSelect = (deckIndex: number) => {
    if (allSelected || selectedSet.has(deckIndex)) return;
    setSelectedOrder((prev) => [...prev, deckIndex]);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(e.nativeEvent.contentOffset.x);
  };

  const handleStart = () => {
    const drawnCards: DrawnCard[] = selectedOrder.map((deckIndex, i) => ({
      positionId: spread.positions[i].id,
      cardId: deck[deckIndex].cardId,
      reversed: deck[deckIndex].reversed,
    }));
    navigation.replace('PredictResult', { topicId, drawnCards });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} statusBarHeight={insets.top}>
        <Appbar.BackAction color={colors.gold} onPress={() => navigation.goBack()} />
        <Appbar.Content title={topic.label} titleStyle={styles.appTitle} />
      </Appbar.Header>

      <View style={styles.content}>
        {/* แถวช่องตำแหน่ง — ผูกกับลำดับตำแหน่งคงที่ของ spread เสมอ (ช่อง 0 = ตำแหน่ง
            แรกเสมอ) ไม่ใช่ผูกกับลำดับที่แตะเลือก ไพ่ที่เลือกจากกองด้านล่างจะไหลเข้า
            ช่องว่างซ้ายสุดที่เหลือตามลำดับที่แตะ (ตรงกับที่ selectedOrder[i] ผูกกับ
            spread.positions[i] อยู่แล้วตอนสร้าง drawnCards ด้านล่าง) — ยังคว่ำหน้าอยู่
            เหมือนเดิม ไม่เปิดไพ่ที่นี่ */}
        <View style={styles.slotsRow}>
          {spread.positions.map((position, i) => {
            const filled = i < selectedOrder.length;
            return (
              <View key={position.id} style={styles.slotItem}>
                {filled ? (
                  <CardBack width={slotWidth} />
                ) : (
                  <View style={[styles.slotPlaceholder, { width: slotWidth, height: slotWidth * 1.5 }]} />
                )}
                <Text style={styles.slotLabel} numberOfLines={2}>
                  {position.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.counter}>
          เลือกแล้ว {selectedOrder.length}/{spread.cardCount} ใบ
        </Text>
        <Text style={styles.hint}>
          {allSelected ? 'ไพ่ทุกใบพร้อมแล้ว' : `แตะไพ่เพื่อเลือกตำแหน่ง "${nextPosition.label}"`}
        </Text>

        <Text style={styles.swipeHint}>เลื่อนซ้าย-ขวา เพื่อดูไพ่ทั้งหมด</Text>

        <View style={styles.deckWrap} onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.deckRow}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(w) => setContentWidth(w)}
          >
            {deck.map((entry, i) => {
              const selected = selectedSet.has(i);
              return (
                <View key={`${entry.cardId}-${i}`} style={styles.deckItem}>
                  {selected ? (
                    <View style={styles.selectedWrap}>
                      <CardBack width={CARD_WIDTH} style={styles.cardSelected} />
                      <View style={styles.checkBadge}>
                        <MaterialCommunityIcons name="check-bold" size={13} color={colors.bgPage} />
                      </View>
                    </View>
                  ) : (
                    <TouchableRipple
                      borderless
                      style={styles.touchable}
                      rippleColor={`${colors.gold}33`}
                      onPress={() => handleSelect(i)}
                      accessibilityRole="button"
                      accessibilityLabel={`เลือกไพ่ใบที่ ${i + 1}`}
                    >
                      <CardBack width={CARD_WIDTH} />
                    </TouchableRipple>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <ScrollProgressBar scrollX={scrollX} viewportWidth={viewportWidth} contentWidth={contentWidth} />
        </View>
      </View>

      {allSelected ? (
        <View style={styles.footer}>
          <Button
            mode="contained"
            buttonColor={colors.gold}
            textColor={colors.bgPage}
            style={styles.cta}
            onPress={handleStart}
          >
            เริ่มเปิดไพ่
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPhone },
  appbar: { backgroundColor: colors.bgCard },
  appTitle: { color: colors.parchment, fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: 0.5 },
  content: { flex: 1, justifyContent: 'center', gap: 10, paddingVertical: 20 },
  counter: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    letterSpacing: 1,
    textAlign: 'center',
  },
  hint: { color: colors.inkDim, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
  slotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  slotItem: { alignItems: 'center', gap: 6, maxWidth: 110 },
  slotPlaceholder: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  slotLabel: { color: colors.parchment, fontFamily: fonts.body, fontSize: 12, textAlign: 'center' },
  swipeHint: {
    color: colors.inkDim,
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  deckWrap: { marginTop: 12 },
  deckRow: { paddingHorizontal: 20, gap: 14, alignItems: 'center' },
  deckItem: { alignItems: 'center' },
  touchable: { borderRadius: 10 },
  selectedWrap: { position: 'relative' },
  cardSelected: { borderColor: colors.gold, borderWidth: 2 },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.bgPhone,
  },
  trackWrap: {
    height: 14,
    marginTop: 14,
    marginHorizontal: 20,
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.border },
  thumb: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  cta: { borderRadius: 24 },
});
