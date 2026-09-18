import type { ImageSourcePropType } from 'react-native';

// พื้นหลังบรรยากาศของแอป — ตอนนี้เป็น gradient เรียบ ๆ ที่ generate จาก
// design tokens ใน theme.ts ไปก่อน (ไม่ใช่ภาพประกอบจริง) เพื่อให้โค้ดวิ่งได้
// ครบและทดสอบเลย์เอาต์ได้ทันที
//
// อัปเกรดเป็นภาพจริงได้ทันทีโดยเอาไฟล์ไปวางทับที่ path ด้านล่าง ใช้ชื่อไฟล์เดิม
// ไม่ต้องแก้โค้ดไฟล์นี้หรือหน้าจอที่ใช้งานเลย:
//   src/assets/cover.jpg       — พื้นหลังหน้า Home (หน้าปกตอนเข้าเกม)
//   src/assets/loading-bg.jpg  — พื้นหลังหน้า Loading (ตอนสับไพ่)
export const coverImage: ImageSourcePropType = require('./cover.jpg');
export const loadingBackgroundImage: ImageSourcePropType = require('./loading-bg.jpg');
