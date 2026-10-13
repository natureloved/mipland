// Pure models of MIP-16's query semantics, shared by the sections and tests.

export type Order = "asc" | "desc";

// ---------------------------------------------------------------------------
// Block-aligned pagination
// ---------------------------------------------------------------------------

export interface PageRequest {
  /** Matching primary objects per block, indexed from `firstBlock`. */
  counts: number[];
  firstBlock: number;
  fromBlock: number;
  toBlock: number;
  order: Order;
  /** Target primary objects per page; omitted means no target. */
  target?: number;
  /** Server budget, modeled as a cap on primary objects per response. */
  budget?: number;
}

export type PageEnd = "range" | "target" | "budget";

export type PageResult =
  | { ok: true; fromBlock: number; cursorBlock: number; objects: number; end: PageEnd }
  | { ok: false; code: -32005 };

/**
 * Scans one block at a time from `fromBlock` and stops at the first of:
 * range end, target reached (keeping the whole final block), or budget
 * reached (dropping the partial block). A budget hit on `fromBlock` itself
 * fails with -32005, since no block-aligned page exists.
 */
export function buildPage(req: PageRequest): PageResult {
  const step = req.order === "asc" ? 1 : -1;
  let objects = 0;
  for (let block = req.fromBlock; ; block += step) {
    const count = req.counts[block - req.firstBlock] ?? 0;
    if (req.budget !== undefined && objects + count > req.budget) {
      if (block === req.fromBlock) return { ok: false, code: -32005 };
      return { ok: true, fromBlock: req.fromBlock, cursorBlock: block - step, objects, end: "budget" };
    }
    objects += count;
    if (block === req.toBlock) {
      return { ok: true, fromBlock: req.fromBlock, cursorBlock: block, objects, end: "range" };
    }
    if (req.target !== undefined && objects >= req.target) {
      return { ok: true, fromBlock: req.fromBlock, cursorBlock: block, objects, end: "target" };
    }
  }
}

/** The client's next `fromBlock`, or null when `cursorBlock` is `toBlock`. */
export function nextFromBlock(cursorBlock: number, toBlock: number, order: Order): number | null {
  if (cursorBlock === toBlock) return null;
  return order === "asc" ? cursorBlock + 1 : cursorBlock - 1;
}

/** Runs every page of a query until it completes or fails. */
export function paginate(req: Omit<PageRequest, "fromBlock"> & { fromBlock: number }): PageResult[] {
  const pages: PageResult[] = [];
  let from: number | null = req.fromBlock;
  while (from !== null) {
    const page = buildPage({ ...req, fromBlock: from });
    pages.push(page);
    if (!page.ok) break;
    from = nextFromBlock(page.cursorBlock, req.toBlock, req.order);
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Normalized relations
// ---------------------------------------------------------------------------

export interface Block {
  number: number;
  hash: string;
  timestamp: number;
  miner: string;
}

export interface Tx {
  hash: string;
  blockNumber: number;
  transactionIndex: number;
  from: string;
  to: string;
  selector: string;
}

export interface Log {
  blockNumber: number;
  logIndex: number;
  transactionHash: string;
  address: string;
  event: string;
}

export interface Trace {
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  traceAddress: number[];
  type: "CALL" | "DELEGATECALL" | "STATICCALL" | "CREATE";
  from: string;
  to: string;
  value: number;
}

export interface Dataset {
  blocks: Block[];
  transactions: Tx[];
  logs: Log[];
  traces: Trace[];
}

export type Method = "blocks" | "transactions" | "logs" | "traces" | "transfers";
export type Relation = "transactions" | "blocks";

/** Relations each method can join (many-to-one only). */
export const RELATIONS: Record<Method, Relation[]> = {
  blocks: [],
  transactions: ["blocks"],
  logs: ["transactions", "blocks"],
  traces: ["transactions", "blocks"],
  transfers: ["transactions", "blocks"],
};

/** Element-wise, with a prefix sorting before the longer path. */
export function compareTraceAddress(a: number[], b: number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

export type Row = Block | Tx | Log | Trace;
/** Any row, for predicates that check fields by name. */
export type AnyRow = Partial<Block & Tx & Log & Trace>;

function primaryRows(data: Dataset, method: Method): Row[] {
  switch (method) {
    case "blocks":
      return [...data.blocks].sort((a, b) => a.number - b.number);
    case "transactions":
      return [...data.transactions].sort(
        (a, b) => a.blockNumber - b.blockNumber || a.transactionIndex - b.transactionIndex,
      );
    case "logs":
      return [...data.logs].sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
    case "traces":
    case "transfers": {
      const rows = method === "transfers" ? data.traces.filter((t) => t.value > 0) : data.traces;
      return [...rows].sort(
        (a, b) =>
          a.blockNumber - b.blockNumber ||
          a.transactionIndex - b.transactionIndex ||
          compareTraceAddress(a.traceAddress, b.traceAddress),
      );
    }
  }
}

export interface QueryResult {
  primary: Row[];
  transactions: Tx[];
  blocks: Block[];
}

export type QueryOutcome = { ok: true; result: QueryResult } | { ok: false; code: -32602 };

/**
 * Applies a predicate to the method's primary rows, orders them, and joins
 * the requested relations in normalized form: each related object once, and
 * only if a primary object in the response references it.
 */
export function runQuery(
  data: Dataset,
  method: Method,
  match: (row: AnyRow) => boolean,
  relations: Relation[],
  order: Order,
): QueryOutcome {
  if (relations.some((r) => !RELATIONS[method].includes(r))) return { ok: false, code: -32602 };

  const primary = primaryRows(data, method).filter(match);
  if (order === "desc") primary.reverse();

  const txHashes = new Set<string>();
  const blockNumbers = new Set<number>();
  for (const row of primary) {
    if ("transactionHash" in row) txHashes.add(row.transactionHash);
    if ("blockNumber" in row) blockNumbers.add(row.blockNumber);
  }

  const txs = relations.includes("transactions")
    ? primaryRows(data, "transactions").filter((t) => txHashes.has((t as Tx).hash))
    : [];
  const blocks = relations.includes("blocks")
    ? primaryRows(data, "blocks").filter((b) => blockNumbers.has((b as Block).number))
    : [];
  if (order === "desc") {
    txs.reverse();
    blocks.reverse();
  }

  return { ok: true, result: { primary, transactions: txs as Tx[], blocks: blocks as Block[] } };
}

// ---------------------------------------------------------------------------
// Reorg detection and recovery
// ---------------------------------------------------------------------------

export interface BlockRef {
  number: number;
  hash: string;
  parentHash: string;
}

/** A page continues the chain if its fromBlock's parent is the last cursor. */
export function continuesChain(previousCursor: BlockRef, nextFrom: BlockRef): boolean {
  return nextFrom.parentHash === previousCursor.hash;
}

/**
 * Walks a desc `eth_queryBlocks` result newest to oldest and returns the
 * first block whose hash matches what the client stored at that height.
 */
export function findRecoveryPoint(
  canonicalDesc: Pick<BlockRef, "number" | "hash">[],
  retained: Map<number, string>,
): number | null {
  for (const block of canonicalDesc) {
    if (retained.get(block.number) === block.hash) return block.number;
  }
  return null;
}
