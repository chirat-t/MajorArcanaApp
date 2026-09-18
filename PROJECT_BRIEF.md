# Major Arcana: 22 เส้นทาง — Project Brief

โปรเจครายวิชา: แอปมือถือสาธิตการใช้งาน UI Component จาก React Native Paper
**สร้างด้วย:** React Native + TypeScript + React Native Paper

---

## 1. โจทย์และเป้าหมาย

สร้างแอปอย่างง่ายเพื่อสาธิตการนำไปใช้งานและการปรับแต่ง (customization) ของ 5 คอมโพเนนต์:

- `ActivityIndicator`
- `Appbar`
- `Avatar`
- `Badge`
- `Banner`

**แนวคิดแอป:** แอปไพ่ยิปซี Major Arcana 22 ใบ (0–21) ตีความใหม่เป็นโลกของตัวละคร 4 ตัว: The Fool (นักเดินทาง), The Magician (ผู้เปลี่ยนแปลง), The Empress (ผู้สร้าง), The Hermit (ผู้สังเกต)

**Deliverable ปลายทาง:** ไฟล์ PDF รายงาน ประกอบด้วย Screen Capture จริง + คำอธิบายที่มาและการปรับแต่งของแต่ละคอมโพเนนต์

---

## 2. Component Mapping ต่อหน้าจอ

| หน้าจอ | คอมโพเนนต์ | การใช้งาน |
|---|---|---|
| **Home** | `Appbar` | ชื่อแอป + ไอคอน Collection |
| | `Badge` | จำนวนไพ่ที่เปิดแล้ว เช่น "5/22" ติดที่ไอคอน |
| | `Banner` | ข้อความต้อนรับ/คำแนะนำครั้งแรก มีปุ่ม action ("เริ่มเลย") + ปุ่มปิด (dismissible) |
| **Loading (สับไพ่)** | `ActivityIndicator` | แสดงระหว่างจำลองการสับไพ่ก่อนเปิดผล (~1 วิ) ซ้อนบนภาพหลังไพ่ |
| **Card Detail** | `Appbar` | ปุ่มย้อนกลับ (BackAction) + ชื่อไพ่ + ปุ่ม action ขวามือ (เช่น บันทึก/favorite) |
| | `Avatar` | รูปวงกลมตัวละครประจำไพ่ตรงกลางจอ |
| **Collection** | `Badge` | ป้าย "ใหม่" บนไพ่ที่ยังไม่เคยเปิด, เครื่องหมาย ✓ บนไพ่ที่เคยดูแล้ว |
| | `Avatar` | ไอคอนตัวละครทั้ง 4 ตัวในแท็บ "ตัวละคร" |

---

## 3. โครงสร้างข้อมูล (TypeScript)

```typescript
// types.ts
export type CharacterId = "boy" | "witch" | "reaper" | "alchemist" | "dog" | "cat" | "crow";

export interface TarotCard {
  id: string;                 // slug เช่น "the-fool"
  number: number;             // 0-21
  numeral: string;            // "0", "I", "II", ... "XXI"
  name: string;               // "THE FOOL"
  thaiName: string;           // "ผู้เริ่มต้น"
  character: CharacterId[];   // ตัวละคร/สัตว์คู่หูที่ปรากฏในไพ่ใบนี้
  role: string;
  meaning: string[];
  symbols: string[];
  quote: string;              // แสดงกึ่งกลาง ไม่มีกรอบ ในหน้า Card Detail
  upright: string[];          // ความหมายด้านตั้ง
  reversed: string[];         // ความหมายด้านกลับ
  story: string;              // เนื้อเรื่องประกอบไพ่ใบนี้
  image: string;              // path รูปเต็มใบ
}

export interface CharacterArc {
  id: CharacterId;
  name: string;                // "เด็กชาย"
  archetype: string;           // "The Journey"
  represents: string;
  arcSummary: string;          // "เริ่มต้น → ออกเดินทาง → ..."
  avatar: string;
}

// สถานะผู้ใช้ — แยกจากข้อมูลไพ่แบบ static เพื่อให้สลับ deck/theme ได้โดยไม่พ่วงสถานะ
export interface UserCardProgress {
  cardId: string;
  isViewed: boolean;           // ใช้กับ Badge "ใหม่" / เครื่องหมาย ✓ ใน Collection
  viewedAt?: string;
}

// รองรับหลายธีม/เดคไพ่ในอนาคต
export interface TarotTheme {
  id: string;
  name: string;
  colors: { background: string; cardBg: string; gold: string; parchment: string };
  cardBackImage: string;
  fontDisplay: string;
}

export interface TarotDeck {
  id: string;
  name: string;
  themeId: string;
  cards: TarotCard[];
}
```

**สถาปัตยกรรมรองรับหลายธีม:** เก็บ `activeDeckId` ไว้ใน Context/state เดียว ครอบทั้งแอปด้วย `ThemeProvider` ที่อ่านค่านี้แล้วส่งสี/ฟอนต์/รูปหลังไพ่ให้ทุกหน้าจอผ่าน Context — คอมโพเนนต์ที่ทำไว้แล้ว (Appbar, Banner, Badge, Avatar) ไม่ต้องแก้โค้ด แค่ดึงค่าจาก theme context แทนการ hardcode สี

---

## 4. ข้อมูลไพ่ 22 ใบ — ✅ ครบสมบูรณ์แล้ว

ข้อมูลไพ่ทั้ง 22 ใบ (Major Arcana มาตรฐาน 0–21 ตีความใหม่เป็นโลกของตัวละคร 4 ตัว) กรอกครบทุกฟิลด์แล้ว — อยู่ที่ `src/data/cards.ts` (ตรวจสอบ syntax และความครบถ้วนด้วย Node แล้ว: id ไม่ซ้ำ 22 ใบ, มี `numeral` + `image` ครบทุกใบ)

**Story arc ของตัวละครหลัก 4 ตัว** (อยู่ที่ `src/data/characters.ts`):

| ตัวละคร | Archetype | พัฒนาการตลอดเรื่อง |
|---|---|---|
| เด็กชาย | The Journey | เริ่มต้น → ออกเดินทาง → เผชิญโลก → ค้นพบความสุข |
| แม่มดน้อย | The Mystery | ความลับ → การเรียนรู้ → ความกลัว → ความหวัง → ความเข้าใจ |
| ยมทูต | The Change | เวลา → การตัดสินใจ → การเปลี่ยนแปลง → การปล่อยวาง → การตื่นรู้ |
| นักเล่นแร่แปรธาตุ | The Creation | ทดลอง → เรียนรู้ → สร้าง → ล้มเหลว → เข้าใจสมดุล |

หมายเหตุ: ไพ่ **Death** (XIII) ตั้งใจสื่อถึง *Transformation / การเปลี่ยนผ่าน* ไม่ใช่เหตุร้าย — คงโทนนี้ไว้ตอนใช้ใน Card Detail

รายชื่อไพ่ทั้ง 22 ใบ (เรียงตามลำดับใน `cards.ts`):

| # | ชื่อ (EN) | ชื่อไทย | ตัวละครหลักในเรื่อง |
|---|---|---|---|
| 0 | The Fool | ผู้เริ่มต้น | เด็กชาย + หมา |
| I | The Magician | ผู้สร้าง | นักเล่นแร่แปรธาตุ |
| II | The High Priestess | ผู้รู้ความลับ | แม่มดน้อย + แมว |
| III | The Empress | ผู้ให้กำเนิด | แม่มดน้อย + แมว |
| IV | The Emperor | ผู้วางกฎ | นักเล่นแร่แปรธาตุ |
| V | The Hierophant | ผู้ถ่ายทอดความรู้ | นักเล่นแร่แปรธาตุ + แม่มดน้อย |
| VI | The Lovers | ทางเลือกและความผูกพัน | เด็กชาย + แม่มดน้อย + หมา + แมว |
| VII | The Chariot | ผู้มุ่งไปข้างหน้า | เด็กชาย + หมา |
| VIII | Strength | พลังจากภายใน | แม่มดน้อย + แมว |
| IX | The Hermit | ผู้ค้นหาคำตอบ | ยมทูต + อีกา |
| X | Wheel of Fortune | วงล้อแห่งโชคชะตา | ทั้ง 4 ตัวละคร |
| XI | Justice | ผู้ตัดสิน | ยมทูต |
| XII | The Hanged Man | ผู้มองโลกต่างมุม | ยมทูต |
| XIII | Death | ผู้ปิดฉาก | ยมทูต + อีกา |
| XIV | Temperance | ผู้สร้างสมดุล | นักเล่นแร่แปรธาตุ |
| XV | The Devil | สิ่งที่ผูกมัด | แม่มดน้อย + ยมทูต |
| XVI | The Tower | การพังทลาย | นักเล่นแร่แปรธาตุ + เด็กชาย + แม่มดน้อย + ยมทูต |
| XVII | The Star | ความหวัง | แม่มดน้อย + แมว |
| XVIII | The Moon | ผู้เผชิญภาพลวงตา | แม่มดน้อย + แมว |
| XIX | The Sun | แสงสว่าง | เด็กชาย + หมา |
| XX | Judgement | การตื่นรู้ | ทั้ง 4 ตัวละคร |
| XXI | The World | จุดหมายแห่งการเดินทาง | ทั้ง 4 ตัวละคร + สัตว์คู่หูทั้งหมด |

---

## 5. สเปกหน้าจอ (Screens)

### 5.1 Home Screen
- Appbar: ชื่อแอป "Major Arcana" + ไอคอน Collection (มี Badge "5/22" ทับ)
- Banner: ข้อความ "แตะไพ่เพื่อเริ่มการเดินทาง" + ปุ่ม action "เริ่มเลย" + ปุ่มปิด (ปิดได้ครั้งเดียว)
- Grid ไพ่ 22 ใบ ปิดหน้า (แสดงเลขโรมัน)
- Bottom tab: Home / Collection / Profile

### 5.2 Loading Screen (สับไพ่)
- แสดงเมื่อกดไพ่ใบใดใบหนึ่ง ก่อนเปิดผล ~1 วินาที
- พื้นหลังการ์ด: รูปหลังไพ่จริง (ธีมดวงจันทร์-ดวงอาทิตย์-ดาว ตามภาพอ้างอิงที่ให้ไว้) ขนาด ~150x220
- `ActivityIndicator` วงกลมหมุนสีทอง ซ้อนตรงกลางการ์ด — **หมายเหตุ:** ActivityIndicator ของ React Native เป็น native spinner วงกลมเท่านั้น ไม่มีโหมดแนวนอน (แนวนอนคือ `ProgressBar` ซึ่งเป็นคนละคอมโพเนนต์ ไม่อยู่ในโจทย์)
- ข้อความ "กำลังสับไพ่..." + คำบรรยายรอง

### 5.3 Card Detail Screen
- Appbar: ปุ่มย้อนกลับ + ชื่อไพ่ (EN) + ปุ่ม action ขวา (favorite/save)
- Avatar วงกลม (~120px) รูปตัวละครประจำไพ่ ขอบทอง
- ชื่อไพ่ (Cinzel/serif) + ชื่อไทยใต้ชื่อ
- **คำโปรย:** ข้อความอิตาลิก กึ่งกลาง ไม่มีกรอบ ไม่มีป้ายกำกับ วางระหว่างชื่อกับรายละเอียด
- รายละเอียด: แต่ละหัวข้อ (ตัวละคร / บทบาท / ความหมาย / สัญลักษณ์) แยกเป็นกรอบของตัวเอง มีไอคอนวงกลมด้านซ้าย, label เล็กด้านบน, ค่าด้านล่างในกรอบเดียวกัน
- ปุ่ม "สุ่มไพ่ใหม่" ด้านล่างสุด (กดแล้วเข้า Loading Screen อีกครั้ง)

### 5.4 Collection Screen
- Appbar: "คอลเลกชันของฉัน" + จำนวน "5/22"
- Tabs: "ไพ่ที่เคยดูแล้ว" / "ตัวละคร"
- Grid การ์ด 3 คอลัมน์ — แต่ละใบมีกรอบลายไพ่ (ไม่ใช่วงกลม Avatar), badge "ใหม่" (ยังไม่เคยดู) หรือ ✓ (เคยดูแล้ว)
- **กดที่การ์ดใบไหนก็ได้ → เปิด modal แสดงไพ่เต็มใบ** (กรอบทอง, เลขโรมันด้านบน, พื้นที่ภาพเต็ม, แถบชื่อ+บทบาทด้านล่างในกรอบเดียวกัน) — จุดนี้ต่างจาก Avatar วงกลมใน Card Detail ที่เห็นแค่ส่วนหนึ่งของภาพ
- Bottom tab เหมือน Home มี dot แจ้งเตือนที่ไอคอน Collection

---

## 6. Design Tokens (จาก UI Mockup)

```css
--bg-page:    #0B1120;   /* พื้นหลังนอกสุด */
--bg-phone:   #0E1526;   /* พื้นหลังจอ */
--bg-card:    #151E33;   /* การ์ด/พื้นผิวหลัก */
--bg-card-2:  #1B2740;   /* พื้นผิวรอง เช่น banner, chip */
--gold:       #C9A24B;   /* สี accent หลัก (ปุ่ม, ไอคอน, ขอบ) */
--gold-dim:   #8A733A;   /* ขอบ/เส้นรอง */
--parchment:  #EDE3C8;   /* ข้อความหลัก (สีขาวนวล) */
--ink:        #B9C0D4;   /* ข้อความรอง */
--ink-dim:    #7C859E;   /* ข้อความ hint/caption */
--purple:     #6E5CC7;   /* accent ที่สอง — ใช้กับ badge "ใหม่"/notification dot */
--border:     #2A3550;
```

ฟอนต์: **Cinzel** (serif, หัวเรื่อง/ชื่อไพ่) + **Noto Sans Thai** (เนื้อหา)

---

## 7. Assets ที่ต้องเตรียม

- `assets/cards/00-the-fool.png` ... `21-the-world.png` — ภาพเต็มใบทั้ง 22 ใบ (path ตรงกับฟิลด์ `image` ใน `cards.ts` แล้ว)
- `assets/card-back.png` — รูปหลังไพ่ (มีให้แล้ว: ธีมดวงจันทร์-ดวงอาทิตย์-ดาว)
- `assets/characters/` — รูป Avatar ของตัวละครทั้ง 4 ตัว: `boy.png`, `witch.png`, `reaper.png`, `alchemist.png` (path ตรงกับฟิลด์ `avatar` ใน `characters.ts` แล้ว)

---

## 8. โครงสร้างโปรเจคที่แนะนำ

```
src/
  types.ts
  theme.ts
  data/
    cards.ts          # ข้อมูลไพ่ 22 ใบ
    characters.ts      # ข้อมูลตัวละคร 4 ตัว
  context/
    ThemeContext.tsx
    CollectionContext.tsx   # เก็บสถานะ isViewed ของแต่ละใบ
  screens/
    HomeScreen.tsx
    LoadingScreen.tsx  # หรือรวมเป็น modal ใน HomeScreen
    CardDetailScreen.tsx
    CollectionScreen.tsx
  components/
    CardGridItem.tsx
    CardModal.tsx
    InfoRow.tsx
  navigation/
    AppNavigator.tsx
  assets/
    cards/
    characters/
    card-back.png
```

---

## 9. ขั้นตอนการพัฒนา

1. ติดตั้งโปรเจกต์ (Expo) + `react-native-paper` + React Navigation
2. ~~สร้าง `types.ts` + ข้อมูลไพ่ 22 ใบ~~ ✅ เสร็จแล้ว — ใช้ไฟล์ `src/types.ts`, `src/data/cards.ts`, `src/data/characters.ts` ที่แนบมาได้เลย
3. สร้าง Home Screen (Appbar, Banner, ActivityIndicator ตอนโหลดข้อมูล)
4. สร้าง Loading/สับไพ่ (ActivityIndicator ซ้อนบน card-back)
5. สร้าง Card Detail Screen (Avatar, Appbar.Action, กรอบรายละเอียด)
6. สร้าง Collection Screen (Badge, Tabs, Modal ดูไพ่เต็มใบ)
7. เตรียม/ใส่ assets จริง (ภาพไพ่ 22 ใบ, รูปหลังไพ่, avatar ตัวละคร 4 ตัว) ตาม path ที่กำหนดไว้ในข้อมูล
8. Capture หน้าจอจริง + เขียนรายงาน PDF พร้อมคำอธิบายที่มาของแต่ละคอมโพเนนต์

---

## 10. หมายเหตุสำหรับ Claude Code

- ไฟล์ข้อมูลจริงที่แนบมาพร้อมใช้งาน: `src/types.ts`, `src/data/cards.ts` (22 ใบครบ ตรวจ syntax แล้ว), `src/data/characters.ts` (4 ตัวละคร)
- โค้ด mockup ก่อนหน้านี้ทำเป็น HTML preview ไว้ที่ `tarot_app_ui_mockup.html` (มีทั้ง 4 หน้าจอ + modal ดูไพ่เต็มใบ) ใช้เป็นแนวอ้างอิง layout/สีได้เลย
- ข้อมูลไพ่ทุกใบมีทั้ง `upright`/`reversed`/`story` เผื่อขยายฟีเจอร์ในอนาคต (เช่น โหมดสุ่มไพ่ตั้ง/กลับ) แต่หน้า Card Detail ปัจจุบันตามสเปกใช้แค่ `meaning`, `symbols`, `quote`, `role`, `character`
- `isViewed`/`viewedAt` อยู่ใน `UserCardProgress` แยกจาก `TarotCard` โดยตั้งใจ — เก็บ state นี้แยกต่างหาก (Context/AsyncStorage) ไม่ผสมเข้ากับข้อมูลไพ่แบบ static
- เน้นให้ทุกคอมโพเนนต์ทั้ง 5 ตัวมีการ "ปรับแต่ง" ที่ชัดเจน ไม่ใช่แค่ default props เพราะเป็นเกณฑ์หลักของโจทย์
