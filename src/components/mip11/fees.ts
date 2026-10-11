import sample from "./priority-fee-sample.json";

export const BLOCK_REWARD_MON = 18; // REWARD in the staking docs
export const DUST_THRESHOLD_WEI = BigInt(1e9); // 1 gwei
export const EXTERNAL_REWARD_MIN_WEI = BigInt(1e18); // 1 MON, current externalReward bound

export const SAMPLE = sample;
export const SAMPLE_FEES_WEI: bigint[] = sample.priorityFeesWei.map((v) => BigInt(v));
export const SAMPLE_FEES_MON: number[] = SAMPLE_FEES_WEI.map((v) => Number(v) / 1e18);

/** Blocks whose total priority fees fall under the minimum, and their share of all fees. */
export function burnedUnder(feesWei: bigint[], minWei: bigint) {
  let blocks = 0;
  let burned = BigInt(0);
  let total = BigInt(0);
  for (const fee of feesWei) {
    total += fee;
    if (fee > BigInt(0) && fee < minWei) {
      blocks += 1;
      burned += fee;
    }
  }
  return { blocks, feeShare: total === BigInt(0) ? 0 : Number((burned * BigInt(10000)) / total) / 10000 };
}

/** A delegator's cut of one block's priority fees under MIP-11. */
export function delegatorCut(feesMon: number, stakeShare: number, commission: number, deductCommission: boolean) {
  return feesMon * stakeShare * (deductCommission ? 1 - commission : 1);
}

export function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
