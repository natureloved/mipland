import { describe, expect, it } from "vitest";
import en from "./en";
import {
  assignChunks,
  chacha20Rng,
  dealChunks,
  deriveSeed,
  equalStakeChunks,
  hexToBytes,
  layoutFor,
  obligations,
  reachableBuckets,
  shuffle,
} from "@/components/mip10/raptorcast";
import { statusOf } from "@/components/mip10/ValidationSection";
import { interoperate } from "@/components/mip10/RolloutSection";

// Generated with rand 0.8.6 + rand_chacha 0.3.1, the versions monad-bft pins:
// ChaCha20Rng::from_seed(seed) then next_u32() / slice.shuffle(&mut rng).
const ZERO_SEED = "00".repeat(32);
const DERIVED_SEED = "40e201000000000003b2263400000000a1a8afb6bdc4cbd2d9e0e7eef5fc030a";

describe("MIP-10 ChaCha20 shuffle matches rand_chacha", () => {
  it("produces the same keystream words", () => {
    const next = chacha20Rng(hexToBytes(ZERO_SEED));
    expect(Array.from({ length: 4 }, next)).toEqual([2917185654, 2419978656, 3848953152, 683509331]);
  });

  it("produces the same Fisher-Yates permutations", () => {
    expect(shuffle([...Array(8).keys()], hexToBytes(ZERO_SEED))).toEqual([7, 1, 2, 3, 0, 4, 6, 5]);
    expect(shuffle([...Array(13).keys()], hexToBytes(ZERO_SEED))).toEqual([
      5, 12, 3, 2, 0, 6, 10, 9, 4, 11, 1, 8, 7,
    ]);
    expect(shuffle([...Array(13).keys()], hexToBytes(DERIVED_SEED))).toEqual([
      5, 8, 9, 11, 12, 0, 7, 2, 10, 6, 4, 1, 3,
    ]);
  });

  it("derives the seed from round, 2048 ms bucket and key bytes 1-16", () => {
    const key = new Uint8Array(33);
    for (let i = 0; i < 16; i++) key[1 + i] = (0xa1 + i * 7) & 0xff;
    const seed = deriveSeed(BigInt(123456), BigInt(1_791_900_000_000), key);
    expect(Buffer.from(seed).toString("hex")).toBe(DERIVED_SEED);
    // Same bucket, same seed.
    expect(deriveSeed(BigInt(123456), BigInt(1_791_900_000_001), key)).toEqual(seed);
  });
});

describe("MIP-10 layout", () => {
  it("picks the smallest depth with 2^(d-1) >= N + |V|", () => {
    expect(layoutFor(24 * 1024, 8)).toEqual({ depth: 7, symbolLen: 1199, k: 21, n: 53, slots: 64, proofBytes: 120 });
    expect(layoutFor(100 * 1024, 199)?.depth).toBe(10);
    expect(layoutFor(1024 * 1024, 199)).toMatchObject({ depth: 13, k: 972, n: 2430 });
    expect(layoutFor(3 * 1024 * 1024, 199)).toMatchObject({ depth: 14, k: 2971, n: 7428 });
  });

  it("rounds each obligation up, so N <= n < N + |V|", () => {
    const stakes = [5, 32, 9, 12, 6, 18, 10, 8].map(BigInt);
    const obs = obligations(stakes, 53);
    const n = obs.reduce((a, b) => a + b, 0);
    expect(n).toBeGreaterThanOrEqual(53);
    expect(n).toBeLessThan(53 + stakes.length);
    expect(equalStakeChunks(2430, 199)).toBe(199 * 13);
  });

  it("deals round-robin and skips validators that have their share", () => {
    expect(dealChunks([3, 1, 2])).toEqual([0, 1, 2, 0, 2, 0]);
  });

  it("assigns every chunk and gives each validator exactly its obligation", () => {
    const validators = Array.from({ length: 8 }, (_, i) => ({
      pubkey: "02" + String(i).repeat(64),
      stake: BigInt(i + 1),
    }));
    const a = assignChunks(24 * 1024, validators, "03" + "ab".repeat(32), BigInt(1), BigInt(0))!;
    a.obligations.forEach((ob, i) => expect(a.owners.filter((o) => o === i)).toHaveLength(ob));
  });

  it("lets the leader reach 10 or 11 buckets in a ±10 s window", () => {
    for (const now of [0, 1_000, 1_791_900_000_000, 1_791_900_001_234]) {
      expect([10, 11]).toContain(reachableBuckets(now).length);
    }
  });
});

describe("MIP-10 validation and rollout", () => {
  it("fails exactly the check each bad proposal targets", () => {
    expect(statusOf("honest", "reencode")).toBe("pass");
    expect(statusOf("equivocate", "commitment")).toBe("fail");
    expect(statusOf("equivocate", "reencode")).toBe("na");
    expect(statusOf("mixed", "proof")).toBe("pass");
    expect(statusOf("mixed", "reencode")).toBe("fail");
  });

  it("lets only adjacent stages interoperate", () => {
    for (let a = 0; a < 4; a++) {
      for (let b = 0; b < 4; b++) expect(interoperate(a, b)).toBe(Math.abs(a - b) <= 1);
    }
  });
});

describe("MIP-10 copy", () => {
  it("states Draft status and the stage-3 rollout", () => {
    expect(en.mip10.hero.desc).toContain("MIP-10 is a Draft");
    expect(en.mip10.hero.desc).toContain("v0.16.2");
    expect(en.footer.mip10Note).toContain("stage 3 of 4");
    expect(en.footer.mip10Note).toContain("October 13, 2026");
  });
});
