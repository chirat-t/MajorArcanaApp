// ตรวจว่ารายการ id ใน firestore.rules ตรงกับข้อมูลจริงของแอปทุกตัว (ไม่ต้องใช้ emulator)
// รันในเครื่องได้เลย: node --test tests/rules-ids.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const rules = read('firestore.rules');
const cardsTs = read('src/data/cards.ts');
const topicsTs = read('src/data/topics.ts');

// ดึง array literal ที่ฟังก์ชันใน rules คืนค่า เช่น function cardIds() { return [...]; }
function rulesList(fnName) {
  const m = rules.match(new RegExp(`function ${fnName}\\(\\)\\s*\\{\\s*return\\s*\\[([^\\]]*)\\]`));
  assert.ok(m, `ไม่พบ function ${fnName}() ใน firestore.rules`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

const sorted = (a) => [...a].sort();

test('cardIds() ใน rules ตรงกับ id ใน src/data/cards.ts ทุกใบ', () => {
  const fromCards = [...cardsTs.matchAll(/^\s+id: "([^"]+)"/gm)].map((x) => x[1]);
  assert.equal(fromCards.length, 22, 'cards.ts ควรมีไพ่ 22 ใบ');
  assert.deepEqual(sorted(rulesList('cardIds')), sorted(fromCards));
});

test('topicIds() ใน rules ตรงกับ id หัวข้อใน src/data/topics.ts', () => {
  const fromTopics = [...topicsTs.matchAll(/^    id: '([^']+)'/gm)].map((x) => x[1]);
  assert.deepEqual(sorted(rulesList('topicIds')), sorted(fromTopics));
});

test('positionIds() ใน rules ตรงกับ id ตำแหน่งใน src/data/topics.ts', () => {
  const fromPositions = [...topicsTs.matchAll(/\{ id: '([^']+)', label/g)].map((x) => x[1]);
  assert.deepEqual(sorted(rulesList('positionIds')), sorted(new Set(fromPositions)));
});
