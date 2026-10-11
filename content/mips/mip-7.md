# MIP-7: Extension Opcodes

**Proposal status:** Review

**Network status:** No activation evidence in this bundle. The official release notes record no MIP-7 activation on any network.

**Verified:** October 11, 2026, against the [canonical MIP-7 specification](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-7.md) and the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases).

**Summary:** Reserves opcode `0xAE` (`EXTENSION`) as a prefix for Monad-specific
opcodes, so new opcodes can be added without colliding with future Ethereum
upgrades. Aligns with EIP-8163, which reserves the same opcode on Ethereum L1
for non-L1 chains.

## Motivation

Monad currently has no opcodes that Ethereum lacks, but future Monad features
may need them. An early version of MIP-4 proposed an opcode for reserve balance
checks; MIP-4 switched to a precompile, and the design discussion led to MIP-7.

If Monad put new opcodes in unused byte values, a later Ethereum upgrade could
assign the same byte to something else. Monad would then have to work around
the clash or give up compatibility. EIP-8163 reserves `0xAE` on Ethereum L1 so
that non-L1 chains can extend the EVM there safely. MIP-7 adopts it.

## Specification

- `0xAE` (`EXTENSION`) must be followed by a 1-byte extension selector. The
  2-byte sequence `0xAE XX` is an extended opcode.
- A selector of `0x5B` (`JUMPDEST`) or `0x60`-`0x7F` (`PUSH1`-`PUSH32`) causes
  an exceptional halt that consumes all remaining gas.
- A `0xAE` byte at the very end of the code has no selector. It also causes an
  exceptional halt that consumes all remaining gas. This rule was added on
  October 1, 2026.
- Until a later MIP assigns a selector, executing it behaves like `INVALID`
  (`0xFE`): all gas is consumed and the call reverts.
- No selector is assigned yet. MIP-18 (in Review) proposes `0x00` for
  `CALLSTACKDEPTH` and `0x01` for `CALLERN`; see `mip-18.md`.
- That leaves 223 usable selectors (256 minus `0x5B` and the 32 `PUSH` bytes).
  The explainer rounds this to about 220.
- MIP-7 sets no gas costs. Each MIP that assigns a selector sets its own.

### Immediate arguments

A MIP that defines an extension needing immediate arguments must use one of two
encodings:

- **Restricted-range immediates:** `0xAE XX a1 a2 ...`. Argument bytes follow
  the selector directly. None may be `0x5B` or `0x60`-`0x7F`. The number of
  argument bytes is fixed per selector. Compact, but not every byte value is
  allowed.
- **PUSH-prefix immediates:** `0xAE XX PUSHn b1 ... bn`. A `PUSHn` byte frames
  the next n argument bytes (n = opcode - `0x5F`), and those bytes can take any
  value `0x00`-`0xFF`. Costs one extra byte.

In either style, an extended opcode followed by incorrectly encoded bytes
behaves like `INVALID`.

Extensions with no immediate arguments, such as both MIP-18 opcodes, use
neither encoding.

## Rationale

- **JUMPDEST analysis is unchanged.** `0xAE` does not consume the bytes after
  it during jump destination analysis, unlike an earlier draft that treated the
  selector like a `PUSH1` immediate. That draft would have made Monad and
  Ethereum disagree on which `0x5B` bytes are valid jump targets. The excluded
  selector and argument byte ranges exist for the same reason: they are the
  bytes that analysis treats specially.
- **Why not take the selector from the stack:** a stack-based design would be
  simpler to upstream but slower, since dispatching on a 32-byte stack word
  leaves the interpreter's fast path. It would also let the opcode be chosen at
  runtime, which blocks static analysis. The spec notes Monad's native-code
  compiler could inline `PUSH1 0xXX; EXTENSION`, but chose immediates anyway.
- **Opcodes versus precompiles:** precompiles cannot collide with Ethereum
  opcodes, but calling one costs ABI encoding overhead that some features
  cannot afford.

## Backwards compatibility

`0xAE` is invalid today on both Ethereum and Monad, and JUMPDEST analysis is
unaffected, so no existing code changes behavior. On both chains a `0x5B` right
after `0xAE` stays a valid jump destination.

## Sources

- [Canonical MIP-7 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-7.md): proposal status (Review since October 5, 2026), encoding rules, argument encodings, rationale and compatibility.
- [EIP-8163](https://eips.ethereum.org/EIPS/eip-8163): reserves `0xAE` on Ethereum L1 for non-L1 extensions.
- [Monad release notes](https://docs.monad.xyz/developer-essentials/changelog/releases): no MIP-7 activation listed as of the verification date.

## Discussion link

https://forum.monad.xyz/t/mip-7-extension-opcodes/387
