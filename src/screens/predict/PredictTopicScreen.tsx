import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Appbar, Badge, Button, Text, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CardBack from '../../components/CardBack';
import topics from '../../data/topics';
import { useCollection } from '../../context/CollectionContext';
import { colors, fonts } from '../../theme';
import { ReadingSpread, ReadingTopic, TopicId } from '../../types';
import type { PredictStackParamList, RootTabParamList } from '../../navigation/types';

// หน้าแรกของแท็บ "คำทำนาย" — อยู่ใน stack ของแท็บตัวเอง แต่ยังต้องข้ามไปแท็บอื่นได้
type PredictTopicNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Predict'>,
  NativeStackNavigationProp<PredictStackParamList>
>;

// แถวหัวข้อการอ่านไพ่ — เลือกได้ทีละหัวข้อ ตัวที่เลือกอยู่เด่นด้วยขอบ/พื้นหลัง/
// ไอคอนวงกลมสีทอง
function TopicListItem({
  topic,
  selected,
  onPress,
}: {
  topic: ReadingTopic;
  selected: boolean;
  onPress: (id: TopicId) => void;
}) {
  return (
    <TouchableRipple
      style={[styles.topicFrame, selected && styles.topicFrameSelected]}
      borderless
      rippleColor={`${colors.gold}22`}
      onPress={() => onPress(topic.id)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={topic.label}
    >
      <View style={styles.topicInner}>
        <View style={[styles.topicIconCircle, selected && styles.topicIconCircleSelected]}>
          <MaterialCommunityIcons
            name={topic.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={selected ? 22 : 20}
            color={selected ? colors.bgPage : colors.gold}
          />
        </View>
        <View style={styles.topicTexts}>
          <Text style={styles.topicLabel}>{topic.label}</Text>
          {topic.subCaptions ? (
            <Text style={styles.topicSubCaption}>{topic.subCaptions.join(' · ')}</Text>
          ) : null}
        </View>
        {selected ? (
          <MaterialCommunityIcons name="check-circle" size={22} color={colors.gold} />
        ) : null}
      </View>
    </TouchableRipple>
  );
}

// พรีวิวของ spread ที่ผูกกับหัวข้อที่เลือกอยู่ — แต่ละหัวข้อมี spread ตายตัวหนึ่งแบบ
// จึงแสดงเป็นแถวนิ่ง ๆ ที่เปลี่ยนตามหัวข้อ ไม่ใช่ carousel ให้เลือกหลายแบบ
function SpreadPreviewRow({ spread }: { spread: ReadingSpread }) {
  const cardWidth = spread.cardCount === 1 ? 90 : 64;
  return (
    <View style={styles.previewFrame}>
      <Text style={styles.previewDescription}>{spread.description}</Text>
      <View style={styles.previewRow}>
        {spread.positions.map((position) => (
          <View key={position.id} style={styles.previewItem}>
            <CardBack width={cardWidth} />
            <Text style={styles.previewLabel} numberOfLines={2}>
              {position.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PredictTopicScreen() {
  const navigation = useNavigation<PredictTopicNavigationProp>();
  const insets = useSafeAreaInsets();
  const { viewedCount, totalCount } = useCollection();
  const [selectedTopicId, setSelectedTopicId] = useState<TopicId>('love');
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId)!;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} statusBarHeight={insets.top}>
        <Appbar.Content title="คำทำนาย" titleStyle={styles.appTitle} />
        <View style={styles.actionWrapper}>
          <Appbar.Action
            icon="cards-outline"
            iconColor={colors.gold}
            accessibilityLabel="ไปที่คอลเลกชัน"
            onPress={() => navigation.navigate('Collection')}
          />
          <Badge style={styles.countBadge} size={18}>
            {`${viewedCount}/${totalCount}`}
          </Badge>
        </View>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>หัวข้อการอ่านไพ่</Text>
        <View style={styles.topicList}>
          {topics.map((topic) => (
            <TopicListItem
              key={topic.id}
              topic={topic}
              selected={topic.id === selectedTopicId}
              onPress={setSelectedTopicId}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>รูปแบบการเปิดไพ่</Text>
        <SpreadPreviewRow spread={selectedTopic.spread} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          buttonColor={colors.gold}
          textColor={colors.bgPage}
          style={styles.cta}
          onPress={() => navigation.navigate('PredictDraw', { topicId: selectedTopicId })}
        >
          เริ่มเปิดไพ่
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPhone },
  appbar: { backgroundColor: colors.bgCard },
  appTitle: { color: colors.parchment, fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: 0.5 },
  actionWrapper: { justifyContent: 'center' },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 2,
    backgroundColor: colors.purple,
    color: colors.parchment,
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  content: { padding: 20, gap: 12 },
  sectionLabel: {
    color: colors.inkDim,
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  topicList: { gap: 12 },
  topicFrame: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  topicFrameSelected: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.bgCard2,
  },
  topicInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  topicIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard2,
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  topicIconCircleSelected: { backgroundColor: colors.gold, borderWidth: 0 },
  topicTexts: { flex: 1, gap: 3 },
  topicLabel: { color: colors.parchment, fontFamily: fonts.bodyMedium, fontSize: 16 },
  topicSubCaption: { color: colors.inkDim, fontFamily: fonts.body, fontSize: 12 },
  previewFrame: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    padding: 16,
    gap: 14,
  },
  previewDescription: { color: colors.gold, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
  previewRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  previewItem: { alignItems: 'center', gap: 6, maxWidth: 100 },
  previewLabel: { color: colors.ink, fontFamily: fonts.body, fontSize: 12, textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: colors.bgPhone },
  cta: { borderRadius: 24 },
});
