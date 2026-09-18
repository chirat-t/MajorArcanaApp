import { useCallback, useState } from 'react';
import { FlatList, ImageBackground, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Appbar, Badge, Text, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardImages } from '../assets/cardImages';
import CardBack from '../components/CardBack';
import CardModal from '../components/CardModal';
import CharacterAvatar from '../components/CharacterAvatar';
import { useCollection } from '../context/CollectionContext';
import characters from '../data/characters';
import { colors, fonts } from '../theme';
import { CharacterArc, TarotCard } from '../types';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';

type CollectionNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Collection'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const COLUMNS = 3;
const GAP = 12;

type TabKey = 'cards' | 'characters';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'cards', label: 'ไพ่ที่เคยดูแล้ว' },
  { key: 'characters', label: 'ตัวละคร' },
];

// ไพ่ในกริด: เคยดูแล้วเปิดหน้าให้เห็นเลขโรมัน + ชื่อ + ✓
// ยังไม่เคยดูแสดงหลังไพ่ + Badge "ใหม่" (PROJECT_BRIEF.md ข้อ 5.4)
function CollectionCard({
  card,
  viewed,
  onPress,
}: {
  card: TarotCard;
  viewed: boolean;
  onPress: (card: TarotCard) => void;
}) {
  return (
    <View style={styles.cell}>
      <TouchableRipple
        style={styles.touchable}
        borderless
        rippleColor={`${colors.gold}33`}
        disabled={!viewed}
        onPress={() => onPress(card)}
        accessibilityRole="button"
        accessibilityLabel={
          viewed ? `ดูไพ่ ${card.name} เต็มใบ` : `ไพ่ใบที่ ${card.numeral} ยังไม่เคยเปิด`
        }
      >
        {viewed ? (
          <ImageBackground
            source={cardImages[card.id]}
            resizeMode="cover"
            imageStyle={styles.faceImage}
            style={styles.faceUp}
          >
            <View style={styles.nameBar}>
              <Text style={styles.cardName} numberOfLines={1}>
                {card.thaiName}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <CardBack numeral={card.numeral} />
        )}
      </TouchableRipple>

      {viewed ? (
        <Badge style={styles.checkBadge} size={20}>
          ✓
        </Badge>
      ) : (
        <Badge style={styles.newBadge} size={18}>
          ใหม่
        </Badge>
      )}
    </View>
  );
}

function CharacterRow({
  character,
  onPress,
}: {
  character: CharacterArc;
  onPress: (character: CharacterArc) => void;
}) {
  return (
    <TouchableRipple
      style={styles.characterRow}
      borderless
      rippleColor={`${colors.gold}22`}
      onPress={() => onPress(character)}
      accessibilityRole="button"
      accessibilityLabel={`ดูรายละเอียด ${character.name}`}
    >
      <View style={styles.characterRowInner}>
        <CharacterAvatar characterId={character.id} size={56} />
        <View style={styles.characterTexts}>
          <Text style={styles.characterName}>{character.name}</Text>
          <Text style={styles.characterArchetype}>{character.archetype}</Text>
          <Text style={styles.characterArc}>{character.arcSummary}</Text>
        </View>
      </View>
    </TouchableRipple>
  );
}

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const { cards, viewedCount, totalCount, isViewed } = useCollection();
  const [tab, setTab] = useState<TabKey>('cards');
  const [selected, setSelected] = useState<TarotCard | null>(null);

  const navigation = useNavigation<CollectionNavigationProp>();
  const handleCardPress = useCallback((card: TarotCard) => setSelected(card), []);
  const handleCharacterPress = useCallback(
    (character: CharacterArc) =>
      navigation.navigate('CharacterDetail', { characterId: character.id }),
    [navigation]
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} statusBarHeight={insets.top}>
        <Appbar.Content title="คอลเลกชันของฉัน" titleStyle={styles.title} />
        <Text style={styles.count}>{`${viewedCount}/${totalCount}`}</Text>
      </Appbar.Header>

      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <TouchableRipple
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              rippleColor={`${colors.gold}22`}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
            </TouchableRipple>
          );
        })}
      </View>

      {tab === 'cards' ? (
        <FlatList
          // key ต่างกันเพื่อบังคับให้ remount ตอนสลับแท็บ — ไม่งั้น React ใช้
          // FlatList ตัวเดิมซ้ำ แล้ว numColumns เปลี่ยนกลางคัน ซึ่งไม่รองรับ
          key="tab-cards"
          data={cards}
          keyExtractor={(card) => card.id}
          numColumns={COLUMNS}
          renderItem={({ item }) => (
            <CollectionCard card={item} viewed={isViewed(item.id)} onPress={handleCardPress} />
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key="tab-characters"
          data={characters}
          keyExtractor={(character) => character.id}
          renderItem={({ item }) => (
            <CharacterRow character={item} onPress={handleCharacterPress} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CardModal card={selected} onDismiss={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPhone },
  appbar: { backgroundColor: colors.bgCard },
  title: { color: colors.parchment, fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: 0.5 },
  count: { color: colors.gold, fontFamily: fonts.body, marginRight: 16, fontSize: 14 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.gold },
  tabLabel: { color: colors.inkDim, fontFamily: fonts.body, fontSize: 13 },
  tabLabelActive: { color: colors.gold, fontFamily: fonts.bodyMedium },

  list: { padding: 16, gap: GAP },
  row: { gap: GAP },
  cell: { flex: 1 },
  touchable: { borderRadius: 10 },
  faceUp: {
    aspectRatio: 2 / 3,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.bgCard2,
    justifyContent: 'flex-end',
  },
  faceImage: { borderRadius: 10 },
  nameBar: {
    backgroundColor: 'rgba(11, 17, 32, 0.72)',
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  cardName: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.gold,
    color: colors.bgPage,
    fontSize: 11,
    lineHeight: 20,
  },
  newBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.purple,
    color: colors.parchment,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 18,
    paddingHorizontal: 6,
  },

  characterRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  characterRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  characterTexts: { flex: 1, gap: 3 },
  characterName: { color: colors.parchment, fontFamily: fonts.bodyMedium, fontSize: 16 },
  characterArchetype: {
    color: colors.gold,
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 1,
  },
  characterArc: { color: colors.ink, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
});
