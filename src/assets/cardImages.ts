import type { ImageSourcePropType } from 'react-native';

// require() ต้องเป็น literal string ให้ Metro resolve ตอน build ได้ —
// แมปจาก card.id ไปยังไฟล์ภาพจริงใน src/assets/cards/ ที่นี่ที่เดียว
// เพิ่มไพ่ใหม่ในอนาคต: เพิ่มบรรทัด require() ที่นี่คู่กับ src/data/cards.ts
export const cardImages: Record<string, ImageSourcePropType> = {
  'the-fool': require('./cards/00-the-fool.jpg'),
  'the-magician': require('./cards/01-the-magician.jpg'),
  'the-high-priestess': require('./cards/02-the-high-priestess.jpg'),
  'the-empress': require('./cards/03-the-empress.jpg'),
  'the-emperor': require('./cards/04-the-emperor.jpg'),
  'the-hierophant': require('./cards/05-the-hierophant.jpg'),
  'the-lovers': require('./cards/06-the-lovers.jpg'),
  'the-chariot': require('./cards/07-the-chariot.jpg'),
  'strength': require('./cards/08-strength.jpg'),
  'the-hermit': require('./cards/09-the-hermit.jpg'),
  'wheel-of-fortune': require('./cards/10-wheel-of-fortune.jpg'),
  'justice': require('./cards/11-justice.jpg'),
  'the-hanged-man': require('./cards/12-the-hanged-man.jpg'),
  'death': require('./cards/13-death.jpg'),
  'temperance': require('./cards/14-temperance.jpg'),
  'the-devil': require('./cards/15-the-devil.jpg'),
  'the-tower': require('./cards/16-the-tower.jpg'),
  'the-star': require('./cards/17-the-star.jpg'),
  'the-moon': require('./cards/18-the-moon.jpg'),
  'the-sun': require('./cards/19-the-sun.jpg'),
  'judgement': require('./cards/20-judgement.jpg'),
  'the-world': require('./cards/21-the-world.jpg'),
};

export const cardBackImage: ImageSourcePropType = require('./card-back.jpg');
