"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  assignChunks,
  bytesToHex,
  reachableBuckets,
  TIMESTAMP_BUCKET_MS,
  TIMESTAMP_TOLERANCE_MS,
  type Validator,
} from "./raptorcast";

// Made-up compressed public keys. Letters follow the canonical (sorted) order.
const AUTHOR_KEY = "0298d497e194b312f05bc5170d6a2983b2e53dd10ee4fd7c6ecb52b3cd53ce7ad2";
const VALIDATORS = [
  { name: "A", pubkey: "021465136776e9bb44ffa370b073cbe258d32e8d4b7534d7180dd999b9363e4f40", uneven: 5, color: "#2a7d6a" },
  { name: "B", pubkey: "021f4986e4db016bc3afe62e5574e02e5f1a2b924bd53165ed92ef3f457016da2c", uneven: 32, color: "#c4653a" },
  { name: "C", pubkey: "02957eeced89246bd71128bdf8c7ec71b7522edb9b045e2be64ebcda9154a7e5b3", uneven: 9, color: "#3b7dd8" },
  { name: "D", pubkey: "02c6d04cdc2e96282db7df3f673145039bfce7c9d932bbeed0d485b1174820c59a", uneven: 12, color: "#8a5cc2" },
  { name: "E", pubkey: "0329c80fc00da7371d156844f1d407a62e552645e887890e27e6bfa62c6b53f4ff", uneven: 6, color: "#a8841a" },
  { name: "F", pubkey: "0370458fb3d9300074eeb38fa06f3f1b13cd4565e4716aac0a451f42aef417538c", uneven: 18, color: "#d0537a" },
  { name: "G", pubkey: "03a05c0e0b0f9c49372ff1dd3a77e7646d2f441d9a5678288d8cd4b35d42976b84", uneven: 10, color: "#5b8c2a" },
  { name: "H", pubkey: "03b68936c3411179190f18ab6923189d8a3a6f5f2f8d452dc5d5ebe314dde9a034", uneven: 8, color: "#6b6259" },
];
const BY_KEY = new Map(VALIDATORS.map((v) => [v.pubkey, v]));
const STAKE_UNIT = BigInt(100_000); // MON

// A fixed "now" for the validator's clock, so the page renders the same everywhere.
const CLOCK_MS = 1_791_900_000_000;
const START_ROUND = 97_400_000;
const OFFSET_STEP = 128;

type Preset = "equal" | "uneven";

export default function AssignmentSection() {
  const { t } = useLanguage();
  const [sizeKb, setSizeKb] = useState(24);
  const [preset, setPreset] = useState<Preset>("uneven");
  const [round, setRound] = useState(START_ROUND);
  const [offset, setOffset] = useState(0);
  const [highlight, setHighlight] = useState<string | null>(null);

  const ts = CLOCK_MS + offset;
  const bucket = Math.floor(ts / TIMESTAMP_BUCKET_MS);
  const buckets = reachableBuckets(CLOCK_MS);

  const result = useMemo(() => {
    const validators: Validator[] = VALIDATORS.map((v) => ({
      pubkey: v.pubkey,
      stake: BigInt(preset === "equal" ? 12 : v.uneven) * STAKE_UNIT,
    }));
    return assignChunks(sizeKb * 1024, validators, AUTHOR_KEY, BigInt(round), BigInt(ts));
  }, [sizeKb, preset, round, ts]);

  if (!result) return null;
  const { layout, seed, order, obligations, owners } = result;
  const totalStake = order.reduce((a, v) => a + v.stake, BigInt(0));
  const seedHex = bytesToHex(seed);
  const fmt = (n: number) => n.toLocaleString("en-US");

  const pickBucket = (b: number) => {
    // Middle of the bucket, kept inside the ±10 s window and on the slider's grid.
    const mid = b * TIMESTAMP_BUCKET_MS + TIMESTAMP_BUCKET_MS / 2 - CLOCK_MS;
    const clamped = Math.max(-TIMESTAMP_TOLERANCE_MS, Math.min(TIMESTAMP_TOLERANCE_MS, mid));
    setOffset(Math.round(clamped / OFFSET_STEP) * OFFSET_STEP);
  };

  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip10.assign.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip10.assign.subtitle")}
          </p>
        </motion.div>

        {/* Controls */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <label className="block">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary">
              {t("mip10.assign.blockSize")}
            </span>
            <span className="block font-mono text-lg font-semibold tabular-nums">{sizeKb} KB</span>
            <input
              type="range"
              min={4}
              max={64}
              step={2}
              value={sizeKb}
              onChange={(e) => setSizeKb(Number(e.target.value))}
              className="w-full accent-solution-accent"
            />
          </label>

          <div>
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary">
              {t("mip10.assign.stakes")}
            </span>
            <div className="flex gap-2 mt-2" role="tablist">
              {(["equal", "uneven"] as const).map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={p === preset}
                  onClick={() => setPreset(p)}
                  className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    p === preset
                      ? "bg-text-primary text-surface border-text-primary"
                      : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
                  }`}
                >
                  {t(`mip10.assign.${p}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary">
              {t("mip10.assign.round")}
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={() => setRound(round - 1)}
                aria-label={t("mip10.assign.prevRound")}
                className="font-mono text-sm w-7 h-7 rounded-md border border-border bg-surface"
              >
                −
              </button>
              <span className="font-mono text-sm tabular-nums">{fmt(round)}</span>
              <button
                onClick={() => setRound(round + 1)}
                aria-label={t("mip10.assign.nextRound")}
                className="font-mono text-sm w-7 h-7 rounded-md border border-border bg-surface"
              >
                +
              </button>
            </div>
          </div>

          <label className="block">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary">
              {t("mip10.assign.timestamp")}
            </span>
            <span className="block font-mono text-sm tabular-nums mt-1">
              {offset >= 0 ? "+" : "−"}
              {fmt(Math.abs(offset))} ms{" "}
              <span className="text-text-tertiary">{t("mip10.assign.vsClock")}</span>
            </span>
            <input
              type="range"
              min={-TIMESTAMP_TOLERANCE_MS}
              max={TIMESTAMP_TOLERANCE_MS}
              step={OFFSET_STEP}
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              className="w-full accent-solution-accent"
            />
          </label>
        </div>

        <p className="font-mono text-xs text-text-secondary text-center mb-6 tabular-nums">
          K = {layout.k} · N = {layout.n} · n = {owners.length} · {t("mip10.assign.depth")} {layout.depth} ·{" "}
          {layout.slots} {t("mip10.assign.slots")} · {fmt(layout.symbolLen)} {t("mip10.assign.symbol")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4">
          {/* Seed and shuffled order */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-2">
              1 · {t("mip10.assign.seed")}
            </p>
            <p className="font-mono text-[11px] break-all leading-relaxed mb-1">
              <span className="text-user-accent">{seedHex.slice(0, 16)}</span>
              <span className="text-problem-accent-strong">{seedHex.slice(16, 32)}</span>
              <span className="text-solution-accent">{seedHex.slice(32)}</span>
            </p>
            <p className="font-mono text-[10px] text-text-tertiary mb-5">
              <span className="text-user-accent">{t("mip10.assign.seedRound")}</span> ·{" "}
              <span className="text-problem-accent-strong">
                {t("mip10.assign.seedBucket")} {fmt(bucket)}
              </span>{" "}
              · <span className="text-solution-accent">{t("mip10.assign.seedKey")}</span>
            </p>

            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-2">
              2 · {t("mip10.assign.order")}
            </p>
            <div className="space-y-1">
              {order.map((v, i) => {
                const meta = BY_KEY.get(v.pubkey)!;
                const active = highlight === v.pubkey;
                return (
                  <button
                    key={v.pubkey}
                    onClick={() => setHighlight(active ? null : v.pubkey)}
                    aria-pressed={active}
                    className={`w-full flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
                      active ? "border-text-primary bg-surface-elevated" : "border-transparent hover:border-border"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: meta.color }} />
                    <span className="font-semibold w-4 text-left">{meta.name}</span>
                    <span className="text-text-tertiary">0x{v.pubkey.slice(0, 6)}…</span>
                    <span className="ml-auto text-text-secondary tabular-nums">
                      {Number((v.stake * BigInt(1000)) / totalStake) / 10}% {t("mip10.assign.stake")}
                    </span>
                    <span className="w-16 text-right tabular-nums">
                      {obligations[i]} {t("mip10.assign.chunks")}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="font-mono text-[10px] text-text-tertiary mt-2">{t("mip10.assign.highlightHint")}</p>
          </div>

          {/* Leaf slots */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-3">
              3 · {t("mip10.assign.tree")}
            </p>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: layout.slots }, (_, i) => {
                if (i >= owners.length) {
                  return (
                    <span
                      key={i}
                      title={`${i}: ${t("mip10.assign.padding")}`}
                      className="w-6 h-6 rounded border border-dashed border-border"
                    />
                  );
                }
                const v = order[owners[i]];
                const meta = BY_KEY.get(v.pubkey)!;
                const dim = highlight !== null && highlight !== v.pubkey;
                return (
                  <span
                    key={i}
                    title={`ESI ${i} → ${meta.name}`}
                    className="w-6 h-6 rounded inline-flex items-center justify-center font-mono text-[9px] text-white tabular-nums transition-all duration-300"
                    style={{ backgroundColor: meta.color, opacity: dim ? 0.15 : 1 }}
                  >
                    {i}
                  </span>
                );
              })}
            </div>
            <p className="font-mono text-[10px] text-text-tertiary mt-3">
              {layout.slots - owners.length} × {t("mip10.assign.padding")}
            </p>
            <div className="mt-4 space-y-2 text-xs text-text-secondary leading-relaxed">
              <p>{t("mip10.assign.dealNote")}</p>
              <p>{t("mip10.assign.obligationNote")}</p>
            </div>
          </div>
        </div>

        {/* Grinding */}
        <div className="mt-4 rounded-2xl border border-problem-accent/30 bg-problem-bg p-4 sm:p-5">
          <p className="font-mono text-[11px] tracking-widest uppercase text-problem-accent-strong mb-2">
            {t("mip10.assign.grindTitle")}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-3xl">
            {t("mip10.assign.grindDesc")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {buckets.map((b) => (
              <button
                key={b}
                onClick={() => pickBucket(b)}
                aria-pressed={b === bucket}
                className={`font-mono text-[11px] px-2 py-1 rounded border tabular-nums transition-colors ${
                  b === bucket
                    ? "bg-problem-accent text-white border-problem-accent"
                    : "bg-surface-elevated text-text-secondary border-border hover:border-problem-accent/50"
                }`}
              >
                {t("mip10.assign.bucket")} {b - buckets[0] + 1}
              </button>
            ))}
          </div>
          <p className="font-mono text-[10px] text-text-tertiary mt-3">{t("mip10.assign.sameBucket")}</p>
        </div>
      </div>
    </section>
  );
}
