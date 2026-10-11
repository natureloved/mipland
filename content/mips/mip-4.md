# MIP-4: Reserve Balance Introspection

**Proposal status:** Final

**Network status:** Activated with the MONAD_NINE upgrade on Monad mainnet on March 19, 2026, 14:30 UTC, and on testnet on March 10, 2026, 14:30 UTC.

**Verified:** October 11, 2026, against the [canonical MIP-4 specification](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-4.md) and the [official v0.13.0 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-13-0-monad_nine).

**Summary:** Lets the protocol detect reserve balance violations mid-execution
rather than only at the end of a transaction.

## Motivation

Monad reverts a transaction that leaves any touched account below its reserve
balance, but it checks only after execution. Contracts had no way to know
mid-execution that they were in violation. With the precompile they can
restore balances, take another code path, or revert early with a useful error.

## Specification

- Precompile at `0x1001` with one method:
  `function dippedIntoReserve() external returns (bool);`
  Selector `0x3a61584e`. Costs 100 gas, the same as one `TLOAD`.
- It returns whether the current state would fail the reserve balance check,
  considering every account touched in the transaction at any call depth. The
  result is an ABI-encoded `bool`.
- It must be called with `CALL`. `STATICCALL`, `DELEGATECALL`, `CALLCODE` and
  EIP-7702 delegations to the address revert. The interface method is
  deliberately not `view`, so Solidity compiles the call to `CALL`.
- Calldata must be exactly the 4-byte selector. Shorter or different calldata
  reverts with "method not supported". Extra bytes after the selector revert
  with "input is invalid". A nonzero value reverts with "value is nonzero".
- When several conditions apply, they are checked in this order: not `CALL`,
  gas below 100, calldata shorter than 4 bytes, wrong selector, nonzero value,
  calldata longer than 4 bytes.
- Every revert consumes all gas given to the call frame, as Ethereum
  precompiles do.

## Backwards compatibility

The precompile is new and changes no existing behavior. Contracts that don't
call it are unaffected.

## Sources

- [Canonical MIP-4 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-4.md): proposal status, interface, call and revert rules.
- [Monad v0.13.0 (MONAD_NINE) release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-13-0-monad_nine): MIP-4 is gated by the MONAD_NINE revision, activated at timestamp 1773153000 on testnet and 1773930600 on mainnet.

## Discussion link

https://forum.monad.xyz/t/mip-4-reserve-balance-introspection/363
