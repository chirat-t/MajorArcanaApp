import { useEffect } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Text } from 'react-native-paper';

import { loadingBackgroundImage } from '../assets/backgroundImages';
import CardBack from '../components/CardBack';
import { colors, fonts } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const SHUFFLE_MS = 1200;
const CARD_WIDTH = 150; // ~150x220 ตาม PROJECT_BRIEF.md ข้อ 5.2

type Props = NativeStackScreenProps<RootStackParamList, 'Loading'>;

// จำลองการสับไพ่ ~1 วินาที ก่อนเปิดผล (ข้อ 5.2)
export default function LoadingScreen({ navigation, route }: Props) {
  const { cardId } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => {
      // replace เพื่อให้ปุ่มย้อนกลับจาก CardDetail ไม่ย้อนมาหน้าสับไพ่อีก
      navigation.replace('CardDetail', { cardId });
    }, SHUFFLE_MS);
    return () => clearTimeout(timer);
  }, [navigation, cardId]);

  return (
    <ImageBackground source={loadingBackgroundImage} resizeMode="cover" style={styles.container}>
      {/* ลงเงาทับภาพพื้นหลังเบา ๆ ให้ไพ่ตรงกลางเด่นขึ้น ไม่จมไปกับพื้นหลัง */}
      <View style={styles.scrim} />

      <View style={styles.cardWrap}>
        {/* แสงเรืองสีทองฟุ้งจาง ๆ นิ่ง ๆ อยู่ข้างหลัง CardBack — ไม่มี spread radius
            (ใช้ blur อย่างเดียว) กันไม่ให้เกิดเส้นขอบคมรอบนอก และไม่มี animation ใด ๆ */}
        <View style={styles.cardGlow} pointerEvents="none" />
        <CardBack width={CARD_WIDTH}>
          <ActivityIndicator animating size="large" color={colors.gold} />
        </CardBack>
      </View>

      <View style={styles.texts}>
        <Text style={styles.title}>กำลังสับไพ่...</Text>
        <Text style={styles.subtitle}>ตั้งคำถามในใจ แล้วปล่อยให้ไพ่เลือกคุณ</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // backgroundColor เป็น fallback สีทึบระหว่างรอโหลดภาพพื้นหลัง/ถ้าโหลดไม่สำเร็จ
  container: {
    flex: 1,
    backgroundColor: colors.bgPhone,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    padding: 24,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 17, 32, 0.5)',
    // vignette: เพิ่มความมืดเฉพาะขอบจอ (inset shadow) ให้สายตาถูกดึงเข้ากลางจอมากขึ้น
    boxShadow: 'inset 0 0 160px 50px rgba(0, 0, 0, 0.55)',
  },
  cardWrap: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    // ไม่มี spread radius (ค่าที่ 4) เลย ใช้ blur อย่างเดียวให้ไล่เนียนจางไปกับ
    // พื้นหลัง ไม่ตัดเป็นเส้นขอบคม
    boxShadow: '0 0 45px 14px rgba(201,162,75,0.7)',
  },
  texts: { alignItems: 'center', gap: 8 },
  title: { color: colors.parchment, fontFamily: fonts.bodyMedium, fontSize: 18, letterSpacing: 1 },
  subtitle: { color: colors.inkDim, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
});
