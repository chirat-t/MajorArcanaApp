import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollection } from '../context/CollectionContext';
import CardDetailScreen from '../screens/CardDetailScreen';
import CharacterDetailScreen from '../screens/CharacterDetailScreen';
import CollectionScreen from '../screens/CollectionScreen';
import HomeScreen from '../screens/HomeScreen';
import LoadingScreen from '../screens/LoadingScreen';
import PredictDrawScreen from '../screens/predict/PredictDrawScreen';
import PredictResultScreen from '../screens/predict/PredictResultScreen';
import PredictTopicScreen from '../screens/predict/PredictTopicScreen';
import { colors } from '../theme';
import type { PredictStackParamList, RootStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const PredictStack = createNativeStackNavigator<PredictStackParamList>();

// แท็บ "คำทำนาย" มี stack ของตัวเอง — เริ่มที่เลือกหัวข้อ แล้วไล่ไปจั่วไพ่/ดูผล
// โดย tab bar ยังอยู่ตลอด flow (ต่างจาก Loading/CardDetail ที่เปิดทับเต็มจอ)
function PredictNavigator() {
  return (
    <PredictStack.Navigator screenOptions={{ headerShown: false }}>
      <PredictStack.Screen name="PredictTopic" component={PredictTopicScreen} />
      <PredictStack.Screen name="PredictDraw" component={PredictDrawScreen} />
      <PredictStack.Screen name="PredictResult" component={PredictResultScreen} />
    </PredictStack.Navigator>
  );
}

const navigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.gold,
    background: colors.bgPhone,
    card: colors.bgCard,
    text: colors.parchment,
    border: colors.border,
    notification: colors.purple,
  },
};

function TabsNavigator() {
  const { unviewedCount } = useCollection();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // แต่ละหน้าจอมี Appbar ของตัวเอง
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.inkDim,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          height: 72 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 8 + insets.bottom,
        },
        // lineHeight เผื่อสระบน/ล่างของภาษาไทยไม่ให้ถูกตัด
        tabBarLabelStyle: { fontSize: 11, lineHeight: 16, height: 18 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'หน้าแรก',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Predict"
        component={PredictNavigator}
        options={{
          title: 'คำทำนาย',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="crystal-ball" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          title: 'คอลเลกชัน',
          // dot แจ้งเตือนเมื่อยังมีไพ่ที่ไม่เคยเปิด (ข้อ 5.4)
          tabBarBadge: unviewedCount > 0 ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.purple,
            minWidth: 10,
            maxHeight: 10,
            borderRadius: 5,
            transform: [{ translateX: -4 }],
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cards-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="CardDetail" component={CardDetailScreen} />
        <Stack.Screen name="CharacterDetail" component={CharacterDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
