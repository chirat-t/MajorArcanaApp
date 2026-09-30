import { ImageBackground, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import { cardBackImage } from '../assets/cardImages';
import { colors, fonts } from '../theme';

type Props = {
  numeral?: string;
  width?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

// ลายหลังไพ่จริง (ธีมดวงจันทร์-ดวงอาทิตย์-ดาว) — ใช้ทั้งในกริดหน้า Home,
// การ์ดที่ยังไม่เคยเปิดใน Collection และหน้า Loading (สับไพ่)
export default function CardBack({ numeral, width, style, children }: Props) {
  return (
    <ImageBackground
      source={cardBackImage}
      resizeMode="cover"
      imageStyle={[styles.image, Platform.OS === 'web' && !width && styles.imageWebFill]}
      style={[styles.cardBack, width ? { width, aspectRatio: undefined, height: width * 1.5 } : null, style]}
    >
      {children ? (
        // เช่น ActivityIndicator ตอนสับไพ่ — มีพื้นหลังวงกลมทึบรองไว้
        // ให้อ่านง่ายไม่ว่าลวดลายด้านหลังจะเป็นสีอะไร
        <View style={styles.centerBackdrop}>{children}</View>
      ) : null}
      {numeral ? (
        <View style={styles.numeralPill}>
          <Text style={styles.numeral}>{numeral}</Text>
        </View>
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  cardBack: {
    aspectRatio: 2 / 3,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.goldDim,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 10,
  },
  // react-native-web: ImageBackground ส่งเฉพาะ width/height จาก style ลงไปที่รูปด้านใน
  // ถ้าไม่ได้ส่ง width มา (กริด Home/Collection ใช้ aspectRatio) รูปจะใช้ขนาดไฟล์จริง
  // 1024x1536 แล้วล้นกรอบจนเห็นแค่มุมซ้ายบน — บังคับให้เต็มกรอบเฉพาะบนเว็บและเฉพาะตอนไม่มี
  // width (หน้าที่ส่ง width อยู่แล้ว เช่น Draw/Loading/Topic แสดงผลถูกต้อง จึงไม่แตะ) native ไม่เปลี่ยน
  imageWebFill: {
    width: '100%',
    height: '100%',
  },
  centerBackdrop: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 17, 32, 0.55)',
  },
  numeralPill: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 17, 32, 0.6)',
    borderWidth: 1,
    borderColor: `${colors.gold}66`,
  },
  numeral: {
    color: colors.gold,
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 2,
  },
});
