import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Cinzel_400Regular,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import {
  NotoSansThai_400Regular,
  NotoSansThai_500Medium,
  NotoSansThai_700Bold,
} from '@expo-google-fonts/noto-sans-thai';

import { CollectionProvider } from './src/context/CollectionContext';
import AppNavigator from './src/navigation/AppNavigator';
import StartupScreen from './src/screens/StartupScreen';
import { colors, paperTheme } from './src/theme';

// splash ของระบบอยู่แค่ช่วงสั้น ๆ ก่อน root view วาดเสร็จ จากนั้นส่งต่อให้
// StartupScreen (หน้าปก cover.jpg) แสดงต่อจนกว่าฟอนต์จะโหลดเสร็จ
SplashScreen.preventAutoHideAsync().catch(() => {});

// หน้าปกต้องอยู่นานพอให้ผู้ใช้เห็น ไม่วาบหายทันทีเมื่อฟอนต์โหลดเสร็จเร็ว
const MIN_COVER_MS = 2600;

export default function App() {
  // key ต้องตรงกับที่ src/theme.ts อ้างอิงไว้ใน `fonts` object ทุกตัวอักษร
  const [fontsLoaded, fontError] = useFonts({
    'Cinzel-Regular': Cinzel_400Regular,
    'Cinzel-SemiBold': Cinzel_600SemiBold,
    'Cinzel-Bold': Cinzel_700Bold,
    'NotoSansThai-Regular': NotoSansThai_400Regular,
    'NotoSansThai-Medium': NotoSansThai_500Medium,
    'NotoSansThai-Bold': NotoSansThai_700Bold,
  });

  const [minCoverPassed, setMinCoverPassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinCoverPassed(true), MIN_COVER_MS);
    return () => clearTimeout(timer);
  }, []);

  // โหลดฟอนต์ไม่สำเร็จ (เช่น ออฟไลน์ตอนเปิดครั้งแรก) ก็เข้าแอปต่อด้วยฟอนต์
  // default ของระบบ ดีกว่าค้างที่หน้าปก
  const ready = (fontsLoaded || Boolean(fontError)) && minCoverPassed;

  const onRootLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPhone }} onLayout={onRootLayout}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          {/* Provider อยู่นอกเงื่อนไขเพื่อให้อ่าน AsyncStorage คู่ขนานไปกับหน้าปก */}
          <CollectionProvider>{ready ? <AppNavigator /> : <StartupScreen />}</CollectionProvider>
          <StatusBar style="light" />
        </PaperProvider>
      </SafeAreaProvider>
    </View>
  );
}
