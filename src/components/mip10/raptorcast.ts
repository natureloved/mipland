// MIP-10 (Deterministic RaptorCast) encoding parameters and chunk assignment,
// following the spec and monad-bft's monad-raptorcast/src/packet.

export const SEGMENT_LEN = 1440;
export const HEADER_LEN = 117;
export const CHUNK_HEADER_LEN = 4;
export const MERKLE_HASH_LEN = 20;
export const MIN_DEPTH = 3;
export const MAX_DEPTH = 15;
export const TIMESTAMP_BUCKET_MS = 2048;
// Reference implementation's local admission policy, not part of the encoding.
export const TIMESTAMP_TOLERANCE_MS = 10_000;
// monad-raptorcast MAX_MESSAGE_SIZE.
export const MAX_MESSAGE_BYTES = 3 * 1024 * 1024;

// tsconfig targets ES2017, which has no bigint literals.
const ZERO = BigInt(0);
const ONE = BigInt(1);
const U32_MASK = BigInt(0xffffffff);
const U32_BITS = BigInt(32);

export function symbolLen(depth: number): number {
  return SEGMENT_LEN - HEADER_LEN - CHUNK_HEADER_LEN - MERKLE_HASH_LEN * (depth - 1);
}

/** N = ceil(K × 2.5), exact in integers. */
export function scaledSymbols(k: number): number {
  return Math.ceil((5 * k) / 2);
}

export interface Layout {
  depth: number;
  symbolLen: number;
  /** Source symbols, K(d). */
  k: number;
  /** ceil(K × r), N(d). */
  n: number;
  /** Leaf slots, 2^(d-1). */
  slots: number;
  proofBytes: number;
}

/**
 * Smallest depth in [3, 15] with 2^(d-1) >= N(d) + |V|, where |V| excludes the
 * author. Returns null when no depth fits.
 */
export function layoutFor(messageBytes: number, validatorsExcludingAuthor: number): Layout | null {
  if (messageBytes <= 0) return null;
  for (let depth = MIN_DEPTH; depth <= MAX_DEPTH; depth++) {
    const sl = symbolLen(depth);
    const k = Math.ceil(messageBytes / sl);
    const n = scaledSymbols(k);
    const slots = 2 ** (depth - 1);
    if (n + validatorsExcludingAuthor <= slots) {
      return { depth, symbolLen: sl, k, n, slots, proofBytes: MERKLE_HASH_LEN * (depth - 1) };
    }
  }
  return null;
}

/** Chunk count n when every validator has the same stake. */
export function equalStakeChunks(n: number, validators: number): number {
  return validators * Math.ceil(n / validators);
}

/** ceil(stake(v) × N / total_stake) for each validator, in BigInt. */
export function obligations(stakes: bigint[], n: number): number[] {
  const total = stakes.reduce((a, b) => a + b, ZERO);
  const big = BigInt(n);
  return stakes.map((s) => Number((s * big + total - ONE) / total));
}

/** round (8 LE) || floor(ts / 2048) (8 LE) || author_pubkey[1..17]. */
export function deriveSeed(round: bigint, unixTsMs: bigint, authorPubkey: Uint8Array): Uint8Array {
  const seed = new Uint8Array(32);
  const view = new DataView(seed.buffer);
  view.setBigUint64(0, round, true);
  view.setBigUint64(8, unixTsMs / BigInt(TIMESTAMP_BUCKET_MS), true);
  seed.set(authorPubkey.subarray(1, 17), 16);
  return seed;
}

function rotl(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

/** ChaCha20 with a 64-bit counter and 64-bit stream id, both zero (rand_chacha's ChaCha20Rng). */
export function chacha20Rng(seed: Uint8Array): () => number {
  const key = new DataView(seed.buffer, seed.byteOffset, 32);
  const state = new Uint32Array(16);
  state[0] = 0x61707865;
  state[1] = 0x3320646e;
  state[2] = 0x79622d32;
  state[3] = 0x6b206574;
  for (let i = 0; i < 8; i++) state[4 + i] = key.getUint32(i * 4, true);
  let counter = ZERO;
  const out = new Uint32Array(16);
  let index = 16;

  const qr = (x: Uint32Array, a: number, b: number, c: number, d: number) => {
    x[a] = (x[a] + x[b]) >>> 0; x[d] = rotl(x[d] ^ x[a], 16);
    x[c] = (x[c] + x[d]) >>> 0; x[b] = rotl(x[b] ^ x[c], 12);
    x[a] = (x[a] + x[b]) >>> 0; x[d] = rotl(x[d] ^ x[a], 8);
    x[c] = (x[c] + x[d]) >>> 0; x[b] = rotl(x[b] ^ x[c], 7);
  };

  const refill = () => {
    state[12] = Number(counter & U32_MASK);
    state[13] = Number(counter >> U32_BITS);
    const x = state.slice();
    for (let i = 0; i < 10; i++) {
      qr(x, 0, 4, 8, 12); qr(x, 1, 5, 9, 13); qr(x, 2, 6, 10, 14); qr(x, 3, 7, 11, 15);
      qr(x, 0, 5, 10, 15); qr(x, 1, 6, 11, 12); qr(x, 2, 7, 8, 13); qr(x, 3, 4, 9, 14);
    }
    for (let i = 0; i < 16; i++) out[i] = (x[i] + state[i]) >>> 0;
    counter++;
    index = 0;
  };

  return () => {
    if (index === 16) refill();
    return out[index++];
  };
}

/** Uniform j in [0, i]: widening-multiply rejection sampling (rand 0.8). */
function draw(i: number, nextU32: () => number): number {
  const m = BigInt(i + 1);
  const z = ((m << BigInt(Math.clz32(i + 1))) & U32_MASK) - ONE;
  for (;;) {
    const p = BigInt(nextU32()) * m;
    if ((p & U32_MASK) <= z) return Number(p >> U32_BITS);
  }
}

/** Fisher–Yates over a copy of `items`, seeded with ChaCha20. */
export function shuffle<T>(items: T[], seed: Uint8Array): T[] {
  const out = items.slice();
  const next = chacha20Rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = draw(i, next);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deals chunk indices round-robin over the shuffled order, skipping validators
 * whose obligation is used up. Returns the owner (index into `order`) of each chunk.
 */
export function dealChunks(obligationsInOrder: number[]): number[] {
  const remaining = obligationsInOrder.slice();
  const total = remaining.reduce((a, b) => a + b, 0);
  const owners: number[] = [];
  let i = 0;
  for (let chunk = 0; chunk < total; chunk++) {
    while (remaining[i] === 0) i = (i + 1) % remaining.length;
    owners.push(i);
    remaining[i]--;
    i = (i + 1) % remaining.length;
  }
  return owners;
}

export interface Validator {
  /** 33-byte compressed public key, hex without 0x. */
  pubkey: string;
  stake: bigint;
}

export interface Assignment {
  layout: Layout;
  seed: Uint8Array;
  /** Validators (author excluded) after the shuffle. */
  order: Validator[];
  obligations: number[];
  /** owners[chunk] is an index into `order`. */
  owners: number[];
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Full Primary v1 assignment for a proposal. `validators` excludes the author. */
export function assignChunks(
  messageBytes: number,
  validators: Validator[],
  authorPubkey: string,
  round: bigint,
  unixTsMs: bigint,
): Assignment | null {
  const layout = layoutFor(messageBytes, validators.length);
  if (!layout || validators.length === 0) return null;
  const sorted = validators.slice().sort((a, b) => (a.pubkey < b.pubkey ? -1 : a.pubkey > b.pubkey ? 1 : 0));
  const seed = deriveSeed(round, unixTsMs, hexToBytes(authorPubkey));
  const order = shuffle(sorted, seed);
  const obs = obligations(order.map((v) => v.stake), layout.n);
  return { layout, seed, order, obligations: obs, owners: dealChunks(obs) };
}

/** Timestamp buckets an author can pick from inside the ±tolerance window around `nowMs`. */
export function reachableBuckets(nowMs: number, toleranceMs = TIMESTAMP_TOLERANCE_MS): number[] {
  const first = Math.floor((nowMs - toleranceMs) / TIMESTAMP_BUCKET_MS);
  const last = Math.floor((nowMs + toleranceMs) / TIMESTAMP_BUCKET_MS);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}
