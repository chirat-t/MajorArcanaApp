import { Dimensions, ImageBackground, StyleSheet, View } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';

import { cardImages } from '../assets/cardImages';
import { colors, fonts } from '../theme';
import { TarotCard } from '../types';

type Props = {
  card: TarotCard | null;
  onDismiss: () => void;
};

// ใช้ตัวเลขพิกเซลตรง ๆ แทน width:'100%' + aspectRatio -- react-native-web
// คำนวณความสูงของ Image ผิดพลาดเมื่อพึ่ง aspectRatio ร่วมกับ width แบบเปอร์เซ็นต์
// ในบริบท flex ที่ซ้อนกันหลายชั้นแบบนี้ (ตัวเลขตรงทำงานถูกต้องทุก platform)
const SCREEN_WIDTH = Dimensions.get('window').width;
const MODAL_PADDING = 28;
const FRAME_PADDING = 16;
const ART_WIDTH = Math.min(320, SCREEN_WIDTH - (MODAL_PADDING + FRAME_PADDING) * 2);
const ART_HEIGHT = ART_WIDTH * 1.5; // อัตราส่วนไพ่จริง 2:3

// ไพ่เต็มใบ: กรอบทอง เลขโรมันด้านบน ภาพไพ่จริงเต็มพื้นที่ แล้วแถบชื่อ+บทบาท
// อยู่ในกรอบเดียวกัน (PROJECT_BRIEF.md ข้อ 5.4)
export default function CardModal({ card, onDismiss }: Props) {
  return (
    <Portal>
      <Modal
        visible={card !== null}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        {card ? (
          <View style={styles.frame}>
            <Text style={styles.numeral}>{card.numeral}</Text>

            <ImageBackground
              source={cardImages[card.id]}
              style={[styles.art, { width: ART_WIDTH, height: ART_HEIGHT }]}
              imageStyle={styles.artImage}
              resizeMode="cover"
            />

            <View style={styles.caption}>
              <Text style={styles.name}>{card.name}</Text>
              <Text style={styles.thaiName}>{card.thaiName}</Text>
              <Text style={styles.role}>{card.role}</Text>
            </View>
          </View>
        ) : null}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { padding: 28 },
  frame: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.bgCard,
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  numeral: {
    color: colors.gold,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: 4,
  },
  art: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.goldDim,
    backgroundColor: colors.bgCard2,
  },
  artImage: {
    borderRadius: 10,
  },
  caption: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  name: {
    color: colors.parchment,
    fontFamily: fonts.displaySemiBold,
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  thaiName: { color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 14 },
  role: { color: colors.inkDim, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
});
