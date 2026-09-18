import { StyleSheet } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import CardBack from './CardBack';
import { colors } from '../theme';
import { TarotCard } from '../types';

type Props = {
  card: TarotCard;
  onPress: (card: TarotCard) => void;
};

// ไพ่ปิดหน้าในกริดหน้า Home — แสดงเฉพาะเลขโรมัน (PROJECT_BRIEF.md ข้อ 5.1)
export default function CardGridItem({ card, onPress }: Props) {
  return (
    <TouchableRipple
      style={styles.touchable}
      borderless
      rippleColor={`${colors.gold}33`}
      onPress={() => onPress(card)}
      accessibilityRole="button"
      accessibilityLabel={`ไพ่ใบที่ ${card.numeral}`}
    >
      <CardBack numeral={card.numeral} />
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    borderRadius: 10,
  },
});
