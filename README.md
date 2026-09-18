# Major Arcana: 22 เส้นทาง

แอปมือถือสาธิตการใช้งาน UI Component จาก React Native Paper
(`ActivityIndicator`, `Appbar`, `Avatar`, `Badge`, `Banner`)
สเปกทั้งหมดอยู่ใน [PROJECT_BRIEF.md](./PROJECT_BRIEF.md)

## เริ่มใช้งาน

```bash
npm install
npm start      # หรือ npm run android / npm run ios / npm run web
```

## Stack

| แพ็กเกจ | เวอร์ชัน | หมายเหตุ |
|---|---|---|
| Expo | ~57.0.21 | template `blank-typescript` |
| React Native | 0.86.3 | |
| react-native-paper | ^5.15.3 | ไอคอนใช้ `@expo/vector-icons` (MaterialCommunityIcons) |
| @react-navigation/native + native-stack + bottom-tabs | ^7 | พร้อม `react-native-screens`, `react-native-safe-area-context` |
| @react-native-async-storage/async-storage | 2.2.0 | persist สถานะไพ่ที่เปิดแล้ว/บันทึกไว้ |
| @expo-google-fonts/cinzel, @expo-google-fonts/noto-sans-thai | ^0.4.2 | ฟอนต์หัวเรื่อง (Cinzel) และเนื้อหาไทย (Noto Sans Thai) |
| expo-font, expo-splash-screen | ~57.0.3, ~57.0.8 | โหลดฟอนต์ก่อนเปิดหน้าแรก (App.tsx) |

## โครงสร้างโปรเจกต์

ตาม PROJECT_BRIEF.md ข้อ 8

```
App.tsx                 # PaperProvider + SafeAreaProvider + AppNavigator
src/
  types.ts              # TarotCard, CharacterArc, UserCardProgress, TarotTheme, TarotDeck
  theme.ts              # design tokens (ข้อ 6) + paperTheme + defaultTarotTheme
  data/
    cards.ts            # ข้อมูลไพ่ 22 ใบ (0-21)
    characters.ts       # ตัวละคร 4 ตัว
  context/              # ThemeContext.tsx, CollectionContext.tsx
  screens/              # Home, Loading, CardDetail, Collection, CharacterDetail
  components/           # CardBack, CardGridItem, CardModal, CharacterAvatar, InfoRow
  navigation/
    AppNavigator.tsx
  assets/
    cards/              # 00-the-fool.jpg ... 21-the-world.jpg (22 ใบ, ไฟล์จริง)
    characters/         # boy.jpg, witch.jpg, reaper.jpg, alchemist.jpg (avatar, ไฟล์จริง)
      portraits/        # boy.jpg, witch.jpg, reaper.jpg, alchemist.jpg (พอร์เทรตใหญ่,
                         # ตอนนี้เป็นสำเนาของ avatar — รอไฟล์จริงมาวางทับ)
    card-back.jpg       # รูปหลังไพ่ (ไฟล์จริง)
    cover.jpg           # พื้นหลังหน้า Home (placeholder gradient, รอไฟล์จริง)
    loading-bg.jpg      # พื้นหลังหน้า Loading/สับไพ่ (placeholder gradient, รอไฟล์จริง)
    cardImages.ts       # แมป card.id -> require() ภาพจริง (Metro ต้องการ literal require)
    characterImages.ts  # แมป CharacterId -> { avatar, portrait } require()
    backgroundImages.ts # require() ของ cover.jpg / loading-bg.jpg
assets/                 # ไอคอน/splash ของแอป (Expo ต้องการที่ root ตาม app.json)
```

## สถานะ

- [x] 1. ติดตั้งโปรเจกต์ Expo + react-native-paper + React Navigation
- [x] 2. `types.ts` + ข้อมูลไพ่ 22 ใบ + ตัวละคร 4 ตัว
- [x] 3. Home Screen (Appbar + Badge, Banner, Grid 22 ใบ, Bottom tab)
- [x] 4. Loading Screen (สับไพ่ ~1 วิ + ActivityIndicator ซ้อนหลังไพ่)
- [x] 5. Card Detail (Appbar.BackAction + Avatar + คำโปรย + InfoRow + สุ่มไพ่ใหม่)
- [x] 6. Collection (Tabs, Grid 3 คอลัมน์, Badge ใหม่/✓, Modal ไพ่เต็มใบ)
- [x] 7. ใส่ assets จริง (ภาพไพ่ 22 ใบ, หลังไพ่, avatar 4 ตัวละคร) + ฟอนต์ Cinzel/Noto Sans Thai
- [ ] 8. Capture หน้าจอ + รายงาน PDF

หมายเหตุการพัฒนา:

- สถานะไพ่ที่เปิดแล้วและรายการที่บันทึกไว้ persist ด้วย AsyncStorage
  (`@major-arcana/progress`, `@major-arcana/favorites`) อ่าน/เขียนที่
  `CollectionContext` ที่เดียว
- Flow: แตะไพ่ → `Loading` (สับไพ่ ~1 วิ) → `replace` ไป `CardDetail`
  ปุ่มย้อนกลับจึงกลับ Home ไม่ย้อนไปหน้าสับไพ่
- หลังไพ่: `CardBack.tsx` ใช้ `ImageBackground` กับ `assets/card-back.jpg` จริง
  เลขโรมันวางเป็น pill ทึบแสงด้านล่างการ์ด (ไม่ทับลายกลางการ์ด)
- Avatar: `CharacterAvatar.tsx` ใช้ `Avatar.Image` กับรูปจริง 4 ตัวละคร
  (boy/witch/reaper/alchemist) — สัตว์คู่หู (dog/cat/crow) ยังไม่มี asset
  จึง fallback เป็น `Avatar.Icon` อัตโนมัติเมื่อไม่พบรูปใน `characterImages.ts`
- CardModal ใช้ภาพไพ่จริงเต็มใบ (`cardImages.ts`) แทน placeholder เดิม
- CharacterDetailScreen แสดงภาพ **portrait** (ไม่ใช่ avatar) แบบสี่เหลี่ยม
  เต็มพื้นที่ (ไม่ใช่วงกลม) — `characterImages.ts` แยก `avatar`/`portrait`
  คนละ field ต่อตัวละครแล้ว
- ⚠️ `src/assets/characters/portraits/*.jpg` ตอนนี้เป็น **สำเนาของ avatar**
  ไปก่อน (ยังไม่มีภาพพอร์เทรตแยก) — อัปเกรดได้ทันทีโดยเอาไฟล์จริงไปวางทับ
  ที่ path เดิม ใช้ชื่อไฟล์เดิมทุกตัว ไม่ต้องแก้โค้ดเลย:
  `src/assets/characters/portraits/{boy,witch,reaper,alchemist}.jpg`
- ⚠️ `src/assets/cover.jpg` (พื้นหลังหน้า Home) และ `src/assets/loading-bg.jpg`
  (พื้นหลังหน้า Loading) ตอนนี้เป็น **placeholder gradient ที่ generate จาก
  design tokens** ไปก่อน ไม่ใช่ภาพประกอบจริง — อัปเกรดได้ทันทีโดยเอาไฟล์จริง
  ไปวางทับที่ path เดิม (`src/assets/cover.jpg`, `src/assets/loading-bg.jpg`)
  ไม่ต้องแก้โค้ดเลยเช่นกัน (ดูคอมเมนต์ใน `backgroundImages.ts`)
- Collection: แท็บ "ไพ่ที่เคยดูแล้ว" วน 22 ใบจาก cards.ts — ใบที่เปิดแล้ว
  โชว์เลขโรมัน + ชื่อไทย + Badge ✓ แตะเปิด Modal ไพ่เต็มใบ, ใบที่ยังไม่เปิด
  โชว์ CardBack + Badge "ใหม่" และแตะไม่ได้
- FlatList สองแท็บต้องมี key คนละตัว ไม่งั้น React ใช้ instance เดิมซ้ำ
  แล้ว numColumns เปลี่ยนกลางคัน ซึ่ง React Native ไม่รองรับ
- Bottom tab มี 2 ปุ่ม: Home / Collection (ตัดแท็บ Profile ออกตามที่ตกลงกัน)
- แตะตัวละครในแท็บ "ตัวละคร" → `CharacterDetail` (ภาพเต็มตัว, ชื่อ + archetype,
  คำโปรย, บุคลิก, โทนสีหลัก)
- ⚠️ `quote` / `personality` / `colorPalette` ใน `characters.ts` ยังเป็นค่าตั้งต้น
  ที่ดึงจาก `cards.ts` และ design tokens ไม่ใช่ค่าจาก reference sheet ตัวจริง
  — รอแทนที่ใน `src/data/characters.ts` ไฟล์เดียว
- ฟอนต์: `App.tsx` โหลด Cinzel (400/600/700) + Noto Sans Thai (400/500/700)
  ด้วย `useFonts()` แล้วค้าง splash screen ไว้จนโหลดเสร็จ (กัน FOUT)
  ชื่อ family ที่ใช้จริงอยู่ที่ `src/theme.ts` (`fonts.display`, `fonts.body` ฯลฯ)
  — Cinzel เป็นฟอนต์ละตินล้วน ใช้กับหัวเรื่อง/ชื่อไพ่ภาษาอังกฤษ/เลขโรมันเท่านั้น
  ข้อความไทยทั้งหมดใช้ Noto Sans Thai; ปุ่ม/Badge ของ Paper เองรับฟอนต์ผ่าน
  `paperTheme.fonts` (configureFonts) ส่วน Text ที่กำหนด style เองต้องระบุ
  `fontFamily` ตรง ๆ (ทำไว้ครบทุกจุดที่มีข้อความแล้ว)
- Path รูปใน `cards.ts`/`characters.ts` เป็น string เอกสารประกอบเท่านั้น
  (`.jpg` ตรงกับไฟล์จริงแล้ว) โค้ดจริงที่ import รูปอยู่ที่ `cardImages.ts`/
  `characterImages.ts` เพราะ Metro ต้องการ `require()` แบบ literal string
  แมปจาก id ไม่สามารถสร้าง path แบบ dynamic ได้
- บั๊กที่เจอตอน wiring รูป: react-native-web คำนวณความสูงของ `<Image>`
  ผิดพลาดเมื่อพึ่ง `aspectRatio` ร่วมกับ `width:'100%'` ในบริบท flex ที่ซ้อน
  กันหลายชั้น (Modal ที่ centered) — แก้โดยใช้ `ImageBackground` (เหมือน
  CardBack) หรือกำหนดพิกเซลตรง ๆ แทน (ดู `CardModal.tsx`)
