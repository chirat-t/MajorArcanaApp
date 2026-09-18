export type CharacterId =
  | "boy"        // เด็กชาย นักเดินทาง — The Journey
  | "witch"      // แม่มดน้อย — The Mystery
  | "reaper"     // ยมทูตขี้เซา — The Change
  | "alchemist"  // นักเล่นแร่แปรธาตุ — The Creation
  | "dog"        // สัตว์คู่หูของเด็กชาย
  | "cat"        // สัตว์คู่หูของแม่มดน้อย
  | "crow";      // สัตว์คู่หูของยมทูต

export interface TarotCard {
  id: string;                 // slug เช่น "the-fool"
  number: number;             // 0-21
  numeral: string;            // "0", "I", "II", ... "XXI" (แสดงบนกรอบไพ่)
  name: string;               // "THE FOOL"
  thaiName: string;           // "ผู้เริ่มต้น"
  character: CharacterId[];   // ตัวละคร/สัตว์คู่หูที่ปรากฏในไพ่ใบนี้
  role: string;               // บทบาทในเนื้อเรื่อง
  meaning: string[];          // ความหมายทั่วไปของไพ่
  symbols: string[];          // สัญลักษณ์บนไพ่
  quote: string;              // คำโปรย (แสดงกึ่งกลาง ไม่มีกรอบ ในหน้า Card Detail)
  upright: string[];          // ความหมายด้านตั้ง
  reversed: string[];         // ความหมายด้านกลับ
  story: string;              // เนื้อเรื่องประกอบไพ่ใบนี้
  image: string;              // path รูปเต็มใบ เช่น "assets/cards/00-the-fool.png"
}

export interface CharacterArc {
  id: CharacterId;
  name: string;                // "เด็กชาย"
  archetype: string;           // "The Journey"
  represents: string;          // สิ่งที่ตัวละครเป็นตัวแทน
  arcSummary: string;          // สรุปพัฒนาการตลอดเรื่อง แบบ "เริ่มต้น → ... → ..."
  quote: string;               // คำโปรยประจำตัวละคร (แสดงกึ่งกลางในหน้า Character Detail)
  personality: string[];       // บุคลิก/นิสัยเด่น
  colorPalette: string[];      // โทนสีหลักของตัวละคร (hex)
  avatar: string;              // path รูป avatar วงกลมเล็ก (Collection list, Card Detail)
  portrait: string;            // path รูปพอร์เทรตใหญ่สี่เหลี่ยม (Character Detail เต็มจอ)
}

// สถานะที่ผูกกับผู้ใช้แต่ละคน — เก็บแยกจากข้อมูลไพ่แบบ static (cards.ts)
// เพื่อให้ deck/theme ใหม่ในอนาคตไม่ต้องพกสถานะผู้ใช้ติดไปด้วย
export interface UserCardProgress {
  cardId: string;               // อ้างอิง TarotCard.id
  isViewed: boolean;            // ใช้กับ Badge "ใหม่" / เครื่องหมาย ✓ ใน Collection
  viewedAt?: string;            // ISO timestamp
}

// รองรับหลายธีม/เดคไพ่ในอนาคต (ดูสถาปัตยกรรมใน PROJECT_BRIEF.md ข้อ 3)
export interface TarotTheme {
  id: string;                   // "default" | "sakura" | "minimal" ...
  name: string;
  colors: {
    background: string;
    cardBg: string;
    gold: string;
    parchment: string;
  };
  cardBackImage: string;          // รูปหลังไพ่ของธีมนี้
  coverImage: string;             // พื้นหลังหน้า Home (หน้าปกตอนเข้าเกม)
  shuffleBackgroundImage: string; // พื้นหลังหน้า Loading (ตอนสับไพ่)
  fontDisplay: string;            // ฟอนต์หัวเรื่อง เช่น "Cinzel"
}

export interface TarotDeck {
  id: string;                   // "4-characters" | "anime-classic" ...
  name: string;
  themeId: string;              // ผูกกับ TarotTheme.id
  cards: TarotCard[];           // ไพ่ 22 ใบของเดคนี้
}

// หัวข้อการอ่านไพ่ (Level 2/3) — แต่ละหัวข้อผูกกับ spread ตายตัวหนึ่งแบบ
// ไม่ใช่ให้ผู้ใช้เลือก spread เองจากหลายแบบ
export type TopicId = "love" | "career" | "advice" | "daily";

export interface SpreadPosition {
  id: string;    // slug ไม่ซ้ำภายใน spread เดียวกัน เช่น "self" | "other" | "trend"
  label: string; // ป้ายกำกับใต้ไพ่ เช่น "ตัวคุณ"
}

export interface ReadingSpread {
  id: string;                   // "love-3" | "career-3" | "advice-3" | "daily-1"
  cardCount: number;            // 1 | 3
  description: string;          // "ตัวคุณ → อีกฝ่าย → แนวโน้มความสัมพันธ์"
  positions: SpreadPosition[];  // length === cardCount
}

export interface ReadingTopic {
  id: TopicId;
  label: string;         // "ความรัก & ความสัมพันธ์"
  icon: string;           // ชื่อไอคอน MaterialCommunityIcons — เก็บเป็น string เฉย ๆ
                          // (เหมือน FALLBACK_ICONS ใน CharacterAvatar.tsx) กัน types.ts
                          // ไม่ต้อง import ไลบรารี UI
  subCaptions?: string[]; // เช่น ["ความรู้สึก","ความสัมพันธ์","คนรอบตัว"] — ไม่มีใน "daily"
  spread: ReadingSpread;  // 1 หัวข้อ ผูกกับ 1 spread เสมอ
}

// ส่งจาก CardDrawScreen ไป ReadingResultScreen ผ่าน route params
export interface DrawnCard {
  positionId: string; // อ้างอิง SpreadPosition.id
  cardId: string;     // อ้างอิง TarotCard.id
  reversed: boolean;
}
