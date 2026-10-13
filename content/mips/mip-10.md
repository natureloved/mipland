# MIP-10: Deterministic RaptorCast

**Proposal status:** Draft

**Network status:** Rolling out. Since v0.16.2 (testnet September 3, 2026; mainnet September 10, 2026), nodes publish block proposals in the v1 format and still accept v0. That is stage 3 of the spec's four-stage rollout. Stage 4 (v1 only) is not in any release yet. Two spec rules, canonical tree depth and reserved bits (monad-bft #3247) and the `EncodingCommitment` fix (monad-bft #3248), merged on October 5, 2026 and are not in v0.16.2.

**Verified:** October 13, 2026, against the [canonical MIP-10 specification](https://github.com/monad-crypto/MIPs/blob/5abe8ccd319828dfc999877f14af93012ee75f6f/MIPs/MIP-10.md), the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases) and the [monad-bft source](https://github.com/category-labs/monad-bft).

## Summary

MIP-10, by Category Labs, changes how the round's leader (the spec calls it the author) splits a block proposal into Raptor-coded chunks and sends them to the other validators (Primary RaptorCast). v0 is the existing format; v1 is the deterministic one MIP-10 adds.

- **One root.** v0 groups chunks into batches of up to 32, each with its own Merkle tree and separately signed root, and lets an encoding symbol ID (ESI) sit at any leaf. v1 puts every chunk in one Merkle tree, with leaf `i` holding ESI `i`, and the root in the signed packet header. A block, its encoding scheme and the validator set fix exactly one encoding and one root.
- **Public chunk assignment.** In v0 the leader chooses which chunk goes to which validator and writes the recipient into each chunk. In v1 every validator derives the same assignment from the round, a 2,048 ms timestamp bucket and the leader's public key. The recipient field is no longer sent.
- **One commitment per round.** The `EncodingCommitment` covers the root, the encoding scheme variant, the round, the payload length and the timestamp. A validator records the first one it sees for a round and drops chunks carrying a different one.
- **Re-encode check.** After decoding a block, a validator re-encodes it and rejects it unless the root matches. It then treats the round as having no proposal.

The Raptor code itself, consensus voting, the quorum certificate format and execution do not change. Votes and timeouts stay on v0.

## Motivation

- A single root names the block, so packet-header authentication can be cached and reused across chunks instead of verifying each v0 batch signature.
- In v0 a Byzantine leader could hand some validators a deliberately bad set of ESIs (few degree-1 symbols) so they decode slowly, while others decode quickly. v1 takes the choice of assignment away from the leader. This "temporary asymmetric liveness" does not affect eventual liveness.
- It is groundwork for root voting (a forthcoming MIP), chunk-based sync of historical blocks from many peers, and portable equivocation evidence. None of these are specified by MIP-10.

## Parameters

| Encoding scheme parameter | Value |
| --- | --- |
| `encoding_scheme_variant` | `0x1` |
| Encoding | Raptor 10 (monad-raptor) |
| Redundancy `r` | 2.5 |
| Segment length | 1,440 bytes |
| Seed timestamp bucket | 2,048 ms |
| Merkle tree depth | 3 to 15 |

v1 packet format: 117-byte packet header, 4-byte chunk header (two zero bytes, then the ESI as little-endian u16), 20-byte Merkle hashes (BLAKE3 truncated to 20 bytes). The reference client also drops packets whose timestamp is more than 10,000 ms from its clock or whose round is more than 100 rounds from its current round; those are local policy, not part of the encoding. monad-bft caps a proposal at 3 MiB.

## Encoding

- `symbol_len(d) = 1440 - 117 - 4 - 20 × (d - 1)`. Every packet is exactly 1,440 bytes.
- `K(d) = ceil(app_message_len / symbol_len(d))` source symbols; `N(d) = ceil(K(d) × 2.5)`.
- The depth `d` is the smallest value in 3 to 15 with `2^(d-1) >= N(d) + |V|`, where `V` is the epoch validator set without the leader. A packet with any other depth is rejected.
- The tree has `2^(d-1)` leaves. Leaves past the last chunk hold 20 zero bytes. Each chunk carries a proof of `20 × (d - 1)` bytes, at most 280.
- Examples with 200 validators: 100 KB gives depth 10; 1 MiB gives depth 13 (K = 972, N = 2,430); 3 MiB gives depth 14 (K = 2,971, N = 7,428).

## Chunk assignment

1. Seed (32 bytes): `LE64(round) || LE64(floor(unix_ts_ms / 2048)) || leader_pubkey[1..17]` (bytes 1 to 16 of the 33-byte compressed key).
2. Sort `V` by compressed public key, then shuffle it with Fisher-Yates using ChaCha20 seeded with that value (20 rounds, counter and stream 0). This matches `rand_chacha::ChaCha20Rng` and `rand` 0.8's `shuffle`.
3. Each validator's obligation is `ceil(stake(v) × N / total_stake)`, computed in integers. The total `n` satisfies `N <= n < N + |V|`.
4. Deal chunk indices 0 to n-1 one at a time down the shuffled list, skipping validators whose obligation is used up.

The leader controls only the timestamp. Within the default ±10 s window, that reaches 10 or 11 buckets, so at most 11 possible assignments. It cannot assign a chosen chunk to a chosen validator.

## Validation

A validator accepts a Primary v1 chunk only if:

- The timestamp is within tolerance of its clock and the round is within its acceptance window.
- The header is canonical: v1 version, Primary mode, zero reserved bits, epoch matching the round, and the derived depth.
- The header signature is from the round's elected leader. The signature covers `BLAKE3(0x19 || "monad/raptorcast-chunk/1\n" || header)`.
- The chunk header's reserved bytes are zero, `i < 2^(d-1)`, and the Merkle proof for leaf `i` verifies against the root.
- The `EncodingCommitment` equals the one already recorded for this round, if any.
- `i < n`.

After decoding: `|B| = app_message_len` and re-encoding `B` reproduces the root.

What each check catches: a stale timestamp (timeliness), a non-minimal depth that would give a second encoding of the same block (canonical header), a header signed by someone other than the leader (author), a second commitment in the same round (commitment consistency), and a root built from leaves of two different blocks (re-encode check). Two signed headers with different commitments for one round are evidence the leader equivocated; MIP-10 adds no penalty for it.

## Rollout

1. Accept v0 only (before MIP-10).
2. Accept both, publish v0. Shipped in v0.15.2 on testnet July 27, 2026; the release notes call this "rollout deterministic stage 1".
3. Accept both, publish v1. Shipped in v0.16.2 (testnet September 3, mainnet September 10, 2026). Current stage.
4. Accept v1 only. Not released.

Each stage must be fully adopted before the next. Nodes one stage apart interoperate; nodes two or more stages apart do not.

## Sources

- [Canonical MIP-10 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/5abe8ccd319828dfc999877f14af93012ee75f6f/MIPs/MIP-10.md): proposal status, parameters, encoding, assignment, validation and rollout stages.
- [Monad release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-16-2): v0.15.2 (stage 2 on testnet) and v0.16.2 (stage 3 on testnet and mainnet).
- [monad-bft #2811](https://github.com/category-labs/monad-bft/pull/2811), [#3177](https://github.com/category-labs/monad-bft/pull/3177), [#3247](https://github.com/category-labs/monad-bft/pull/3247), [#3248](https://github.com/category-labs/monad-bft/pull/3248): reference implementation, stage 3 rollout, and the two October 5 fixes.

## Discussion

https://forum.monad.xyz/t/mip-10-deterministic-raptorcast/453
