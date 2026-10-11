# Reviewing upstream MIP changes

Run `pnpm check:mip-upstream` with Node 22. The command checks every MIP
covered by the Markdown knowledge bundle against `monad-crypto/MIPs`.
`GITHUB_TOKEN` is optional locally and avoids the unauthenticated API rate limit.

The checker resolves upstream `main` once, then checks each canonical file at
that immutable commit. Each request has a 10-second deadline, including its
response body. The report links the recorded baseline and current source.

Exit codes: **0** means all file hashes match, **1** means an explainer review
is needed, **2** means a check failed (including missing files, malformed data
and API failures). Errors take precedence when some files also changed.

The daily/manual **MIP upstream review** workflow publishes the same report in
its job summary, uses read-only permissions and fails on either review or error.
It does not edit knowledge, move baselines or open issues. Ordinary PR tests
stay offline; they also check manifest coverage against `MARKDOWN_MIP_SLUGS`.
The existing required CI job remains `test`.

## Current baseline

Every covered MIP was reviewed against upstream commit
`282d18125d6590447d9229550887581385649e48` on October 11, 2026. Before that,
the manifest held a June 15, 2026 snapshot (`d2fe408`) that was never moved
after the October 4 content corrections, so the daily check kept failing.
Bump the baseline in the same change that reviews the content.

## Record a reviewed baseline

1. Follow the report's source links and review the change against the HTML
   explainer and `content/mips/mip-N.md`. Interpret its impact and update the
   affected explanation through the usual reviewed PR process.
2. Copy the report's full **current specification revision**. For each reviewed
   file, get its blob hash at that exact revision:

   ```bash
   gh api "repos/monad-crypto/MIPs/contents/MIPs/MIP-12.md?ref=<full-commit>" --jq .sha
   ```

3. Update that entry's `reviewedCommit` and `reviewedBlobSha` together.
   `reviewedCommit` is the immutable commit used by the source link;
   `reviewedBlobSha` is the Contents API's file-content hash, not a commit.
   Keep unreviewed entries at their earlier baselines.
4. Run `pnpm test` and the checker, then include the review rationale in the PR.
   Changes after the inspected revision will still be detected.

These baselines track **specifications only**. An unchanged spec does not mean
unchanged rollout or network activation. Establish activation separately from
dated, network-specific evidence; do not infer it from a Final status or a
matching source hash.
