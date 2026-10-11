# MIP-11: Automatic Priority Fee Distribution

**Proposal status:** Draft

**Network status:** Not activated on any network. The official release notes list no MIP-11 activation. The staking docs still describe priority fees going only to the validator.

**Verified:** October 11, 2026, against the [canonical MIP-11 specification](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-11.md), the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases) and the [staking API reference](https://docs.monad.xyz/reference/staking/api).

## Summary

Today a block's priority fees are credited to the validator's beneficiary address. MIP-11 sends them to the validator's staking pool at the end of each block, so delegators get a share automatically.

## Motivation

A validator can already share priority fees by calling `externalReward` on the staking precompile. The spec says this needs extra infrastructure (sweeping the beneficiary balance, paying gas, meeting the minimum amount) and that in practice most validators don't do it.

## Specification

- Priority fees from every transaction in the block are credited to a distribution account at `0xfee5fee5fee5fee5fee5fee5fee5fee5fee5fee5` instead of the beneficiary.
- At the end of the block the protocol calls `syscall_distribute` on the distribution account. No transaction can call it. It sends the account's full balance to `external_rewards` on the staking contract, for the validator that led the block.
- The block proposer still sets the beneficiary, and `block.coinbase` still returns it.
- Blocks with no priority fees make no distribution.

## Backwards compatibility

- Priority fees no longer show up as a credit to the `block.coinbase` balance.
- Third-party delegation contracts get a smaller share of priority fees if users stake with the validator pool directly instead of through them.
- The spec says `external_rewards` "will be modified so that it removes the commission fee when called." It does not say whether this means commission will be deducted from priority fees or not. Today `externalReward` deducts no commission.

## Minimum amount

The spec says `external_rewards` requires a minimum of `dust_threshold` and that "sub-threshold fees are burned." Two values in the current staking docs could be meant:

- `DUST_THRESHOLD`, the minimum per delegation: 1 gwei (1e9 wei).
- The current `externalReward` minimum: 1 MON (`msg.value` must be between 1 MON and 1,000,000 MON).

The spec does not say which one applies, or whether the 1 MON minimum changes. The difference is large. In a sample of 200 mainnet blocks (every 1,440th block from 112,115,098 to 112,401,658, October 10 to 11, 2026):

- Priority fees per block: median 0.050 MON, mean 0.130 MON, maximum 2.44 MON.
- 197 of 200 blocks had less than 1 MON in priority fees. Those blocks held 76% of all priority fees in the sample.
- No block had less than 1 gwei.

At a 1 MON minimum, most priority fees would be burned. At 1 gwei, none of the sampled blocks would lose any.

For scale, the inflationary block reward is 18 MON. The sampled mean priority fee is about 0.7% of that.

## Sources

- [Canonical MIP-11 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-11.md): Draft status, distribution account, execution flow, `dust_threshold` and commission wording.
- [Staking API reference](https://docs.monad.xyz/reference/staking/api): `externalReward` bounds (1 MON to 1,000,000 MON, no commission), `DUST_THRESHOLD` (1 gwei), `REWARD` (18 MON).
- [Staking overview](https://docs.monad.xyz/monad-arch/consensus/staking): priority fees currently go only to the validator.
- [Gas pricing](https://docs.monad.xyz/developer-essentials/gas-pricing): fees are charged on the gas limit, which the priority fee sample uses.
- Priority fee sample: `eth_getBlockByNumber` on `https://rpc.monad.xyz`, summing gas limit times effective priority fee per gas for each transaction.

## Discussion

https://forum.monad.xyz/t/mip-11-automatic-priority-fee-distribution/419
