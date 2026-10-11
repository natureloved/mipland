import { describe, expect, it } from "vitest";
import en from "./en";
import {
  DUST_THRESHOLD_WEI,
  EXTERNAL_REWARD_MIN_WEI,
  SAMPLE_FEES_WEI,
  burnedUnder,
  delegatorCut,
} from "@/components/mip11/fees";

describe("MIP-11 minimum amount", () => {
  it("burns only nonzero fees under the minimum", () => {
    const fees = [0, 5, 10, 20].map(BigInt);
    expect(burnedUnder(fees, BigInt(10))).toEqual({ blocks: 1, feeShare: 0.1428 });
  });

  it("matches the figures quoted in the copy and knowledge file", () => {
    expect(SAMPLE_FEES_WEI).toHaveLength(200);
    expect(burnedUnder(SAMPLE_FEES_WEI, DUST_THRESHOLD_WEI).blocks).toBe(0);
    const atOneMon = burnedUnder(SAMPLE_FEES_WEI, EXTERNAL_REWARD_MIN_WEI);
    expect(atOneMon.blocks).toBe(197);
    expect(Math.round(atOneMon.feeShare * 100)).toBe(76);
  });
});

describe("MIP-11 delegator cut", () => {
  it("applies commission only when deducted", () => {
    expect(delegatorCut(1, 0.2, 0.1, false)).toBeCloseTo(0.2);
    expect(delegatorCut(1, 0.2, 0.1, true)).toBeCloseTo(0.18);
  });
});

describe("MIP-11 copy", () => {
  it("states Draft status and no activation", () => {
    expect(en.mip11.hero.desc).toContain("Draft and is not active on any network");
    expect(en.footer.mip11Note).toContain("October 11, 2026");
    expect(en.mip11.affected.q1Desc).toContain("76%");
  });
});
