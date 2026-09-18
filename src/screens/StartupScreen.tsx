import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { coverImage } from '../assets/backgroundImages';
import { colors } from '../theme';

// หน้าปกก่อนเข้าแอป (cover.jpg) — แสดงระหว่างโหลดฟอนต์/แอสเซต เหมือนหน้าโหลดก่อนเข้าเกม
// คนละหน้ากับ LoadingScreen ซึ่งเป็นจังหวะสับไพ่ระหว่างเปิดไพ่แต่ละใบ

// ขนาดจริงของ cover.jpg เป็นพิกเซล — ใช้ตัวเลขพิกเซลตรง ๆ แทน width:'100%' +
// aspectRatio เพราะ react-native-web คำนวณความสูงของ Image ผิดพลาดเมื่อพึ่ง
// aspectRatio ร่วมกับ width แบบเปอร์เซ็นต์ (จะได้ความสูงเท่าพิกเซลต้นฉบับ เช่น
// 1376px ตรง ๆ แทนที่จะย่อตามอัตราส่วน — ปัญหาเดียวกับที่เคยเจอในโปรเจกต์นี้มาก่อน)
// คำนวณแบบ "contain" ด้วยมือ: ให้พอดีจอโดยไม่ครอปภาพ ไม่ว่าจอจะสัดส่วนไหน
const COVER_SOURCE_WIDTH = 768;
const COVER_SOURCE_HEIGHT = 1376;
const COVER_RATIO = COVER_SOURCE_WIDTH / COVER_SOURCE_HEIGHT;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const WIDTH_FIT_HEIGHT = SCREEN_WIDTH / COVER_RATIO;
const FITS_BY_WIDTH = WIDTH_FIT_HEIGHT <= SCREEN_HEIGHT;
const COVER_WIDTH = FITS_BY_WIDTH ? SCREEN_WIDTH : SCREEN_HEIGHT * COVER_RATIO;
const COVER_HEIGHT = FITS_BY_WIDTH ? WIDTH_FIT_HEIGHT : SCREEN_HEIGHT;

export default function StartupScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={coverImage}
        resizeMode="contain"
        style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
      />
      {/* วางแยกต่างหากใต้รูป ไม่ทับซ้อนบนภาพ กันไม่ให้บังข้อความคำโปรยที่วาด
          ไว้ในภาพเอง (เช่น "ไม่ว่าจะเป็นเส้นทางไหน พวกเราจะไปด้วยกัน") */}
      <View style={styles.loadingRow}>
        <ActivityIndicator animating size="small" color={colors.gold} />
        <Text style={styles.label}>กำลังโหลด...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPhone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  label: { color: colors.parchment, fontSize: 13, letterSpacing: 1 },
});
