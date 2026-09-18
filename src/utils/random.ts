// ยูทิลสุ่มทั่วไป ไม่ผูกกับโดเมนไพ่ — ใช้ร่วมกับ src/utils/cardDraw.ts

// djb2-style hash: string -> uint32 ใช้ทำ seed ให้ PRNG ด้านล่าง
export function hashStringToSeed(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

// mulberry32 — PRNG ขนาดเล็ก กำหนดผลลัพธ์ได้จาก seed เดียวกันเสมอ
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRandom<T>(arr: T[], random: () => number = Math.random): T {
  return arr[Math.floor(random() * arr.length)];
}

// Fisher-Yates บางส่วน — คืนค่า n รายการที่ไม่ซ้ำกันจาก arr
export function pickRandomN<T>(arr: T[], n: number, random: () => number = Math.random): T[] {
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const index = Math.floor(random() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
}
