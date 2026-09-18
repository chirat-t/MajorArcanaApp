import { ReadingTopic } from '../types';

// 4 หัวข้อการอ่านไพ่ — แต่ละหัวข้อผูกกับ spread ตายตัวหนึ่งแบบตามที่ออกแบบไว้
// เพิ่มหัวข้อใหม่ในอนาคต: เพิ่ม object ที่นี่ที่เดียว หน้า Home/CardDraw/ReadingResult
// อ่านจาก array นี้ทั้งหมด ไม่ต้องแก้โค้ดหน้าจอ
const topics: ReadingTopic[] = [
  {
    id: 'love',
    label: 'ความรัก & ความสัมพันธ์',
    icon: 'heart-outline',
    subCaptions: ['ความรู้สึก', 'ความสัมพันธ์', 'คนรอบตัว'],
    spread: {
      id: 'love-3',
      cardCount: 3,
      description: 'ตัวคุณ → อีกฝ่าย → แนวโน้มความสัมพันธ์',
      positions: [
        { id: 'self', label: 'ตัวคุณ' },
        { id: 'other', label: 'อีกฝ่าย' },
        { id: 'trend', label: 'แนวโน้ม' },
      ],
    },
  },
  {
    id: 'career',
    label: 'การงาน & การเงิน',
    icon: 'briefcase-variant-outline',
    subCaptions: ['โอกาส', 'การเงิน', 'ความก้าวหน้า'],
    spread: {
      id: 'career-3',
      cardCount: 3,
      description: 'สถานการณ์ปัจจุบัน → โอกาสหรืออุปสรรค → คำแนะนำ/การกระทำ',
      positions: [
        { id: 'situation', label: 'สถานการณ์ปัจจุบัน' },
        { id: 'opportunity', label: 'โอกาสหรืออุปสรรค' },
        { id: 'advice', label: 'คำแนะนำ/การกระทำ' },
      ],
    },
  },
  {
    id: 'advice',
    label: 'คำแนะนำทั่วไป',
    icon: 'compass-outline',
    subCaptions: ['แนวทาง', 'บทเรียน', 'การเติบโต'],
    spread: {
      id: 'advice-3',
      cardCount: 3,
      description: 'จิตใจ → ร่างกาย → จิตวิญญาณ',
      positions: [
        { id: 'mind', label: 'จิตใจ' },
        { id: 'body', label: 'ร่างกาย' },
        { id: 'spirit', label: 'จิตวิญญาณ' },
      ],
    },
  },
  {
    id: 'daily',
    label: 'โชคของวันนี้',
    icon: 'weather-night',
    spread: {
      id: 'daily-1',
      cardCount: 1,
      description: 'โชคที่คุณจะได้รับในวันนี้',
      positions: [{ id: 'today', label: 'โชคที่คุณจะได้รับในวันนี้' }],
    },
  },
];

export default topics;
