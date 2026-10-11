# MIP-18: Call Stack Introspection Opcodes

**Proposal status:** Review

**Network status:** Not activated on any network. The official release notes list no MIP-18 activation. MIP-18 requires MIP-7, which is also in Review and not active.

**Verified:** October 11, 2026, against the [canonical MIP-18 specification](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-18.md) and the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases).

## Summary

MIP-18 adds two opcodes under MIP-7's `EXTENSION` (`0xAE`) prefix. `CALLSTACKDEPTH` returns how deep the current call frame is. `CALLERN` returns the caller of an ancestor frame, `n` frames above the current one.

## Motivation

The spec gives one reason: the opcodes "are intended to support future Monad protocol upgrades under development at Category Labs." It does not name those upgrades.

## Opcodes

| Extended opcode | Mnemonic | Stack input | Stack output | Gas |
| --- | --- | --- | --- | --- |
| `0xAE 0x00` | `CALLSTACKDEPTH` | none | `depth` | 2 |
| `0xAE 0x01` | `CALLERN` | `n` | `caller` | 2 |

- Neither opcode takes immediate arguments. The byte after the selector is the next instruction.
- The 2 gas covers the whole extended opcode. The `0xAE` prefix is not charged separately.
- Both read data the client already keeps in memory during the transaction, so they run in constant time. The cost matches `CALLER` and `ADDRESS`.

## Semantics

- Every message gets a call frame: the transaction's top-level message, and each `CALL`, `CALLCODE`, `DELEGATECALL`, `STATICCALL`, `CREATE` and `CREATE2`. Calls to precompiles also count toward depth, but no code runs in those frames to observe it.
- Frames are numbered `F_0` (the top-level message) to `F_d` (the frame currently executing). `d` is the depth, and `CALLSTACKDEPTH` pushes it. Depth is 0-based.
- `CALLERN` pops `n`. If `n <= d` it pushes the value `CALLER` returns in frame `F_{d-n}`. If `n > d` it pushes `0` and does not halt, the same way `BLOCKHASH` handles out-of-range lookups.
- `CALLERN(0)` equals `CALLER`. `CALLERN(CALLSTACKDEPTH)` equals `ORIGIN`.
- `CALLERN` reports what `CALLER` would return in each ancestor frame. `DELEGATECALL` and `CALLCODE` keep the caller of the frame that made them, so the same address can appear at two consecutive indices.
- `n` comes from the stack instead of an immediate so it can be computed at runtime, for example from `CALLSTACKDEPTH`.

## Backwards compatibility

Under MIP-7, `0xAE 0x00` and `0xAE 0x01` currently behave like `INVALID`. Code that runs them halts today and would run successfully after MIP-18. No such code is expected to exist because the sequences have never had defined behavior on Monad or Ethereum. `JUMPDEST` analysis is unaffected.

## Security considerations

- **Authorization.** Checking `CALLERN(n)` for `n > 0` has the same weakness as checking `ORIGIN`. If an attacker gets a privileged account to call an attacker-controlled contract, that contract can call onward and the privileged account still shows up at `CALLERN(1)`. The spec says contracts SHOULD NOT use `CALLERN(n)` with `n > 0` for authorization.
- **Context-dependent behavior.** Both opcodes let a contract behave differently depending on how it was reached. Transaction simulation, account abstraction validation and static analysis tools that assume behavior depends only on the immediate caller, calldata and state may need updating.
- **Call depth.** `CALLSTACKDEPTH` exposes the depth directly. The 63/64 gas forwarding rule already makes the 1024 depth limit unreachable in practice, so the spec does not expect new griefing vectors.

## Sources

- [Canonical MIP-18 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-18.md): proposal status, selectors, gas costs, semantics and security considerations.
- [MIP-7 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-7.md): the `EXTENSION` prefix both opcodes use.
- [Monad release notes](https://docs.monad.xyz/developer-essentials/changelog/releases): no MIP-18 activation listed as of the verification date.

## Discussion

https://forum.monad.xyz/t/mip-18-callstackdepth-and-callern-call-stack-introspection-opcodes/556
