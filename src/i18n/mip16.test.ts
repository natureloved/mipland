import { describe, expect, it } from "vitest";
import en from "./en";
import {
  buildPage,
  compareTraceAddress,
  continuesChain,
  findRecoveryPoint,
  nextFromBlock,
  paginate,
  runQuery,
} from "@/components/mip16/query";
import { SAMPLE, SAMPLE_FILTERS } from "@/components/mip16/sample";
import { COUNTS, FIRST_BLOCK, LAST_BLOCK } from "@/components/mip16/PagingSection";
import { chainFor, RETAINED } from "@/components/mip16/ReorgSection";

const spec = { counts: COUNTS, firstBlock: FIRST_BLOCK, fromBlock: 10, toBlock: 20, order: "asc", target: 100 } as const;

describe("MIP-16 block-aligned pagination", () => {
  it("reproduces the spec's example table", () => {
    expect(buildPage(spec)).toEqual({ ok: true, fromBlock: 10, cursorBlock: 13, objects: 125, end: "target" });
    // Budget runs out while scanning block 13 (95 + 30 > 100).
    expect(buildPage({ ...spec, budget: 100 })).toEqual({
      ok: true,
      fromBlock: 10,
      cursorBlock: 12,
      objects: 95,
      end: "budget",
    });
    // Budget runs out while scanning block 10.
    expect(buildPage({ ...spec, budget: 30 })).toEqual({ ok: false, code: -32005 });
  });

  it("ends at toBlock and walks every block exactly once", () => {
    for (const order of ["asc", "desc"] as const) {
      const [from, to] = order === "asc" ? [FIRST_BLOCK, LAST_BLOCK] : [LAST_BLOCK, FIRST_BLOCK];
      for (const target of [undefined, 1, 50, 100, 200]) {
        for (const budget of [undefined, 70, 100]) {
          const pages = paginate({ ...spec, fromBlock: from, toBlock: to, order, target, budget });
          const ok = pages.filter((p) => p.ok);
          expect(ok).toHaveLength(pages.length);
          expect(ok.reduce((sum, p) => sum + p.objects, 0)).toBe(COUNTS.reduce((a, b) => a + b, 0));
          expect(ok.at(-1)!.cursorBlock).toBe(to);
          expect(ok.at(-1)!.end).toBe("range");
        }
      }
    }
  });

  it("can return fewer objects than the target and still not be done", () => {
    const page = buildPage({ ...spec, budget: 100 });
    expect(page.ok && page.objects < 100 && nextFromBlock(page.cursorBlock, 20, "asc")).toBe(13);
  });

  it("resumes at cursorBlock + 1 going up and - 1 going down", () => {
    expect(nextFromBlock(13, 20, "asc")).toBe(14);
    expect(nextFromBlock(13, 10, "desc")).toBe(12);
    expect(nextFromBlock(20, 20, "asc")).toBeNull();
  });
});

describe("MIP-16 normalized relations", () => {
  it("lists each related object once and only when referenced", () => {
    const out = runQuery(SAMPLE, "logs", SAMPLE_FILTERS.logs, ["transactions", "blocks"], "asc");
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.primary).toHaveLength(5);
    expect(out.result.transactions.map((t) => t.hash)).toEqual(["0xa1", "0xa2", "0xb1", "0xc1"]);
    expect(out.result.blocks.map((b) => b.number)).toEqual([101, 102, 103]);
  });

  it("never returns more related objects than primary objects", () => {
    for (const method of ["transactions", "logs", "traces", "transfers"] as const) {
      const rels = method === "transactions" ? (["blocks"] as const) : (["transactions", "blocks"] as const);
      const out = runQuery(SAMPLE, method, () => true, [...rels], "asc");
      if (!out.ok) throw new Error(method);
      expect(out.result.transactions.length).toBeLessThanOrEqual(out.result.primary.length);
      expect(out.result.blocks.length).toBeLessThanOrEqual(out.result.primary.length);
    }
  });

  it("rejects a relation the method doesn't support with -32602", () => {
    expect(runQuery(SAMPLE, "blocks", () => true, ["transactions"], "asc")).toEqual({ ok: false, code: -32602 });
  });

  it("reverses order within a block in desc mode", () => {
    const out = runQuery(SAMPLE, "logs", () => true, [], "desc");
    if (!out.ok) throw new Error("desc");
    const keys = out.result.primary.map((l) => ("logIndex" in l ? `${l.blockNumber}:${l.logIndex}` : ""));
    expect(keys.slice(0, 3)).toEqual(["103:2", "103:1", "103:0"]);
  });

  it("orders trace addresses element-wise, prefix first", () => {
    const sorted = [[1], [0, 0], [], [0]].sort(compareTraceAddress);
    expect(sorted).toEqual([[], [0], [0, 0], [1]]);
  });

  it("counts only value-bearing frames as transfers", () => {
    const out = runQuery(SAMPLE, "transfers", () => true, [], "asc");
    if (!out.ok) throw new Error("transfers");
    expect(out.result.primary.every((t) => "value" in t && t.value > 0)).toBe(true);
    expect(out.result.primary).toHaveLength(4);
  });
});

describe("MIP-16 reorg handling", () => {
  it("matches parent hash to the last cursor unless a reorg happened", () => {
    expect(continuesChain(chainFor(false)[4], chainFor(false)[5])).toBe(true);
    expect(continuesChain(chainFor(false)[4], chainFor(true)[5])).toBe(false);
  });

  it("finds the newest stored block that is still canonical", () => {
    expect(findRecoveryPoint([...chainFor(true)].reverse(), RETAINED)).toBe(102);
    expect(findRecoveryPoint([...chainFor(false)].reverse(), RETAINED)).toBe(104);
  });
});

describe("MIP-16 copy", () => {
  it("states Draft status and that no Monad release serves it", () => {
    expect(en.mip16.hero.desc).toContain("MIP-16 is a Draft");
    expect(en.mip16.hero.desc).toContain("-32601");
    expect(en.footer.mip16Note).toContain("October 13, 2026");
    expect(en.mip16.takeaways.openQuestion).toContain("#89");
  });
});
