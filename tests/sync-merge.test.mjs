// เทสต์กฎการรวมข้อมูลซิงก์ (ฟังก์ชันล้วน) และตรวจว่าเอกสารที่แอปจะเขียนผ่าน firestore.rules จริง
// ส่วนแรกรันด้วย Node ล้วน ๆ (Node 22.18+ รันไฟล์ .ts ที่ไม่มี import ได้โดยตัด type ออก)
// ส่วนหลังต้องมี Firestore emulator (npm run test:rules) ถ้าไม่มีจะข้ามพร้อมบอกเหตุผล
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';

import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import {
  MAX_FAVORITES,
  SCHEMA_VERSION,
  buildPayload,
  favoritesPolicy,
  mergeFavorites,
  mergeViewed,
  needsWrite,
  parseSyncMeta,
  progressToViewed,
  sanitizeCloudUser,
  viewedToProgress,
} from '../src/services/syncMerge.ts';

const CARD_IDS = [...readFileSync(new URL('../src/data/cards.ts', import.meta.url), 'utf8').matchAll(/^\s+id: "([^"]+)"/gm)].map((m) => m[1]);
const VALID = new Set(CARD_IDS);
const T1 = '2026-10-01T00:00:00.000Z';
const T2 = '2026-10-02T00:00:00.000Z';

describe('mergeViewed', () => {
  test('union ของสองฝั่ง ไม่ลดลง', () => {
    const merged = mergeViewed({ 'the-fool': T1 }, { death: T2 });
    assert.deepEqual(merged, { 'the-fool': T1, death: T2 });
  });
  test('ใบเดียวกัน เก็บเวลาที่ดูครั้งแรก (เก่ากว่า) ไม่ว่าอยู่ฝั่งไหน', () => {
    assert.equal(mergeViewed({ death: T2 }, { death: T1 }).death, T1);
    assert.equal(mergeViewed({ death: T1 }, { death: T2 }).death, T1);
  });
  test('คลาวด์มากกว่าในเครื่อง ผลต้องเป็นของคลาวด์ครบ', () => {
    const cloud = { 'the-fool': T1, death: T1, justice: T1 };
    assert.deepEqual(Object.keys(mergeViewed(cloud, { death: T2 })).sort(), Object.keys(cloud).sort());
  });
  test('เวลาที่อ่านไม่ได้ไม่ทำให้พัง', () => {
    assert.equal(mergeViewed({ death: 'bad' }, { death: T1 }).death, T1);
    assert.equal(mergeViewed({ death: T1 }, { death: 'bad' }).death, T1);
  });
});

describe('progress <-> viewed', () => {
  test('แปลงเฉพาะใบที่ดูแล้วและเป็น id ไพ่จริง', () => {
    const viewed = progressToViewed(
      {
        'the-fool': { cardId: 'the-fool', isViewed: true, viewedAt: T1 },
        death: { cardId: 'death', isViewed: false },
        'not-a-card': { cardId: 'not-a-card', isViewed: true, viewedAt: T1 },
      },
      VALID
    );
    assert.deepEqual(viewed, { 'the-fool': T1 });
  });
  test('ใบที่ไม่มี viewedAt ได้ค่าเวลาเป็นสตริง ISO', () => {
    const viewed = progressToViewed({ death: { cardId: 'death', isViewed: true } }, VALID);
    assert.ok(!Number.isNaN(Date.parse(viewed.death)));
  });
  test('viewedToProgress ได้รูปแบบเดียวกับที่แอปใช้', () => {
    assert.deepEqual(viewedToProgress({ death: T1 }), { death: { cardId: 'death', isViewed: true, viewedAt: T1 } });
  });
});

describe('sanitizeCloudUser', () => {
  test('ตัดข้อมูลผิดรูปแบบจากคลาวด์ทิ้ง', () => {
    const out = sanitizeCloudUser(
      { viewed: { death: T1, 'x-card': T1, justice: 123 }, favorites: ['death', 'death', 'x-card', 7] },
      VALID
    );
    assert.deepEqual(out, { viewed: { death: T1 }, favorites: ['death'] });
  });
  test('null/ชนิดผิด ได้ค่าว่าง', () => {
    assert.deepEqual(sanitizeCloudUser(null, VALID), { viewed: {}, favorites: [] });
    assert.deepEqual(sanitizeCloudUser({ viewed: [], favorites: 'x' }, VALID), { viewed: {}, favorites: [] });
  });
  test('favorites ไม่เกิน 22', () => {
    assert.ok(sanitizeCloudUser({ favorites: CARD_IDS.concat(CARD_IDS) }, VALID).favorites.length <= MAX_FAVORITES);
  });
});

describe('favorites policy', () => {
  test('ซิงก์ครั้งแรก → union', () => {
    assert.equal(favoritesPolicy(true, false), 'union');
    assert.equal(favoritesPolicy(true, true), 'union');
    assert.deepEqual(mergeFavorites(['a', 'b'], ['b', 'c'], 'union'), ['b', 'c', 'a']);
  });
  test('ซิงก์แล้วและมีการแก้ค้าง → ใช้ของในเครื่อง (รวมการยกเลิกบันทึก)', () => {
    assert.equal(favoritesPolicy(false, true), 'local');
    assert.deepEqual(mergeFavorites(['a'], ['a', 'b'], 'local'), ['a']);
  });
  test('ซิงก์แล้วและไม่มีอะไรค้าง → ใช้ของคลาวด์', () => {
    assert.equal(favoritesPolicy(false, false), 'cloud');
    assert.deepEqual(mergeFavorites([], ['a', 'b'], 'cloud'), ['a', 'b']);
  });
  test('union ไม่เกิน 22', () => {
    assert.equal(mergeFavorites(CARD_IDS, CARD_IDS, 'union').length, MAX_FAVORITES);
  });
});

describe('needsWrite / buildPayload', () => {
  const empty = { viewed: {}, favorites: [] };
  test('ยังไม่มีเอกสารบนคลาวด์ → ต้องเขียน', () => {
    assert.equal(needsWrite(false, empty, empty), true);
  });
  test('คลาวด์ครบแล้ว → ไม่ต้องเขียน', () => {
    const cloud = { viewed: { death: T1 }, favorites: ['death'] };
    assert.equal(needsWrite(true, cloud, { viewed: { death: T2 }, favorites: ['death'] }), false);
  });
  test('ในเครื่องมีไพ่ที่ดูแล้วที่คลาวด์ยังไม่มี → ต้องเขียน', () => {
    assert.equal(needsWrite(true, empty, { viewed: { death: T1 }, favorites: [] }), true);
  });
  test('favorites ต่างกัน → ต้องเขียน', () => {
    assert.equal(needsWrite(true, { viewed: {}, favorites: ['a'] }, { viewed: {}, favorites: [] }), true);
  });
  test('viewed ว่างและคลาวด์มีเอกสารแล้ว → ไม่ส่ง viewed (กัน merge แทนที่ทั้ง field)', () => {
    assert.equal('viewed' in buildPayload({}, ['death'], true), false);
    assert.deepEqual(buildPayload({}, ['death'], false).viewed, {});
    assert.deepEqual(buildPayload({ death: T1 }, [], true).viewed, { death: T1 });
  });
});

test('parseSyncMeta ทนข้อมูลเสีย', () => {
  assert.deepEqual(parseSyncMeta(null), { uid: null, dirty: false, syncedOnce: false });
  assert.deepEqual(parseSyncMeta('{bad'), { uid: null, dirty: false, syncedOnce: false });
  assert.deepEqual(parseSyncMeta('{"uid":"u","dirty":true,"syncedOnce":true}'), { uid: 'u', dirty: true, syncedOnce: true });
});

// ---------- เอกสารที่แอปเขียนต้องผ่าน firestore.rules จริง ----------
const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const skip = hasEmulator ? false : 'ไม่มี FIRESTORE_EMULATOR_HOST: รันผ่าน npm run test:rules';

describe('payload ของแอปผ่าน firestore.rules', { skip }, () => {
  let env;
  before(async () => {
    env = await initializeTestEnvironment({
      projectId: 'demo-tarot',
      firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
    });
  });
  beforeEach(() => env.clearFirestore());
  after(() => env.cleanup());

  const db = () => env.authenticatedContext('alice').firestore();
  // ทำเหมือน writeUserDoc ใน cloud.ts: payload + updatedAt + schemaVersion ด้วย merge
  const write = (payload) =>
    setDoc(doc(db(), 'users/alice'), { ...payload, updatedAt: serverTimestamp(), schemaVersion: SCHEMA_VERSION }, { merge: true });

  test('สร้างเอกสารครั้งแรกจากข้อมูลในเครื่อง', async () => {
    await assertSucceeds(write(buildPayload({ 'the-fool': T1, death: T2 }, ['death'], false)));
    const data = (await getDoc(doc(db(), 'users/alice'))).data();
    assert.deepEqual(data.viewed, { 'the-fool': T1, death: T2 });
    assert.deepEqual(data.favorites, ['death']);
    assert.equal(data.schemaVersion, 1);
  });
  test('สร้างเอกสารจากข้อมูลว่าง (ผู้ใช้ใหม่)', async () => {
    await assertSucceeds(write(buildPayload({}, [], false)));
  });
  test('merge ไม่ทับ viewed ของคลาวด์ที่มีมากกว่า', async () => {
    await assertSucceeds(write(buildPayload({ 'the-fool': T1, death: T1, justice: T1 }, [], false)));
    await assertSucceeds(write(buildPayload({ death: T2 }, ['death'], true)));
    const data = (await getDoc(doc(db(), 'users/alice'))).data();
    assert.deepEqual(Object.keys(data.viewed).sort(), ['death', 'justice', 'the-fool']);
    assert.deepEqual(data.favorites, ['death']);
  });
  test('viewed ว่างไม่ล้างของคลาวด์ (ไม่ส่ง viewed)', async () => {
    await assertSucceeds(write(buildPayload({ death: T1 }, [], false)));
    await assertSucceeds(write(buildPayload({}, ['death'], true)));
    assert.deepEqual((await getDoc(doc(db(), 'users/alice'))).data().viewed, { death: T1 });
  });
  test('ยกเลิก favorite (local policy) เขียนทับรายการได้', async () => {
    await assertSucceeds(write(buildPayload({}, ['death', 'justice'], false)));
    await assertSucceeds(write(buildPayload({}, ['death'], true)));
    assert.deepEqual((await getDoc(doc(db(), 'users/alice'))).data().favorites, ['death']);
  });
  test('favorites เต็ม 22 ใบผ่านได้', async () => {
    await assertSucceeds(write(buildPayload({}, CARD_IDS, false)));
  });
  test('ไม่แตะ lastReadingId/lastReadingAt ที่มีอยู่ (ขั้น 4 จะเพิ่ม)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/alice'), {
        viewed: {}, favorites: [], updatedAt: new Date(), schemaVersion: 1,
        lastReadingId: 'abcdefghijklmnopqrst', lastReadingAt: new Date(Date.now() - 60_000),
      });
    });
    await assertSucceeds(write(buildPayload({ death: T1 }, ['death'], true)));
    const data = (await getDoc(doc(db(), 'users/alice'))).data();
    assert.equal(data.lastReadingId, 'abcdefghijklmnopqrst');
  });
  test('ผู้ใช้อื่นเขียนทับเอกสารของ alice ไม่ได้', async () => {
    const bob = env.authenticatedContext('bob').firestore();
    await assertFails(setDoc(doc(bob, 'users/alice'), { ...buildPayload({}, [], false), updatedAt: serverTimestamp(), schemaVersion: 1 }, { merge: true }));
  });
});
