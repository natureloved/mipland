# MIP-16: JSON-RPC Query Methods

**Proposal status:** Draft

**Network status:** Not served by any Monad client release. On October 13, 2026, `rpc.monad.xyz` and `testnet-rpc.monad.xyz` answered `eth_queryBlocks` with `-32601` (method not found), and the official release notes do not mention the methods. A monad-bft pull request that starts the indexing backend ([#2945](https://github.com/category-labs/monad-bft/pull/2945)) is open. An open MIPs pull request ([#89](https://github.com/monad-crypto/MIPs/pull/89)) would move MIP-16 to Review; see "Pending revision" below.

**Verified:** October 13, 2026, against the [canonical MIP-16 specification](https://github.com/monad-crypto/MIPs/blob/5abe8ccd319828dfc999877f14af93012ee75f6f/MIPs/MIP-16.md), the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases) and the public RPC endpoints.

## Summary

MIP-16, by Kevin Koste, Kyle Scott, Jay Miller and Andre Benedito, adds five JSON-RPC methods for reading raw chain history: `eth_queryBlocks`, `eth_queryTransactions`, `eth_queryLogs`, `eth_queryTraces` and `eth_queryTransfers`. All five take the same request shape (a block range, an order, a target page size, a filter and a field selection) and return the same response shape. They use the `eth_` namespace because nothing in them is Monad-specific. No existing method changes.

## Motivation

The spec names four gaps in the standard JSON-RPC interface:

- **Filtering.** Only `eth_getLogs` filters. Finding every transaction sent to an address means fetching whole blocks and filtering on the client.
- **Relations.** Logs plus their transactions takes N+1 requests: one for the logs, then one per transaction.
- **Field selection.** Every method returns a fixed schema, so a client that wants a block number and timestamp also gets `logsBloom` and the rest.
- **Pagination.** `eth_getLogs` over large ranges times out and needs client-side workarounds. Blocks, transactions and traces have no range query at all.

## Request

`params` is a single request object:

| Field | Type | Notes |
| --- | --- | --- |
| `fromBlock`, `toBlock` | `QUANTITY` or tag (`latest`, `earliest`, `safe`, `finalized`) | Inclusive. Tags resolve on the server at query time. |
| `order` | `asc` (default) or `desc` | In `desc`, `fromBlock` is the upper bound. |
| `target` | `QUANTITY`, at least `0x1` | Target number of primary objects per page. |
| `filter` | object | Method-specific. Fields are ANDed; an array value matches any element. |
| `fields` | object | The primary type's key selects its fields; any other key joins a relation. Values are a list of field names or `true` for all. |

Defaults: in `asc`, `fromBlock` is `earliest` and `toBlock` is `latest`; in `desc` it is the reverse.

Filters per method:

- `eth_queryBlocks`: `miner`. No relations.
- `eth_queryTransactions`: `from`, `to`, `selector` (first 4 bytes of input). Relation: `blocks`.
- `eth_queryLogs`: `address`, `topics` (same positional semantics as `eth_getLogs`). Relations: `transactions`, `blocks`.
- `eth_queryTraces`: `from`, `to`, `selector`, `isTopLevel`. Relations: `transactions`, `blocks`. Traces are flattened `callTracer` frames.
- `eth_queryTransfers`: `from`, `to`, `isTopLevel`. Relations: `transactions`, `blocks`. A transfer is any call frame with `value > 0`.

Transaction objects combine transaction and receipt fields, without receipt `logs`.

## Response

`data` holds one array per object type: the primary objects, plus one array per joined relation. Responses are normalized: a related object appears once even if several primary objects reference it, and only if a primary object in the response references it. Only many-to-one relations are joinable (a log's transaction, a log's block), so a response never holds more related objects of a type than primary objects. Clients join on `blockNumber` = `blocks.number` and `transactionHash` = `transactions.hash`, so they should select those fields on both sides.

Arrays are sorted by ordering key (blocks by number; transactions by block and index; logs by block and log index; traces and transfers by block, transaction index and `traceAddress`), descending in `desc` mode, including within a block.

The response also carries `fromBlock`, `toBlock` and `cursorBlock`, each as `{ number, hash, parentHash }`. Every object and block reference in one response comes from the same canonical chain.

## Block-aligned pagination

A page is a run of whole blocks from `fromBlock` through `cursorBlock`. The server scans block by block and ends the page at the first of:

1. **Range end:** it reaches `toBlock`.
2. **Target reached:** a block brings the count to `target` or more. The whole block is included, so a page can exceed `target`.
3. **Budget reached:** the server's own limit (time, size or object count) runs out partway through a block. That block's partial results are dropped and the page ends at the previous block.

If the budget runs out inside `fromBlock` itself, the request fails with `-32005`. Once a block is complete, the server must return the page. Related objects do not count toward `target`.

Spec example: `asc`, blocks 10 to 20, `target` 100, with 40, 0, 55 and 30 matches in blocks 10 to 13. With no budget hit, the page ends at 13 with 125 objects. If the budget runs out while scanning 13, it ends at 12 with 95. If it runs out while scanning 10, the request fails with `-32005`.

The object count never tells a client whether it is done; only `cursorBlock` does. The query is complete when `cursorBlock.number` equals `toBlock.number`. Otherwise, repeat the request with only `fromBlock` changed: `cursorBlock + 1` in `asc`, `cursorBlock - 1` in `desc`.

## Reorg detection and recovery

Paging toward the tip in `asc`, a client compares each page's `fromBlock.parentHash` with the previous page's `cursorBlock.hash`. A mismatch means a reorg replaced a stored block. To recover, the client keeps number and hash for every block it processed back to the `finalized` block, then calls `eth_queryBlocks` with `order: "desc"`, `fromBlock: "latest"`, `toBlock` at its oldest stored block and fields `number` and `hash`. The newest block whose hash still matches is the recovery point: discard everything above it and resume from the next block. A finalized block can't be replaced, so one reference always matches.

## Errors

| Code | Meaning |
| --- | --- |
| `-32601` | Method not found: the node predates MIP-16. |
| `-32004` | Method not supported: the node knows the method but doesn't serve it (for example, no trace index). |
| `-32602` | Invalid params: unknown field key, bad filter, unsupported relation, `target` of `0x0`, or an inverted range. |
| `-32001` | Resource not found: part of the range is outside the node's availability window for that method. The node must not return a truncated result. |
| `-32005` | Limit exceeded: the budget ran out inside `fromBlock`. |

Each method has its own availability window on a node, so a node can hold all blocks but only recent traces.

## Security considerations

The spec expects servers to cap response size or execution time and to apply rate limits and per-key quotas. Joins and field selection change the worst-case work per request, so relations and fields should be validated strictly. Results near the tip are not final, so clients that store results need the reorg procedure above.

## Pending revision

Open pull request [monad-crypto/MIPs #89](https://github.com/monad-crypto/MIPs/pull/89) (last updated October 8, 2026, not merged) would move MIP-16 to Review and change some details: `"all"` instead of `true` to select every field; `includeReverted` instead of `isTopLevel` as the trace and transfer filter; a `reverted` field on traces instead of `status`; `DELEGATECALL` and `CALLCODE` frames no longer count as transfers; empty `topics` entries act as wildcards; unknown request keys are rejected; and a normative appendix of Monad response schemas at `MONAD_TEN`. Pagination, joins, reorg handling and error codes are unchanged. Until it merges, the merged Draft above is the canonical text.

## Sources

- [Canonical MIP-16 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/5abe8ccd319828dfc999877f14af93012ee75f6f/MIPs/MIP-16.md): status, request and response shape, pagination, reorg handling and errors.
- [monad-crypto/MIPs #89](https://github.com/monad-crypto/MIPs/pull/89): open revision moving MIP-16 to Review.
- [monad-bft #2945](https://github.com/category-labs/monad-bft/pull/2945): open pull request adding the `monad-chain-data` crate behind the query methods.

## Discussion

https://forum.monad.xyz/t/mip-16-json-rpc-query-methods/546
