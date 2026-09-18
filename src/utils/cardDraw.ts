import cards from '../data/cards';
import { DrawnCard, ReadingSpread } from '../types';
import { createSeededRandom, hashStringToSeed, pickRandomN } from './random';

// วันที่ตามเวลาเครื่อง (local) ไม่ normalize เป็น UTC — "วันนี้" ควรอิงเวลาที่
// ผู้ใช้เห็นบนเครื่องตัวเอง ไม่ใช่ตัดวันแบบ UTC ซึ่งอาจคาบเกี่ยวไม่ตรงกับที่ผู้ใช้รู้สึก
export function getTodaySeed(): number {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  return hashStringToSeed(key);
}

// จั่วไพ่ตามจำนวนใน spread แบบไม่ซ้ำใบ พร้อมสุ่มหงาย/กลับหัวแยกอิสระต่อใบ
// ผูกกับตำแหน่งตามลำดับใน spread.positions
export function drawSpread(
  spread: ReadingSpread,
  random: () => number = Math.random
): DrawnCard[] {
  const drawn = pickRandomN(cards, spread.cardCount, random);
  return spread.positions.map((position, i) => ({
    positionId: position.id,
    cardId: drawn[i].id,
    reversed: random() < 0.5,
  }));
}

// ใช้กับหัวข้อ "โชคของวันนี้" เท่านั้น — ให้ผลจั่วเดิมตลอดทั้งวัน โดยไม่ต้องเก็บ
// ค่าอะไรลง AsyncStorage เพราะ seed คำนวณจากวันที่ปัจจุบันตรง ๆ ทุกครั้งที่เรียก
export function createDailyRandom(): () => number {
  return createSeededRandom(getTodaySeed());
}
