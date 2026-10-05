// เทสต์ Security Rules กับ Firestore Emulator (ฟรี ไม่ต้องใช้โปรเจกต์จริง/Blaze)
// รันผ่าน: npm run test:rules  (firebase emulators:exec ตั้ง FIRESTORE_EMULATOR_HOST ให้)
// ถ้าไม่มี emulator จะข้ามทั้งชุดพร้อมบอกเหตุผล
import { appendFileSync, readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const PROJECT_ID = 'demo-tarot';
const ALICE = 'alice';
const BOB = 'bob';

let env;
const results = [];

before(async () => {
  if (!hasEmulator) return;
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

// เริ่มทุกเคสจากฐานข้อมูลว่าง + stats/global แบบเดียวกับที่สร้างใน Console
// (totalReadings เป็น int 0, cardCounts เป็น map ว่าง — JS SDK เขียนเลขจำนวนเต็มเป็น integerValue)
beforeEach(async () => {
  if (!hasEmulator) return;
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'stats/global'), { totalReadings: 0, cardCounts: {} });
  });
});

after(async () => {
  if (env) await env.cleanup();
  if (!hasEmulator) return;
  const passed = results.filter((r) => r.ok).length;
  const lines = [
    `### Firestore rules tests: ${passed}/${results.length} passed`,
    '',
    '| # | กรณี | คาดหวัง | ผล |',
    '|---|---|---|---|',
    ...results.map((r, i) => `| ${i + 1} | ${r.name} | ${r.expect} | ${r.ok ? 'ผ่าน' : 'ไม่ผ่าน'} |`),
  ];
  console.log('\n' + lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
});

// ลงทะเบียนเคส: expect = 'allow' | 'deny' และเก็บผลลงตารางสรุป
function check(name, expect, fn) {
  test(`${name} (${expect})`, { skip: hasEmulator ? false : 'ไม่มี FIRESTORE_EMULATOR_HOST — รันผ่าน npm run test:rules' }, async () => {
    try {
      await fn();
      results.push({ name, expect, ok: true });
    } catch (error) {
      results.push({ name, expect, ok: false });
      throw error;
    }
  });
}

const as = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

const validUser = (extra = {}) => ({
  viewed: {},
  favorites: [],
  updatedAt: serverTimestamp(),
  schemaVersion: 1,
  ...extra,
});

const THREE = {
  topicId: 'love',
  cardIds: ['the-fool', 'the-star', 'death'],
  reversed: [false, true, false],
  positionIds: ['self', 'other', 'trend'],
};
const DAILY = { topicId: 'daily', cardIds: ['the-sun'], reversed: [false], positionIds: ['today'] };

// batch เดียวกับที่แอปจะเขียนตอนดูดวง: reading ใหม่ + users/{uid}.lastReading* + stats +1
// overrides ใช้ทำเคสโจมตี เช่น เปลี่ยนจำนวนที่เพิ่ม หรือเพิ่มไพ่ที่ไม่อยู่ใน reading
function readingBatch(db, uid, reading, opts = {}) {
  const id = opts.id ?? doc(collection(db, `users/${uid}/readings`)).id;
  const batch = writeBatch(db);
  batch.set(doc(db, `users/${opts.readingOwner ?? uid}/readings/${id}`), { ...reading, createdAt: serverTimestamp() });
  if (!opts.skipUser) {
    batch.set(
      doc(db, `users/${uid}`),
      validUser({ lastReadingId: id, lastReadingAt: serverTimestamp() }),
      { merge: true }
    );
  }
  if (!opts.skipStats) {
    const by = opts.by ?? 1;
    const counts = {};
    for (const c of opts.countCards ?? reading.cardIds) counts[`cardCounts.${c}`] = increment(by);
    batch.update(doc(db, 'stats/global'), { totalReadings: increment(opts.totalBy ?? 1), ...counts });
  }
  return { batch, id };
}

// ตั้ง lastReadingAt ของผู้ใช้ให้เก่ากว่า cooldown (จำลองว่าดูดวงครั้งก่อนเมื่อ 30 วินาทีที่แล้ว)
async function seedPastReading(uid) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `users/${uid}`), {
      viewed: {},
      favorites: [],
      updatedAt: Timestamp.now(),
      schemaVersion: 1,
      lastReadingId: 'old0000000000000000a',
      lastReadingAt: Timestamp.fromMillis(Date.now() - 30_000),
    });
  });
}

// ---------- users/{uid}: เจ้าของเท่านั้น ----------
check('เจ้าของสร้างเอกสารผู้ใช้ของตัวเอง', 'allow', async () => {
  await assertSucceeds(setDoc(doc(as(ALICE), `users/${ALICE}`), validUser()));
});
check('เจ้าของอ่านเอกสารผู้ใช้ของตัวเอง', 'allow', async () => {
  await seedPastReading(ALICE);
  await assertSucceeds(getDoc(doc(as(ALICE), `users/${ALICE}`)));
});
check('ผู้ใช้อื่นอ่านเอกสารของคนอื่น', 'deny', async () => {
  await seedPastReading(ALICE);
  await assertFails(getDoc(doc(as(BOB), `users/${ALICE}`)));
});
check('ผู้ใช้อื่นเขียนเอกสารของคนอื่น', 'deny', async () => {
  await assertFails(setDoc(doc(as(BOB), `users/${ALICE}`), validUser()));
});
check('ไม่ล็อกอินเขียนเอกสารผู้ใช้', 'deny', async () => {
  await assertFails(setDoc(doc(as(null), `users/${ALICE}`), validUser()));
});
check('list คอลเลกชัน users ทั้งหมด', 'deny', async () => {
  await assertFails(getDocs(collection(as(ALICE), 'users')));
});
check('ลบเอกสารผู้ใช้ของตัวเอง', 'deny', async () => {
  await seedPastReading(ALICE);
  await assertFails(deleteDoc(doc(as(ALICE), `users/${ALICE}`)));
});

// ---------- users/{uid}: รูปแบบข้อมูล ----------
check('มี field แปลกปลอม', 'deny', async () => {
  await assertFails(setDoc(doc(as(ALICE), `users/${ALICE}`), validUser({ isAdmin: true })));
});
check('favorites มี id ไพ่ที่ไม่มีจริง', 'deny', async () => {
  await assertFails(setDoc(doc(as(ALICE), `users/${ALICE}`), validUser({ favorites: ['the-joker'] })));
});
check('viewed มี key ไพ่ที่ไม่มีจริง', 'deny', async () => {
  await assertFails(setDoc(doc(as(ALICE), `users/${ALICE}`), validUser({ viewed: { 'not-a-card': 'x' } })));
});
check('favorites เกิน 22 รายการ', 'deny', async () => {
  const many = Array.from({ length: 23 }, () => 'the-fool');
  await assertFails(setDoc(doc(as(ALICE), `users/${ALICE}`), validUser({ favorites: many })));
});
check('updatedAt เป็นเวลาฝั่ง client ไม่ใช่ serverTimestamp', 'deny', async () => {
  await assertFails(setDoc(doc(as(ALICE), `users/${ALICE}`), validUser({ updatedAt: Timestamp.now() })));
});
check('schemaVersion ไม่ใช่ 1', 'deny', async () => {
  await assertFails(setDoc(doc(as(ALICE), `users/${ALICE}`), validUser({ schemaVersion: 2 })));
});
check('ตั้ง lastReadingId โดยไม่ได้สร้าง reading จริง', 'deny', async () => {
  await assertFails(
    setDoc(doc(as(ALICE), `users/${ALICE}`), validUser({ lastReadingId: 'abcdefghijklmnopqrst', lastReadingAt: serverTimestamp() }))
  );
});

// ---------- การดูดวง (batch) ----------
check('ดูดวง 3 ใบ: reading + ผู้ใช้ + stats +1 ใน batch เดียว', 'allow', async () => {
  const db = as(ALICE);
  await assertSucceeds(readingBatch(db, ALICE, THREE).batch.commit());
  const stats = (await getDoc(doc(as(null), 'stats/global'))).data();
  if (stats.totalReadings !== 1 || stats.cardCounts['the-fool'] !== 1 || stats.cardCounts['the-star'] !== 1 || stats.cardCounts.death !== 1) {
    throw new Error('ค่าใน stats ไม่ตรง: ' + JSON.stringify(stats));
  }
});
check('โชควันนี้ 1 ใบ ด้วย id daily-YYYY-MM-DD', 'allow', async () => {
  await assertSucceeds(readingBatch(as(ALICE), ALICE, DAILY, { id: 'daily-2026-10-06' }).batch.commit());
});
check('สร้าง reading อย่างเดียวโดยไม่เพิ่ม stats', 'allow', async () => {
  await assertSucceeds(readingBatch(as(ALICE), ALICE, THREE, { skipStats: true }).batch.commit());
});
check('ดูดวงครั้งที่ 2 ภายใน 10 วินาที (cooldown)', 'deny', async () => {
  const db = as(ALICE);
  await assertSucceeds(readingBatch(db, ALICE, THREE).batch.commit());
  await assertFails(readingBatch(db, ALICE, THREE).batch.commit());
});
check('ดูดวงใหม่หลังครั้งก่อนเกิน 10 วินาที', 'allow', async () => {
  await seedPastReading(ALICE);
  await assertSucceeds(readingBatch(as(ALICE), ALICE, THREE).batch.commit());
});
check('โชควันนี้ id เดิมซ้ำ (หลังพ้น cooldown)', 'deny', async () => {
  const db = as(ALICE);
  await assertSucceeds(readingBatch(db, ALICE, DAILY, { id: 'daily-2026-10-06' }).batch.commit());
  await seedPastReading(ALICE);
  await assertFails(readingBatch(db, ALICE, DAILY, { id: 'daily-2026-10-06' }).batch.commit());
});
check('สร้าง reading โดยไม่อัปเดต lastReading ของผู้ใช้', 'deny', async () => {
  await assertFails(readingBatch(as(ALICE), ALICE, THREE, { skipUser: true, skipStats: true }).batch.commit());
});
check('เขียน reading ลงในพื้นที่ของผู้ใช้อื่น', 'deny', async () => {
  await assertFails(readingBatch(as(ALICE), ALICE, THREE, { readingOwner: BOB, skipStats: true }).batch.commit());
});
check('จำนวนไพ่ไม่ตรงหัวข้อ (ความรัก 1 ใบ)', 'deny', async () => {
  const bad = { ...THREE, cardIds: ['the-fool'], reversed: [false], positionIds: ['self'] };
  await assertFails(readingBatch(as(ALICE), ALICE, bad).batch.commit());
});
check('ไพ่ซ้ำกันใน reading เดียว', 'deny', async () => {
  const bad = { ...THREE, cardIds: ['the-fool', 'the-fool', 'death'] };
  await assertFails(readingBatch(as(ALICE), ALICE, bad, { skipStats: true }).batch.commit());
});
check('positionId ที่ไม่มีจริง', 'deny', async () => {
  const bad = { ...THREE, positionIds: ['self', 'other', 'future'] };
  await assertFails(readingBatch(as(ALICE), ALICE, bad).batch.commit());
});
check('topicId ที่ไม่มีจริง', 'deny', async () => {
  await assertFails(readingBatch(as(ALICE), ALICE, { ...THREE, topicId: 'money' }).batch.commit());
});
check('reading id รูปแบบไม่ถูกต้อง', 'deny', async () => {
  await assertFails(readingBatch(as(ALICE), ALICE, THREE, { id: 'hack!' }).batch.commit());
});
check('แก้ไข reading ที่สร้างแล้ว', 'deny', async () => {
  const db = as(ALICE);
  const { batch, id } = readingBatch(db, ALICE, THREE);
  await assertSucceeds(batch.commit());
  await assertFails(updateDoc(doc(db, `users/${ALICE}/readings/${id}`), { topicId: 'career' }));
});
check('เจ้าของอ่านประวัติของตัวเอง', 'allow', async () => {
  const db = as(ALICE);
  await assertSucceeds(readingBatch(db, ALICE, THREE).batch.commit());
  await assertSucceeds(getDocs(collection(db, `users/${ALICE}/readings`)));
});
check('ผู้ใช้อื่นอ่านประวัติของคนอื่น', 'deny', async () => {
  await assertSucceeds(readingBatch(as(ALICE), ALICE, THREE).batch.commit());
  await assertFails(getDocs(collection(as(BOB), `users/${ALICE}/readings`)));
});

// ---------- stats/global ----------
check('ไม่ล็อกอินอ่าน stats', 'allow', async () => {
  await assertSucceeds(getDoc(doc(as(null), 'stats/global')));
});
check('stats เพิ่มทีละ 2', 'deny', async () => {
  await assertFails(readingBatch(as(ALICE), ALICE, THREE, { by: 2 }).batch.commit());
});
check('totalReadings เพิ่มทีละ 2', 'deny', async () => {
  await assertFails(readingBatch(as(ALICE), ALICE, THREE, { totalBy: 2 }).batch.commit());
});
check('เพิ่มนับไพ่ที่ไม่อยู่ใน reading (สลับใบ)', 'deny', async () => {
  await assertFails(
    readingBatch(as(ALICE), ALICE, THREE, { countCards: ['the-fool', 'the-star', 'the-world'] }).batch.commit()
  );
});
// นับไพ่ใน reading ครบทุกใบถูกต้อง แต่แอบนับใบที่ 4 เพิ่ม — ต้องถูกจับโดย affectedKeys().hasOnly(ids)
check('นับไพ่ใน reading ครบแล้วแอบนับใบอื่นเพิ่ม', 'deny', async () => {
  await assertFails(
    readingBatch(as(ALICE), ALICE, THREE, { countCards: [...THREE.cardIds, 'the-world'] }).batch.commit()
  );
});
check('เพิ่ม stats โดยไม่มี reading ใหม่ใน batch', 'deny', async () => {
  await assertFails(updateDoc(doc(as(ALICE), 'stats/global'), { totalReadings: increment(1), 'cardCounts.the-fool': increment(1) }));
});
check('ลดค่า stats', 'deny', async () => {
  await assertFails(readingBatch(as(ALICE), ALICE, THREE, { by: -1, totalBy: -1 }).batch.commit());
});
check('รีเซ็ต totalReadings เป็น 0 ทับของเดิม', 'deny', async () => {
  await assertSucceeds(readingBatch(as(ALICE), ALICE, THREE).batch.commit());
  await assertFails(updateDoc(doc(as(BOB), 'stats/global'), { totalReadings: 0 }));
});
check('เพิ่ม field แปลกปลอมใน stats', 'deny', async () => {
  const db = as(ALICE);
  const { batch } = readingBatch(db, ALICE, THREE);
  batch.update(doc(db, 'stats/global'), { hacked: true });
  await assertFails(batch.commit());
});
check('ไม่ล็อกอินเพิ่ม stats', 'deny', async () => {
  await assertFails(updateDoc(doc(as(null), 'stats/global'), { totalReadings: increment(1) }));
});
check('ลบ stats/global', 'deny', async () => {
  await assertFails(deleteDoc(doc(as(ALICE), 'stats/global')));
});
check('สร้างเอกสารอื่นในคอลเลกชัน stats', 'deny', async () => {
  await assertFails(setDoc(doc(as(ALICE), 'stats/fake'), { totalReadings: 999, cardCounts: {} }));
});
