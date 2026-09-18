import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors, fonts } from '../theme';

type Props = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  goldLabel?: boolean;
};

// แต่ละหัวข้อแยกเป็นกรอบของตัวเอง: ไอคอนวงกลมซ้าย, label เล็กด้านบน,
// ค่าด้านล่างในกรอบเดียวกัน (PROJECT_BRIEF.md ข้อ 5.3)
// goldLabel=true ใช้กับหัวข้อที่อยากให้ label เด่นด้วยสีทอง (เช่น "ความหมาย"/
// "ความหมายกลับหัว") ส่วนกรอบ/ไอคอนยังเหมือนแถวอื่นทุกอย่าง ไม่ทำให้เด่นเกินไป
export default function InfoRow({ icon, label, value, goldLabel = false }: Props) {
  return (
    <View style={styles.frame}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.gold} />
      </View>
      <View style={styles.texts}>
        <Text style={[styles.label, goldLabel && styles.labelGold]}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard2,
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  texts: { flex: 1, gap: 4 },
  label: {
    color: colors.inkDim,
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelGold: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
  },
  value: { color: colors.parchment, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
});
