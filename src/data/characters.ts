import { CharacterArc } from '../types';

// หมายเหตุ: quote / personality / colorPalette เป็นค่าตั้งต้นที่ดึงจากข้อมูล
// ที่มีอยู่แล้วในรีโป ยังไม่ใช่ค่าจาก reference sheet ตัวจริง
//   - quote       = คำโปรยของไพ่ใบแรกที่ตัวละครเป็นตัวนำ (cards.ts)
//   - personality = คัดจากฟิลด์ meaning ของไพ่ที่ตัวละครเป็นตัวนำ (cards.ts)
//   - colorPalette = เลือกจาก design tokens ใน theme.ts (PROJECT_BRIEF.md ข้อ 6)
// เมื่อได้ reference sheet แล้วแก้ 3 ฟิลด์นี้ในไฟล์นี้ที่เดียว
const characters: CharacterArc[] = [
  {
    id: "boy",
    name: "เด็กชาย",
    archetype: "The Journey",
    represents: "การเดินทาง — เขาคือคนที่ทำให้เรื่องเริ่มต้น",
    arcSummary: "เริ่มต้น → ออกเดินทาง → เผชิญโลก → ค้นพบความสุข",
    quote: "เราไม่จำเป็นต้องรู้ว่าปลายทางอยู่ที่ไหน แค่กล้าออกเดินทางก็พอ",
    personality: ["ความกล้า", "การเปิดรับสิ่งใหม่", "ความมุ่งมั่น", "ความสดใส"],
    colorPalette: ["#9a9357", "#8b572a", "#c3523c"],
    avatar: "assets/characters/boy.jpg",
    portrait: "assets/characters/portraits/boy.jpg"
  },
  {
    id: "witch",
    name: "แม่มดน้อย",
    archetype: "The Mystery",
    represents: "ความรู้และสิ่งที่มองไม่เห็น — เธอรู้ความลับของโลกมากที่สุด",
    arcSummary: "ความลับ → การเรียนรู้ → ความกลัว → ความหวัง → ความเข้าใจ",
    quote: "บางคำตอบไม่ได้อยู่ตรงหน้า แต่อยู่ในสิ่งที่เรารู้สึก",
    personality: ["สัญชาตญาณ", "ภูมิปัญญา", "ความเมตตา", "การฟังเสียงภายใน"],
    colorPalette: ["#3d2875", "#fbc97f", "#1c1411"],
    avatar: "assets/characters/witch.jpg",
    portrait: "assets/characters/portraits/witch.jpg"
  },
  {
    id: "reaper",
    name: "ยมทูต",
    archetype: "The Change",
    represents: "เวลาและการเปลี่ยนแปลง — ไม่ใช่ตัวร้าย แต่เตือนว่าทุกอย่างมีจุดเริ่มต้นและจุดจบ",
    arcSummary: "เวลา → การตัดสินใจ → การเปลี่ยนแปลง → การปล่อยวาง → การตื่นรู้",
    quote: "บางคำตอบ เราต้องเดินไปค้นหาด้วยตัวเอง",
    personality: ["การไตร่ตรอง", "ความยุติธรรม", "การปล่อยวาง", "ความจริง"],
    colorPalette: ["#191814", "#f7e0c5", "#413227"],
    avatar: "assets/characters/reaper.jpg",
    portrait: "assets/characters/portraits/reaper.jpg"
  },
  {
    id: "alchemist",
    name: "นักเล่นแร่แปรธาตุ",
    archetype: "The Creation",
    represents: "ความรู้ การทดลอง และความผิดพลาด — ผู้ทำให้เกิดทั้งความสำเร็จและความวุ่นวาย",
    arcSummary: "ทดลอง → เรียนรู้ → สร้าง → ล้มเหลว → เข้าใจสมดุล",
    quote: "สิ่งที่เรามีอยู่ในมือ อาจเพียงพอสำหรับสร้างสิ่งที่ยิ่งใหญ่",
    personality: ["ความคิดสร้างสรรค์", "การลงมือทำ", "ภาวะผู้นำ", "สมดุล"],
    colorPalette: ["#8a7d4c", "#fbf1e3", "#839b41"],
    avatar: "assets/characters/alchemist.jpg",
    portrait: "assets/characters/portraits/alchemist.jpg"
  }
];

export default characters;
