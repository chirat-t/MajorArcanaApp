import { TarotCard, TopicId } from '../types';
import { pickRandom, pickRandomN } from '../utils/random';

type Opener = (thaiName: string, positionLabel: string) => string;
type Connector = (keyword: string) => string;

// ประโยคเปิด — ไม่ผูกกับหัวข้อ ใช้ร่วมกันได้ทุกหัวข้อ โทนเดียวกับ card.quote/story
// ที่มีอยู่แล้ว (นุ่มนวล เปรียบเทียบกับการเดินทาง ไม่ใช้เครื่องหมายอัศเจรีย์) จงใจให้
// แต่ละประโยคขึ้นต้นด้วยคำ/โครงสร้างต่างกัน (ไม่ใช่แค่สลับคำในแม่แบบเดียว) เพื่อไม่ให้
// ผู้ใช้จำ pattern ได้ง่ายเกินไป
const OPENERS: Opener[] = [
  (thaiName, position) =>
    `เมื่อไพ่ ${thaiName} ปรากฏขึ้นในตำแหน่ง "${position}" เหมือนมีใครสักคนเดินมาเคาะประตูใจคุณเบาๆ`,
  (thaiName, position) =>
    `ไพ่ ${thaiName} เดินทางมาหยุดอยู่ที่ตำแหน่ง "${position}" ราวกับมีเรื่องราวบางอย่างอยากบอกคุณ`,
  (thaiName, position) =>
    `ในตำแหน่ง "${position}" ไพ่ ${thaiName} เผยตัวออกมาช้าๆ ให้คุณได้มองเห็นสิ่งที่ซ่อนอยู่ข้างใน`,
  (thaiName, position) =>
    `แสงจากไพ่ ${thaiName} ในตำแหน่ง "${position}" ทอดเงาบางอย่างลงบนเส้นทางที่คุณกำลังเดิน`,
  (thaiName, position) =>
    `ไพ่ ${thaiName} เลือกที่จะปรากฏในตำแหน่ง "${position}" บางทีนั่นอาจไม่ใช่เรื่องบังเอิญ`,
  (thaiName, position) =>
    `ตำแหน่ง "${position}" เปิดเผยไพ่ ${thaiName} ให้คุณได้พิจารณาอีกครั้งหนึ่ง`,
  (thaiName, position) =>
    `ไพ่ ${thaiName} ในตำแหน่ง "${position}" เหมือนหน้าหนึ่งของแผนที่ที่เพิ่งถูกเปิดออก`,
  (thaiName, position) =>
    `ลองหยุดมองไพ่ ${thaiName} ที่อยู่ในตำแหน่ง "${position}" สักครู่หนึ่ง`,
  (thaiName, position) =>
    `${thaiName} คือไพ่ที่เข้ามารับบทตำแหน่ง "${position}" ของคุณในตอนนี้`,
  (thaiName, position) =>
    `มีบางอย่างในไพ่ ${thaiName} ที่ดูเหมือนจะพูดตรงกับตำแหน่ง "${position}" พอดี`,
  (thaiName, position) =>
    `จังหวะที่ไพ่ ${thaiName} เข้ามาอยู่ในตำแหน่ง "${position}" ก็น่าสนใจไม่น้อย`,
];

// ประโยคเชื่อมโยงกับหัวข้อ — แยก 2 ชุดคือไพ่หงาย (โทนเปิดรับ/สนับสนุน) กับไพ่กลับหัว
// (โทนเตือน/ชวนระวัง แต่ยังนุ่มนวล ไม่รุนแรง) แต่ละชุดใช้ "รูปแบบความคิด" หลายแบบ
// (ชี้ประเด็น / ชวนทบทวน / สะท้อนสถานการณ์ / ให้คำแนะนำ / ชวนสังเกต) ไม่ใช่โครงประโยค
// เดียวซ้ำแล้วเปลี่ยนแค่คำ — เพราะ card.upright/reversed ถูกปรับให้เป็นวลีนามเสมอแล้ว
// (เช่น "การลงมือทำ", "ความมั่นใจในตัวเอง") พรีโพซิชันทั่วไปอย่าง กับ/ที่/จาก/ใน/ด้วย
// จึงต่อกับ ${keyword} ได้อย่างเป็นธรรมชาติโดยไม่ต้องพึ่งคำว่า "เรื่อง" นำหน้าทุกที่
const CONNECTORS_UPRIGHT: Record<TopicId, Connector[]> = {
  love: [
    (keyword) => `สิ่งที่ไพ่ใบนี้กำลังชี้ให้เห็นในความสัมพันธ์ของคุณคือ ${keyword}`,
    (keyword) => `ลองถามใจตัวเองดูว่า${keyword} ยังมีความหมายกับคุณมากแค่ไหนในตอนนี้`,
    (keyword) => `ระหว่างคุณกับอีกฝ่าย${keyword} อาจเป็นเส้นด้ายบางๆ ที่ยังโยงทั้งสองคนไว้ด้วยกัน`,
    (keyword) => `ลองเปิดพื้นที่ในใจให้${keyword} ได้เติบโตในความสัมพันธ์ครั้งนี้ดูบ้าง`,
    (keyword) => `คนที่คุณรักอาจกำลังสะท้อน${keyword} กลับมาให้คุณเห็นโดยไม่รู้ตัว`,
    (keyword) => `หัวใจของคุณตอนนี้อาจกำลังโหยหา${keyword} มากกว่าที่คิด`,
  ],
  career: [
    (keyword) => `ในเส้นทางการงานตอนนี้${keyword} คือแรงผลักที่จะพาคุณก้าวไปอีกขั้น`,
    (keyword) => `ลองมองดูว่า${keyword} จะช่วยเปิดโอกาสใหม่ให้คุณได้อย่างไร`,
    (keyword) => `สถานการณ์ตรงหน้าอาจกำลังต้องการ${keyword} มากกว่าที่คุณคิด`,
    (keyword) => `โอกาสที่กำลังจะมาถึงอาจแฝงตัวอยู่ในรูปของ${keyword}`,
    (keyword) => `เพื่อนร่วมงานหรือสถานการณ์รอบตัวอาจกำลังสะท้อนให้เห็นความสำคัญของ${keyword}`,
    (keyword) => `ก้าวต่อไปในหน้าที่การงานอาจเริ่มจาก${keyword} ที่คุณมีอยู่แล้ว`,
  ],
  advice: [
    (keyword) => `ในการเดินทางของจิตใจครั้งนี้${keyword} คือบทเรียนที่กำลังรอให้คุณเรียนรู้`,
    (keyword) => `หากฟังเสียงภายในให้ดี${keyword} คือสิ่งที่ร่างกายและใจกำลังบอกคุณ`,
    (keyword) => `การเติบโตครั้งนี้อาจเริ่มจาก${keyword} ที่ซ่อนอยู่ในตัวคุณเองมาตลอด`,
    (keyword) => `แนวทางข้างหน้าอาจชัดเจนขึ้น หากคุณลองใคร่ครวญ${keyword} ดูอีกครั้ง`,
    (keyword) => `สิ่งที่ไพ่ใบนี้อยากให้คุณสังเกตคือ${keyword} ที่กำลังเกิดขึ้นกับตัวคุณ`,
    (keyword) => `บางที${keyword} อาจเป็นกุญแจเล็กๆ ที่ไขทางออกให้คุณได้`,
  ],
  daily: [
    (keyword) => `โชคของวันนี้พาให้คุณได้พบกับ${keyword} แบบไม่ทันตั้งตัว`,
    (keyword) => `วันนี้${keyword} อาจเป็นของขวัญเล็กๆ ที่จักรวาลส่งมาให้`,
    (keyword) => `ให้${keyword} เป็นเข็มทิศนำทางคุณตลอดวันนี้`,
    (keyword) => `ลองสังเกตดูว่า${keyword} จะปรากฏให้เห็นในช่วงไหนของวันนี้`,
    (keyword) => `จังหวะดีๆของวันนี้อาจแอบซ่อนอยู่ในรูปของ${keyword}`,
  ],
};

// ไพ่กลับหัว — โทนเตือน/ให้ระวัง/ชวนทบทวน ไม่ใช่โทนเปิดรับแบบไพ่หงาย แต่ก็ไม่ใช้
// ถ้อยคำรุนแรงเกินความหมายเดิมของ keyword (ยังคงความนุ่มนวลของแอปไว้)
const CONNECTORS_REVERSED: Record<TopicId, Connector[]> = {
  love: [
    (keyword) => `สิ่งที่ควรระวังในความสัมพันธ์ครั้งนี้ อาจเป็นเรื่อง ${keyword}`,
    (keyword) => `ลองสังเกตดูว่า ${keyword} กำลังกลายเป็นเงาที่บดบังความรู้สึกดีๆ อยู่หรือเปล่า`,
    (keyword) => `ระหว่างคุณกับอีกฝ่าย${keyword} อาจเป็นช่องว่างเล็กๆ ที่ค่อยๆ ขยายขึ้นโดยไม่ทันรู้ตัว`,
    (keyword) => `ก่อนที่จะตัดสินใจอะไร ลองทบทวน${keyword} อีกสักครั้งจะดีกว่า`,
    (keyword) => `คนรอบตัวคุณอาจกำลังได้รับผลกระทบจาก${keyword} โดยที่คุณไม่ทันสังเกต`,
    (keyword) => `ความสัมพันธ์ในช่วงนี้อาจถูก${keyword} ถ่วงรั้งไว้อยู่เงียบๆ โดยไม่รู้ตัว`,
  ],
  career: [
    (keyword) => `เรื่องที่ควรระมัดระวังในหน้าที่การงานตอนนี้คือ${keyword}`,
    (keyword) => `${keyword}อาจเป็นอุปสรรคเล็กๆ ที่ควรรับมือให้ทันก่อนจะลุกลาม`,
    (keyword) => `สถานการณ์ตรงหน้าอาจกำลังเตือนให้คุณระวัง${keyword}ไว้บ้าง`,
    (keyword) => `โอกาสที่ควรจะเป็นของคุณอาจถูกบดบังไว้ด้วย${keyword}`,
    (keyword) => `ลองทบทวนดูว่า${keyword} กำลังฉุดรั้งความก้าวหน้าของคุณอยู่หรือเปล่า`,
    (keyword) => `เรื่องเงินและอาชีพในช่วงนี้ อาจได้รับผลกระทบจาก${keyword}หากปล่อยไว้`,
  ],
  advice: [
    (keyword) => `ในการเดินทางของจิตใจ${keyword} คือบทเรียนที่มักถูกมองข้าม`,
    (keyword) => `สัญญาณเตือนที่ไม่ควรมองข้ามตอนนี้อาจเป็น${keyword}`,
    (keyword) => `การเติบโตครั้งนี้อาจถูก${keyword}ถ่วงรั้งไว้โดยไม่รู้ตัว`,
    (keyword) => `ในด้านกลับ ไพ่นี้เตือนให้ระวัง${keyword}ไว้บ้าง`,
    (keyword) => `ลองสังเกตดูว่า${keyword} กำลังบังทางที่แท้จริงของคุณอยู่หรือเปล่า`,
    (keyword) => `บางครั้ง${keyword}ก็แอบแฝงอยู่ในความเคยชิน จนคุณอาจไม่ทันสังเกต`,
  ],
  daily: [
    (keyword) => `วันนี้ควรระวัง${keyword}ที่อาจแวะเวียนมาโดยไม่ทันตั้งตัว`,
    (keyword) => `โชคของวันนี้แฝงคำเตือนเรื่อง${keyword} ไว้อย่างแผ่วเบา`,
    (keyword) => `ให้ระวัง${keyword}ไว้บ้างตลอดวันนี้`,
    (keyword) => `หากเจอ${keyword}ระหว่างวัน ลองตั้งสติสักนิดก่อนตัดสินใจ`,
    (keyword) => `วันนี้อาจไม่ราบรื่นนัก หาก${keyword}เข้ามาโดยที่คุณไม่ทันระวัง`,
  ],
};

export interface Interpretation {
  body: string;  // ประโยคเปิด + ประโยคเชื่อมโยงหัวข้อ ประกอบจาก template
  quote: string; // card.quote เดิม แนบท้ายเสมอ แสดงแยกสไตล์ต่างหาก
}

// ต่อ keyword 2 คำแบบธรรมชาติกว่าการ join('และ') เฉย ๆ — ครอบด้วย "ทั้ง...และ..."
// ให้อ่านเป็นการเอ่ยถึงสองประเด็นคู่กัน ไม่ใช่แปะคำสองคำติดกันดื้อ ๆ
function joinKeywordParts(parts: string[]): string {
  return parts.length === 1 ? parts[0] : `ทั้ง${parts[0]}และ${parts[1]}`;
}

// ตรวจแบบง่าย ๆ (ไม่ใช่ NLP จริง) ว่าสอง string มีรากคำซ้ำกันหรือไม่ — เทียบ substring
// ที่ยาวพอ เพราะภาษาไทยไม่มีช่องว่างคั่นคำในวลีเดียว จะตัดคำแบบ NLP จริงไม่ได้ถ้าไม่มี
// ไลบรารีตัดคำ นี่คือ heuristic ที่จับกรณีซ้ำรากชัด ๆ ได้ (เช่น "ความกลัวการเริ่มต้นใหม่"
// กับ "ความกลัวสิ่งที่ยังไม่เกิดขึ้น" ที่ซ้ำ "ความกลัว") ใช้ 2 จุด: (1) กันไม่ให้จับคู่
// 2 keyword ที่ซ้ำความหมายกันมาต่อกัน (2) กันไม่ให้ keyword ไปชนคำในตัว connector เอง
// (เช่นเคส "การเพิกเฉยต่อสัญชาตญาณ" ชนคำว่า "เพิกเฉย" ท้ายประโยค connector บางอัน)
function shareSubstring(a: string, b: string, minLen: number): boolean {
  for (let i = 0; i + minLen <= a.length; i++) {
    if (b.includes(a.slice(i, i + minLen))) return true;
  }
  return false;
}

// คู่ keyword ที่ความหมายใกล้เคียงกันมากจนฟังเหมือนพูดซ้ำ แม้ตัวอักษรจะไม่มี substring
// ซ้ำกันเลย (shareSubstring จับไม่ได้ เพราะเป็นความซ้ำเชิงความหมาย ไม่ใช่เชิงตัวอักษร)
// — พบจากการอ่าน output จริงกว่า 500 ครั้งด้วยตา เช่น "ความประมาท"/"ความรีบร้อน"/
// "การตัดสินใจโดยไม่คิด" (ไพ่ผู้เริ่มต้น กลับหัว) ล้วนหมายถึง "ทำอะไรโดยไม่ยั้งคิด"
// แบบเดียวกัน หรือไพ่ผู้วางกฎกลับหัวที่มี 4 คำล้วนพูดถึง "ควบคุม/ยึดติดกฎเกณฑ์อย่าง
// แข็งกร้าวเกินไป" ในมุมต่างกันเล็กน้อย ห้ามจับคู่กันเอง (จับคู่กับ keyword อื่นในพูล
// เดียวกันได้ปกติ) รายการนี้เป็น heuristic ที่มาจากการอ่านจริง ไม่ใช่ NLP อัตโนมัติ —
// ถ้าเจอคู่ใหม่ที่ซ้ำความหมายอีกในอนาคต ให้เพิ่มที่นี่ ไม่ต้องแก้ architecture
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('||');
}
const NEAR_SYNONYM_PAIRS = new Set<string>([
  pairKey('ความประมาท', 'ความรีบร้อน'),
  pairKey('ความประมาท', 'การตัดสินใจโดยไม่คิด'),
  pairKey('ความรีบร้อน', 'การตัดสินใจโดยไม่คิด'),
  pairKey('การใช้อำนาจผิดทาง', 'การควบคุมมากเกินไป'),
  pairKey('การใช้อำนาจผิดทาง', 'การยึดติดกับกฎ'),
  pairKey('การใช้อำนาจผิดทาง', 'การขาดความยืดหยุ่น'),
  pairKey('การควบคุมมากเกินไป', 'การยึดติดกับกฎ'),
  pairKey('การควบคุมมากเกินไป', 'การขาดความยืดหยุ่น'),
  pairKey('การยึดติดกับกฎ', 'การขาดความยืดหยุ่น'),
  pairKey('การทำอะไรสุดโต่ง', 'ความมากเกินไป'),
  pairKey('การทำอะไรสุดโต่ง', 'การขาดสมดุล'),
  pairKey('การติดอยู่กับอดีต', 'การไม่เรียนรู้จากประสบการณ์ในอดีต'),
]);

// เลือก keyword จาก pool ของไพ่ใบนั้น (upright หรือ reversed) — ส่วนใหญ่ใช้คำเดียว
// (70%) ให้คำทำนายมี "ประเด็นหลัก" ชัดเจน ใช้ 2 คำ (30%) เฉพาะตอนที่หาคู่ที่ไม่ซ้ำ
// รากกันได้จริงและไม่ซ้ำความหมายกัน ไม่ join('และ') มั่ว ๆ ทุกกรณี — ถ้าลองหลายรอบ
// แล้วยังไม่เจอคู่ที่โอเค ก็ยอมถอยกลับไปใช้คำเดียวแทน (ปลอดภัยกว่าการฝืนต่อคำที่ซ้ำ
// ความหมายกัน) คืนเป็น array ของคำดิบ (ยังไม่ join) ให้ composeInterpretation เอาไป
// เช็คชนกับ connector ได้ด้วย
function pickKeywordParts(pool: string[]): string[] {
  const useTwo = pool.length >= 2 && Math.random() < 0.3;
  if (!useTwo) return [pickRandom(pool)];

  for (let attempt = 0; attempt < 4; attempt++) {
    const pair = pickRandomN(pool, 2);
    if (!shareSubstring(pair[0], pair[1], 6) && !NEAR_SYNONYM_PAIRS.has(pairKey(pair[0], pair[1]))) {
      return pair;
    }
  }
  return [pickRandom(pool)];
}

// เช็คว่า keyword (แต่ละคำดิบ ตัด การ/ความ นำหน้าออกก่อน) ไปโผล่ซ้ำกับข้อความรอบ ๆ
// ในตัว connector template เองหรือไม่ (เรียก connector('') เพื่อเอาแค่ข้อความรอบ ๆ
// โดยยังไม่แทรก keyword) — ถ้าซ้ำ ให้ถือว่า combination นี้ฟังแปลกและลองใหม่
function keywordCollidesWithConnector(connectorTemplateText: string, keywordParts: string[]): boolean {
  return keywordParts.some((part) => {
    const core = part.replace(/^(การ|ความ)/, '');
    return shareSubstring(core, connectorTemplateText, 4);
  });
}

// เกณฑ์ตรวจความ "ฟังเป็นธรรมชาติ" ของประโยคที่ประกอบเสร็จแล้วก่อนคืนผลลัพธ์จริง — เป็น
// heuristic ที่ตรวจได้จริงด้วยโค้ด (ไม่ใช่การเข้าใจภาษาธรรมชาติจริง): ไม่มีคำซ้ำติดกันที่
// เกิดจากการต่อ template ผิดจังหวะ และความยาวไม่ล้นจนอ่านเหนื่อย
const AWKWARD_PATTERNS = [/เรื่องเรื่อง/, /การการ/, /ความความ/, /และและ/];
const MAX_BODY_LENGTH = 260;

function isAwkward(body: string): boolean {
  if (body.length > MAX_BODY_LENGTH) return true;
  return AWKWARD_PATTERNS.some((pattern) => pattern.test(body));
}

// ประกอบคำตีความ 1 ไพ่ จากข้อมูลไพ่ที่มีอยู่แล้ว (thaiName, upright/reversed, quote)
// ผสมกับ template แบบสุ่ม — ไม่มีข้อความ hardcode ต่อไพ่/หัวข้อแยกกัน 170+ ชุด ก่อนคืนค่า
// จริงจะลองประกอบใหม่ (สุ่ม opener/connector/keyword ใหม่ทั้งชุด) สูงสุด 5 รอบ ถ้ารอบ
// ไหนมี keyword ชนคำใน connector หรือฟังแปลกตามเกณฑ์ข้างบน
export function composeInterpretation(
  card: TarotCard,
  reversed: boolean,
  topicId: TopicId,
  positionLabel: string
): Interpretation {
  const pool = reversed ? card.reversed : card.upright;
  const connectors = reversed ? CONNECTORS_REVERSED : CONNECTORS_UPRIGHT;

  // สำคัญ: ต้องกำหนด body ทุกรอบ (ไม่ใช้ continue ข้ามทิ้งเฉย ๆ) ไม่งั้นถ้าทุกรอบชนกัน
  // หมดจะเหลือ body เป็นค่าว่าง — รอบสุดท้ายเสมอมีค่าเก็บไว้เป็น fallback ที่ปลอดภัยกว่า
  let body = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const opener = pickRandom(OPENERS)(card.thaiName, positionLabel);
    const keywordParts = pickKeywordParts(pool);
    const connectorFn = pickRandom(connectors[topicId]);
    const collides = keywordCollidesWithConnector(connectorFn(''), keywordParts);

    const connector = connectorFn(joinKeywordParts(keywordParts));
    body = `${opener} ${connector}`;
    if (!collides && !isAwkward(body)) break;
  }

  return { body, quote: card.quote };
}
