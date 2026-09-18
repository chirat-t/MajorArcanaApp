import { useEffect, useMemo } from 'react';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Appbar, Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardImages } from '../../assets/cardImages';
import { composeInterpretation } from '../../data/interpretationTemplates';
import topics from '../../data/topics';
import { useCollection } from '../../context/CollectionContext';
import { colors, fonts } from '../../theme';
import type { PredictStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PredictStackParamList, 'PredictResult'>;

// ใช้พิกเซลตรง ๆ แทน width:'100%' + aspectRatio — react-native-web คำนวณความสูง
// ของ Image ผิดพลาดเมื่อพึ่ง aspectRatio ร่วมกับ width แบบเปอร์เซ็นต์ (ปัญหาเดียวกับ
// ที่ CardBack.tsx เจอมาก่อน)
const ART_WIDTH = 84;
const ART_HEIGHT = ART_WIDTH * 1.5;

type ResultRow = {
  positionId: string;
  positionLabel: string;
  cardId: string;
  cardThaiName: string;
  cardName: string;
  reversed: boolean;
  body: string;
  quote: string;
};

// เปิดไพ่ + แสดงคำตีความต่อตำแหน่ง เป็นหน้าเดียวที่เลื่อนดูได้ต่อเนื่อง (ไม่แยกหน้า
// สำหรับ "เปิดไพ่" กับ "คำตีความ" — ทั้งสองส่วนอยู่ในผลลัพธ์ชุดเดียวกัน)
export default function PredictResultScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { topicId, drawnCards } = route.params;
  const topic = topics.find((t) => t.id === topicId)!;
  const { getCardById, markViewed } = useCollection();

  const rows: ResultRow[] = useMemo(
    () =>
      drawnCards.map((drawn) => {
        const card = getCardById(drawn.cardId)!;
        const position = topic.spread.positions.find((p) => p.id === drawn.positionId)!;
        const { body, quote } = composeInterpretation(card, drawn.reversed, topicId, position.label);
        return {
          positionId: position.id,
          positionLabel: position.label,
          cardId: card.id,
          cardThaiName: card.thaiName,
          cardName: card.name,
          reversed: drawn.reversed,
          body,
          quote,
        };
      }),
    // จงใจคำนวณครั้งเดียวตอน mount — ไม่อยากให้คำตีความเปลี่ยนใหม่ทุกครั้งที่ re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // เปิดไพ่แล้วนับเป็น "เคยดู" เหมือนกับตอนเปิดผ่าน CardDetailScreen — กัน badge/
  // progress ใน Collection ไม่ตรงกับที่ผู้ใช้เห็นจริง
  useEffect(() => {
    drawnCards.forEach((drawn) => markViewed(drawn.cardId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToNewReading = () => navigation.popToTop();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} statusBarHeight={insets.top}>
        <Appbar.BackAction color={colors.gold} onPress={goToNewReading} />
        <Appbar.Content title={topic.label} titleStyle={styles.appTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>ไพ่ {drawnCards.length} ใบของคุณ</Text>

        <View style={styles.panels}>
          {rows.map((row) => (
            <View key={row.positionId} style={styles.panel}>
              <View style={styles.panelHeader}>
                <ImageBackground
                  source={cardImages[row.cardId]}
                  style={styles.art}
                  imageStyle={[styles.artImage, row.reversed && styles.artImageReversed]}
                  resizeMode="cover"
                />
                <View style={styles.panelHeaderText}>
                  <Text style={styles.panelPosition}>{row.positionLabel}</Text>
                  <Text style={styles.panelCardName}>
                    {row.cardThaiName} · {row.cardName}
                  </Text>
                  <View
                    style={[styles.orientationPill, row.reversed && styles.orientationPillReversed]}
                  >
                    <Text
                      style={[
                        styles.orientationText,
                        row.reversed ? styles.orientationTextReversed : styles.orientationTextUpright,
                      ]}
                    >
                      {row.reversed ? 'กลับหัว' : 'หงาย'}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.panelBody}>{row.body}</Text>
              <Text style={styles.panelQuote}>“{row.quote}”</Text>
            </View>
          ))}
        </View>

        {topicId === 'daily' ? (
          // "โชคของวันนี้" ตั้งใจให้เป็นไพ่ใบเดิมตลอดวัน (ข้อ 1) — ไม่มีปุ่มดูดวงใหม่
          // เพื่อไม่ให้ผู้ใช้กดแล้วสับสนว่าทำไมได้ไพ่ใบเดิมซ้ำ
          <Text style={styles.dailyNote}>
            ไพ่ใบนี้จะเป็นโชคของคุณตลอดทั้งวันนี้ พรุ่งนี้ค่อยกลับมาเปิดใหม่
          </Text>
        ) : (
          <Button
            mode="contained"
            buttonColor={colors.gold}
            textColor={colors.bgPage}
            style={styles.restartButton}
            onPress={goToNewReading}
          >
            ดูดวงใหม่
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPhone },
  appbar: { backgroundColor: colors.bgCard },
  appTitle: { color: colors.parchment, fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: 0.5 },
  content: { padding: 20, paddingBottom: 32, gap: 20 },
  heading: {
    color: colors.parchment,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    textAlign: 'center',
  },
  panels: { gap: 12 },
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    padding: 16,
    gap: 12,
  },
  // แถวบนของกล่อง: รูปไพ่แนวตั้งอยู่ซ้าย + ตำแหน่ง/ชื่อไพ่/สถานะหงาย-กลับหัวอยู่ขวา
  // รวมเป็นกล่องเดียวกับย่อหน้าคำตีความด้านล่าง (ไม่แยกเป็นแถบรูปคนละส่วนอีกต่อไป)
  panelHeader: { flexDirection: 'row', gap: 12 },
  art: {
    width: ART_WIDTH,
    height: ART_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.bgCard2,
  },
  artImage: { borderRadius: 10 },
  artImageReversed: { transform: [{ rotate: '180deg' }] },
  panelHeaderText: { flex: 1, gap: 4, justifyContent: 'center' },
  panelPosition: {
    color: colors.gold,
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  panelCardName: { color: colors.parchment, fontFamily: fonts.bodyMedium, fontSize: 17 },
  orientationPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.gold,
  },
  orientationPillReversed: { backgroundColor: colors.purple },
  orientationText: { fontFamily: fonts.bodyMedium, fontSize: 10 },
  orientationTextUpright: { color: colors.bgPage },
  orientationTextReversed: { color: colors.parchment },
  panelBody: { color: colors.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 22 },
  panelQuote: { color: colors.goldDim, fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  restartButton: { borderRadius: 24, marginTop: 4 },
  dailyNote: {
    color: colors.inkDim,
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
});
