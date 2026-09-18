import { StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';

import { characterImages } from '../assets/characterImages';
import characters from '../data/characters';
import { colors } from '../theme';
import { CharacterId } from '../types';

// ตัวละครหลัก 4 ตัวมีชื่อใน characters.ts อยู่แล้ว — เติมเฉพาะสัตว์คู่หู
const ANIMAL_NAMES: Record<string, string> = {
  dog: 'สุนัข',
  cat: 'แมว',
  crow: 'อีกา',
};

// ไอคอนสำรองสำหรับสัตว์คู่หู (dog/cat/crow) ที่ยังไม่มีรูปจริง
const FALLBACK_ICONS: Record<CharacterId, string> = {
  boy: 'human-child',
  witch: 'hat-fedora',
  reaper: 'skull-outline',
  alchemist: 'flask-outline',
  dog: 'dog',
  cat: 'cat',
  crow: 'bird',
};

export function characterName(id: CharacterId): string {
  return characters.find((c) => c.id === id)?.name ?? ANIMAL_NAMES[id] ?? id;
}

type Props = {
  characterId: CharacterId;
  size?: number;
};

// ตัวละครหลัก 4 ตัวใช้รูปจริงจาก src/assets/characters/ — สัตว์คู่หูที่ยังไม่มี
// asset (dog/cat/crow) ใช้ไอคอนสำรองแทนไปก่อน
export default function CharacterAvatar({ characterId, size = 120 }: Props) {
  const image = characterImages[characterId]?.avatar;

  if (image) {
    return (
      <Avatar.Image
        size={size}
        source={image}
        style={[styles.avatar, { borderRadius: size / 2 }]}
        accessibilityLabel={characterName(characterId)}
      />
    );
  }

  return (
    <Avatar.Icon
      size={size}
      icon={FALLBACK_ICONS[characterId] ?? 'account-outline'}
      color={colors.gold}
      style={[styles.avatar, { borderRadius: size / 2 }]}
      accessibilityLabel={characterName(characterId)}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.bgCard2,
    borderWidth: 2,
    borderColor: colors.gold,
  },
});
