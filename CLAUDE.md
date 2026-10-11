# MIP chat widget

> MOST contributors: read https://most.devnads.com/agents.md before opening an issue or a PR here.

> Before writing or editing any user-facing copy, read [`NOSLOP.md`](./NOSLOP.md).
> Run `pnpm check:slop` after copy changes; CI fails on banned phrasing.

Floating chat button on the site, with full control over knowledge and replies.
Code is in place; infra wiring is documented in [`SETUP.md`](./SETUP.md).

## How it works

```
content/mips/*.md
  └─► src/lib/ai/knowledge.ts          (concatenates + memoizes)
                                       │
src/lib/ai/config.ts ──► Edge Config   │
  (DEFAULT_CONFIG fallback,            │
   SILORAIL_MODEL env overrides model) │
                                       ▼
src/app/api/chat/route.ts ──► SiloRail (@silorail/sdk, src/lib/ai/silorail.ts)
   ▲                            system = instructions + knowledge bundle
   │ BotID + rate-limit         paid per call via x402 from SILORAIL_WALLET_KEY
   │ (in-memory)                OpenAI-style SSE → AI SDK UI message stream
   │
src/components/MipChat.tsx ──► useChat({ api: "/api/chat" })
   (mounted globally in src/app/layout.tsx)

src/app/admin/chat/page.tsx ──► Server Action ──► Vercel REST API ──► Edge Config
   (gated by HTTP Basic Auth in src/middleware.ts)
```

## Locked-in decisions

- **Knowledge source:** local markdown in `content/mips/` (one file per MIP +
  `_overview.md`); authored/edited in this repo. Each file's spec revision is
  tracked in `upstream-sources.json` and checked daily against
  `monad-crypto/MIPs` (see `docs/mip-upstream-review.md`).
- **Corpus scale:** small (about 4.5k tokens in October 2026) — stuff everything
  into the system prompt each request. No RAG. Re-evaluate past ~30k tokens.
- **Model gateway:** SiloRail, not Vercel AI Gateway. The route signs an x402
  payment per call from `SILORAIL_WALLET_KEY` (USDC on the SiloRail network).
  Vercel deployments must set the key; the route refuses the local
  `~/.silorail/key` fallback there.
- **Default model:** `openrouter/free` on the testnet gateway
  (`https://testnet.silorail.com`), which only serves free models. Production
  sets `SILORAIL_GATEWAY_URL=https://mainnet.silorail.com` and a paid model
  (e.g. `deepseek/deepseek-v4-pro`). Precedence: `SILORAIL_MODEL` env, then the
  Edge Config `model` field, then the code default.
- **Reply control:** runtime-editable from `/admin/chat`, backed by Vercel Edge
  Config under the key `chat`. The evidence rule and today's date are appended
  in `src/lib/ai/instructions.ts`, so an admin prompt cannot drop them.
- **Admin auth:** HTTP Basic Auth in `src/middleware.ts`, scoped to
  `/admin/:path*`. Password from `ADMIN_PASSWORD` env. Fails closed in
  production if the env is missing; fails open in dev for local convenience.
  (Vercel's Deployment Protection only supports whole-deployment gating on
  our plan — can't scope to `/admin/*` — hence the small code-level gate.)
- **UI primitives:** shadcn (manually initialized — `globals.css` keeps the
  existing MIP palette, shadcn tokens appended alongside) + AI Elements
  (`conversation`, `message`, `prompt-input`).

## Cost controls (baked in)

- **SiloRail budget caps:** `SILORAIL_PER_CALL_MAX_MICRO_USD` and
  `SILORAIL_SESSION_MAX_MICRO_USD` (micro-USDC, `50000` = $0.05) are client-side
  caps; a breach returns 402. The signed x402 authorization is the
  gateway-enforced upper bound.
- **`maxTokens` cap** on responses (default 600), temperature 0.2.
- **Per-IP rate limit** in `src/lib/ai/ratelimit.ts`: in-memory token bucket
  (10 req/min, burst 10). Map-backed, persists across requests on the same
  Fluid Compute instance. Imprecise when Vercel scales out (effective limit is
  `10/min × N_instances`) — swap to a shared store if abuse becomes real.
- **Vercel BotID** on `/api/chat` (basic level, free) — blocks
  scrapers/headless bots at the edge. Registered in
  `instrumentation-client.ts` via `initBotId({ protect: [...] })`, checked
  server-side with `await checkBotId()` at the top of the route.
- **Admin-tunable model** — switch the `model` field in Edge Config to any
  model the SiloRail gateway serves, without a deploy (unless `SILORAIL_MODEL`
  is set, which wins).

There is no prompt caching control in the route; whether repeated system
prompts are cached depends on the upstream provider SiloRail routes to.

## Cost controls (deferred until real traffic)

- **Keyword pre-filter** if `content/mips/` grows past ~30k tokens — match
  the question against MIP titles/summaries before injecting files.
- **Shared rate-limit store** if per-instance limits prove too loose.
