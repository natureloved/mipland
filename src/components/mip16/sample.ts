import type { AnyRow, Dataset, Method } from "./query";

// Three blocks of a made-up chain. Addresses are names so the joins are easy
// to follow; "usdc" stands in for a token contract.
export const SAMPLE: Dataset = {
  blocks: [
    { number: 101, hash: "0x9a1c", timestamp: 1_791_900_000, miner: "validatorA" },
    { number: 102, hash: "0x4be7", timestamp: 1_791_900_001, miner: "validatorB" },
    { number: 103, hash: "0x07f2", timestamp: 1_791_900_001, miner: "validatorA" },
  ],
  transactions: [
    { hash: "0xa1", blockNumber: 101, transactionIndex: 0, from: "alice", to: "router", selector: "swap" },
    { hash: "0xa2", blockNumber: 101, transactionIndex: 1, from: "bob", to: "usdc", selector: "transfer" },
    { hash: "0xb1", blockNumber: 102, transactionIndex: 0, from: "carol", to: "usdc", selector: "transfer" },
    { hash: "0xc1", blockNumber: 103, transactionIndex: 0, from: "alice", to: "router", selector: "swap" },
    { hash: "0xc2", blockNumber: 103, transactionIndex: 1, from: "dave", to: "vault", selector: "deposit" },
  ],
  logs: [
    { blockNumber: 101, logIndex: 0, transactionHash: "0xa1", address: "usdc", event: "Transfer" },
    { blockNumber: 101, logIndex: 1, transactionHash: "0xa1", address: "pool", event: "Swap" },
    { blockNumber: 101, logIndex: 2, transactionHash: "0xa1", address: "usdc", event: "Transfer" },
    { blockNumber: 101, logIndex: 3, transactionHash: "0xa2", address: "usdc", event: "Transfer" },
    { blockNumber: 102, logIndex: 0, transactionHash: "0xb1", address: "usdc", event: "Transfer" },
    { blockNumber: 103, logIndex: 0, transactionHash: "0xc1", address: "usdc", event: "Transfer" },
    { blockNumber: 103, logIndex: 1, transactionHash: "0xc1", address: "pool", event: "Swap" },
    { blockNumber: 103, logIndex: 2, transactionHash: "0xc2", address: "vault", event: "Deposit" },
  ],
  traces: [
    { blockNumber: 101, transactionHash: "0xa1", transactionIndex: 0, traceAddress: [], type: "CALL", from: "alice", to: "router", value: 0 },
    { blockNumber: 101, transactionHash: "0xa1", transactionIndex: 0, traceAddress: [0], type: "CALL", from: "router", to: "pool", value: 0 },
    { blockNumber: 101, transactionHash: "0xa1", transactionIndex: 0, traceAddress: [0, 0], type: "CALL", from: "pool", to: "usdc", value: 0 },
    { blockNumber: 101, transactionHash: "0xa1", transactionIndex: 0, traceAddress: [1], type: "CALL", from: "router", to: "alice", value: 5 },
    { blockNumber: 101, transactionHash: "0xa2", transactionIndex: 1, traceAddress: [], type: "CALL", from: "bob", to: "usdc", value: 0 },
    { blockNumber: 102, transactionHash: "0xb1", transactionIndex: 0, traceAddress: [], type: "CALL", from: "carol", to: "usdc", value: 0 },
    { blockNumber: 103, transactionHash: "0xc1", transactionIndex: 0, traceAddress: [], type: "CALL", from: "alice", to: "router", value: 2 },
    { blockNumber: 103, transactionHash: "0xc1", transactionIndex: 0, traceAddress: [0], type: "CALL", from: "router", to: "pool", value: 2 },
    { blockNumber: 103, transactionHash: "0xc1", transactionIndex: 0, traceAddress: [0, 0], type: "STATICCALL", from: "pool", to: "oracle", value: 0 },
    { blockNumber: 103, transactionHash: "0xc2", transactionIndex: 1, traceAddress: [], type: "CALL", from: "dave", to: "vault", value: 10 },
  ],
};

/** The preset filter each method's demo applies, as a row predicate. */
export const SAMPLE_FILTERS: Record<Method, (row: AnyRow) => boolean> = {
  blocks: (r) => r.miner === "validatorA",
  transactions: (r) => r.to === "usdc",
  logs: (r) => r.address === "usdc" && r.event === "Transfer",
  traces: (r) => r.to === "usdc",
  transfers: (r) => r.from === "router",
};

/** The filter object each preset puts in the request. */
export const SAMPLE_FILTER_JSON: Record<Method, Record<string, unknown>> = {
  blocks: { miner: "validatorA" },
  transactions: { to: "usdc" },
  logs: { address: "usdc", topics: ["Transfer"] },
  traces: { to: "usdc" },
  transfers: { from: "router" },
};

/** Primary fields each demo selects. Join keys are always included. */
export const SAMPLE_FIELDS: Record<Method, string[]> = {
  blocks: ["number", "hash", "miner"],
  transactions: ["hash", "blockNumber", "from", "to"],
  logs: ["blockNumber", "logIndex", "transactionHash", "address"],
  traces: ["blockNumber", "transactionHash", "traceAddress", "from", "to"],
  transfers: ["blockNumber", "transactionHash", "traceAddress", "from", "to", "value"],
};

export const RELATION_FIELDS = {
  transactions: ["hash", "input"],
  blocks: ["number", "timestamp"],
} as const;
