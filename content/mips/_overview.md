# Monad Improvement Proposals (MIPs)

MIPs are the formal mechanism for proposing changes to the Monad protocol. Each
MIP describes a self-contained change to the EVM execution layer, gas schedule,
storage model, or consensus interface, along with rationale, compatibility
notes, and a path to activation.

## Currently live on mipland.org

- **MIP-3: Linear Memory.** Final, active on Monad mainnet since the
  MONAD_NINE upgrade on March 19, 2026. Replaces the EVM's quadratic
  memory-expansion cost with a linear one, and caps memory at 8 MB per
  transaction, shared across call frames; see `mip-3.md`.
- **MIP-4: Reserve Balance Introspection.** Final, active on Monad mainnet
  since MONAD_NINE on March 19, 2026. Adds a precompile at `0x1001` that lets a
  contract check mid-execution whether the transaction would fail the reserve
  balance check; see `mip-4.md`.
- **MIP-7: Extension Opcodes.** In Review, not active on any network. Reserves
  opcode `0xAE` as a prefix for Monad-specific opcodes, so they can't collide
  with future Ethereum opcodes; see `mip-7.md`.
- **MIP-8: Page-ified Storage.** Final, active on Monad mainnet since the
  MONAD_TEN upgrade on September 2, 2026. Groups 128 storage slots into 4 KB
  pages and charges cold access per page instead of per slot; see `mip-8.md`.
- **MIP-11: Automatic Priority Fee Distribution.** Draft, not active on any
  network. Sends each block's priority fees to the leading validator's staking
  pool instead of its beneficiary address. The spec leaves the minimum amount
  and commission handling unclear; see `mip-11.md`.
- **MIP-12: Decrease Block Time.** Final; its 400ms to 300ms target vote pace
  activated on Monad mainnet at round 89,758,000 (July 23, 2026). Per-block
  transaction, gas, and byte limits fell 25%; the block reward fell from 25 to
  18 MON (28%). At the nominal cadence, capacity limits per second stay the
  same while rewards change from 62.5 to 60 MON per second. Target cadence does
  not guarantee observed latency or finality; see `mip-12.md` for dated sources.
- **MIP-15: Glamsterdam EIP Activation.** In Review, not active on any
  network. Adopts six EIPs from Ethereum's Glamsterdam upgrade (EIP-7708,
  EIP-7843, EIP-7981, EIP-7997, EIP-8024, EIP-8246) and explains why Monad
  leaves the others out; see `mip-15.md`.
- **MIP-18: Call Stack Introspection Opcodes.** In Review, not active on any
  network. Adds `CALLSTACKDEPTH` (`0xAE 0x00`) and `CALLERN` (`0xAE 0x01`)
  under MIP-7's extension prefix, 2 gas each; see `mip-18.md`.

Other proposals in the monad-crypto/MIPs repository have no explainer on
mipland.org yet. The home page lists every MIP and MRC with its current
status.
