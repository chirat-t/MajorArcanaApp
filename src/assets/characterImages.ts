import type { ImageSourcePropType } from 'react-native';

import { CharacterId } from '../types';

export type CharacterImageSet = {
  avatar: ImageSourcePropType; // วงกลมเล็ก — Collection > ตัวละคร, Card Detail
  portrait: ImageSourcePropType; // สี่เหลี่ยมใหญ่ — Character Detail เต็มจอ
};

// มีรูปจริงเฉพาะตัวละครหลัก 4 ตัว — สัตว์คู่หู (dog/cat/crow) ยังไม่มี asset
// ตาม PROJECT_BRIEF.md ข้อ 7 จึงไม่ครอบคลุมทุก CharacterId โดยตั้งใจ
//
// portrait ตอนนี้เป็นไฟล์สำเนาของ avatar ไปก่อน (ยังไม่มีภาพพอร์เทรตแยก) —
// อัปเกรดได้ทันทีโดยเอาไฟล์พอร์เทรตจริงไปวางทับที่ path ด้านล่าง ใช้ชื่อไฟล์เดิม
// ไม่ต้องแก้โค้ดไฟล์นี้เลย:
//   src/assets/characters/portraits/boy.jpg
//   src/assets/characters/portraits/witch.jpg
//   src/assets/characters/portraits/reaper.jpg
//   src/assets/characters/portraits/alchemist.jpg
export const characterImages: Partial<Record<CharacterId, CharacterImageSet>> = {
  boy: {
    avatar: require('./characters/boy.jpg'),
    portrait: require('./characters/portraits/boy.jpg'),
  },
  witch: {
    avatar: require('./characters/witch.jpg'),
    portrait: require('./characters/portraits/witch.jpg'),
  },
  reaper: {
    avatar: require('./characters/reaper.jpg'),
    portrait: require('./characters/portraits/reaper.jpg'),
  },
  alchemist: {
    avatar: require('./characters/alchemist.jpg'),
    portrait: require('./characters/portraits/alchemist.jpg'),
  },
};
