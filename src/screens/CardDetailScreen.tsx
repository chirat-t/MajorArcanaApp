import { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Appbar, Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardImages } from '../assets/cardImages';
import { characterName } from '../components/CharacterAvatar';
import InfoRow from '../components/InfoRow';
import { useCollection } from '../context/CollectionContext';
import { colors, fonts } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CardDetail'>;

export default function CardDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { getCardById, getRandomCard, markViewed, isFavorite, toggleFavorite } = useCollection();
  const { cardId } = route.params;
  const card = getCardById(cardId);

  // เปิดดูแล้วนับเป็น "เคยดู" — Badge ใน Appbar และ Collection อ่านจากตรงนี้
  useEffect(() => {
    if (card) markViewed(card.id);
  }, [card, markViewed]);

  if (!card) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>ไม่พบไพ่ใบนี้</Text>
        <Button textColor={colors.gold} onPress={() => navigation.goBack()}>
          ย้อนกลับ
        </Button>
      </View>
    );
  }

  const favorite = isFavorite(card.id);
  const cardImage = cardImages[card.id];

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} statusBarHeight={insets.top}>
        <Appbar.BackAction color={colors.gold} onPress={() => navigation.goBack()} />
        <Appbar.Content title={card.name} titleStyle={styles.appTitle} />
        <Appbar.Action
          icon={favorite ? 'bookmark' : 'bookmark-outline'}
          iconColor={favorite ? colors.gold : colors.ink}
          accessibilityLabel={favorite ? 'เอาออกจากรายการบันทึก' : 'บันทึกไพ่ใบนี้'}
          onPress={() => toggleFavorite(card.id)}
        />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.numeral}>{card.numeral}</Text>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.thaiName}>{card.thaiName}</Text>
        </View>

        {cardImage ? (
          <Image source={cardImage} style={styles.cardImage} accessibilityLabel={card.name} />
        ) : null}

        {/* คำโปรย: กึ่งกลาง ไม่มีกรอบ ไม่มีป้ายกำกับ (ข้อ 5.3) */}
        <Text style={styles.quote}>{card.quote}</Text>

        <View style={styles.rows}>
          <InfoRow
            icon="account-group-outline"
            label="ตัวละคร"
            value={card.character.map(characterName).join(' · ')}
          />
          <InfoRow icon="drama-masks" label="บทบาท" value={card.role} />
          <InfoRow
            icon="book-open-variant"
            label="ความหมาย +"
            value={card.meaning.join(' · ')}
            goldLabel
          />
          <InfoRow
            icon="swap-vertical"
            label="ความหมาย -"
            value={card.reversed.join(' · ')}
            goldLabel
          />
          <InfoRow icon="star-four-points-outline" label="สัญลักษณ์" value={card.symbols.join(' · ')} />
        </View>

        <Button
          mode="contained"
          buttonColor={colors.gold}
          textColor={colors.bgPage}
          style={styles.drawButton}
          onPress={() => navigation.replace('Loading', { cardId: getRandomCard(card.id).id })}
        >
          สุ่มไพ่ใหม่
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPhone },
  appbar: { backgroundColor: colors.bgCard },
  appTitle: { color: colors.parchment, fontFamily: fonts.displaySemiBold, fontSize: 17, letterSpacing: 1.5 },
  content: { padding: 20, alignItems: 'center', gap: 18 },
  heading: { alignItems: 'center', gap: 4 },
  numeral: { color: colors.goldDim, fontFamily: fonts.display, fontSize: 13, letterSpacing: 3 },
  name: {
    color: colors.parchment,
    fontFamily: fonts.displayBold,
    fontSize: 26,
    letterSpacing: 2,
    textAlign: 'center',
  },
  thaiName: { color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 15 },
  cardImage: {
    width: 150,
    height: 224,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  // ไม่ใช้ fontStyle: 'italic' — Noto Sans Thai ไม่มีฟอนต์เอียงจริง Android จะ
  // เอียงตัวอักษรปลอมด้วย skew transform ซึ่งทำให้ตัวอักษรท้ายบรรทัด (โดยเฉพาะ
  // เมื่อ textAlign เป็น center) ถูกตัดขาดหายไปจากขอบเขตที่คำนวณไว้
  quote: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  rows: { alignSelf: 'stretch', gap: 12 },
  drawButton: { alignSelf: 'stretch', borderRadius: 24, marginTop: 4 },
  missing: {
    flex: 1,
    backgroundColor: colors.bgPhone,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  missingText: { color: colors.parchment, fontFamily: fonts.body },
});
