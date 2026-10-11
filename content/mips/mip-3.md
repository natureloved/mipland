# MIP-3: Linear Memory

**Proposal status:** Final

**Network status:** Activated with the MONAD_NINE upgrade on Monad mainnet on March 19, 2026, 14:30 UTC, and on testnet on March 10, 2026, 14:30 UTC.

**Verified:** October 11, 2026, against the [canonical MIP-3 specification](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-3.md) and the [official v0.13.0 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-13-0-monad_nine).

**Summary:** Replaces the EVM's quadratic memory-expansion cost with a linear
model, so large memory regions become predictable to price.

## Motivation

Ethereum bounds memory with a quadratic expansion cost and the 63/64 rule. The
theoretical memory limit of a transaction is at least 26 MB, while historical
transactions average about 2 KB and peak around 2 MB. Benchmarks show the
quadratic formula overcharges for the resources memory actually uses.

## Specification

- Memory expansion cost is linear: `memory_cost = memory_size_words // 2`,
  where `memory_size_words = (memory_byte_size + 31) // 32`.
- Memory is capped at 8 MB per transaction, shared across call frames. A child
  call can use `8 * 1024 * 1024 - j - k` bytes, where `k` is the current
  call's memory and `j` is the memory held by its parent calls.
- When a call returns, its memory goes back to the pool.
- A call that exceeds the remaining memory halts exceptionally and consumes all
  gas left in that call frame. It does not revert with return data. (The spec
  said "reverts" until July 28, 2026.)

## Backwards compatibility

Almost all contracts behave the same. ERC-4337 contracts keep working because
child call memory is released when the call returns. Contracts that allocate
more than 8 MB now halt exceptionally.

## Sources

- [Canonical MIP-3 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-3.md): proposal status, cost formula, 8 MB pool rules.
- [Monad v0.13.0 (MONAD_NINE) release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-13-0-monad_nine): MIP-3 is gated by the MONAD_NINE revision, activated at timestamp 1773153000 on testnet and 1773930600 on mainnet.

## Discussion link

https://forum.monad.xyz/t/mip-3-linear-evm-memory-cost/362
