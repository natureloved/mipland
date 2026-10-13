"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const CHUNKS = 70;
const BATCH = 32;
// v1 needs 2^(d-1) >= 70 slots, so 128 leaves.
const SLOTS = 128;
// v0 lets the leader put any ESI at any leaf. 29 is coprime with 70, so this
// visits every ESI once in a scrambled order.
const V0_ORDER = Array.from({ length: CHUNKS }, (_, i) => (i * 29) % CHUNKS);

const ROWS = [
  { key: "rowRoots", v0: "3", v1: "1" },
  { key: "rowSigs", v0: "rowSigsV0", v1: "rowSigsV1" },
  { key: "rowLeaf", v0: "rowLeafV0", v1: "rowLeafV1" },
  { key: "rowRecipient", v0: "rowRecipientV0", v1: "rowRecipientV1" },
  { key: "rowEncodings", v0: "rowEncodingsV0", v1: "rowEncodingsV1" },
] as const;

type Mode = "v0" | "v1";

function Cell({ label, tone }: { label: string; tone: "v0" | "v1" | "zero" }) {
  const style =
    tone === "zero"
      ? "border-dashed border-border text-text-tertiary/60"
      : tone === "v0"
        ? "border-problem-accent/40 bg-problem-cell text-problem-accent-strong"
        : "border-solution-accent/40 bg-solution-cell text-solution-accent";
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded border font-mono text-[9px] tabular-nums ${style}`}
    >
      {label}
    </span>
  );
}

export default function RootSection() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("v1");
  const cellText = (key: string) => (/^\d+$/.test(key) ? key : t(`mip10.roots.${key}`));

  const batches = Array.from({ length: Math.ceil(CHUNKS / BATCH) }, (_, b) =>
    V0_ORDER.slice(b * BATCH, (b + 1) * BATCH),
  );

  return (
    <section className="py-20 sm:py-28 px-6 bg-surface-alt">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip10.roots.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip10.roots.subtitle")}
          </p>
        </motion.div>

        <div className="flex justify-center gap-2 mb-6" role="tablist">
          {(["v0", "v1"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={m === mode}
              onClick={() => setMode(m)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                m === mode
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {t(`mip10.roots.${m}`)}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 mb-6 min-h-[17rem]">
          {mode === "v0" ? (
            <div className="space-y-4">
              {batches.map((esis, b) => (
                <div key={b}>
                  <p className="font-mono text-[11px] text-text-tertiary mb-1.5">
                    {t("mip10.roots.batch")} {b + 1} · {esis.length} ESIs ·{" "}
                    <span className="text-problem-accent-strong">{t("mip10.roots.signedRoot")} R{b + 1}</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {esis.map((esi) => (
                      <Cell key={esi} label={String(esi)} tone="v0" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="font-mono text-[11px] text-text-tertiary mb-1.5">
                {SLOTS} leaves · {t("mip10.roots.oneTree")} ·{" "}
                <span className="text-solution-accent">R</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: SLOTS }, (_, i) =>
                  i < CHUNKS ? (
                    <Cell key={i} label={String(i)} tone="v1" />
                  ) : (
                    <Cell key={i} label="0" tone="zero" />
                  ),
                )}
              </div>
              <p className="font-mono text-[11px] text-text-tertiary mt-2">
                {SLOTS - CHUNKS} {t("mip10.roots.zeroLeaves")}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] text-xs sm:text-sm">
            <div className="p-3 border-b border-border" />
            {(["v0", "v1"] as const).map((m) => (
              <div
                key={m}
                className={`p-3 border-b border-border font-mono text-[11px] ${
                  m === mode ? "text-text-primary font-semibold" : "text-text-tertiary"
                }`}
              >
                {t(`mip10.roots.${m}`)}
              </div>
            ))}
            {ROWS.map((row) => (
              <div key={row.key} className="contents">
                <div className="p-3 border-b border-border-soft text-text-secondary">
                  {t(`mip10.roots.${row.key}`)}
                </div>
                {(["v0", "v1"] as const).map((m) => (
                  <div
                    key={m}
                    className={`p-3 border-b border-border-soft transition-colors ${
                      m === mode
                        ? m === "v0"
                          ? "bg-problem-bg text-text-primary"
                          : "bg-solution-bg text-text-primary"
                        : "text-text-tertiary"
                    }`}
                  >
                    {cellText(row[m])}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-text-secondary mt-6 max-w-2xl mx-auto text-center leading-relaxed">
          {t("mip10.roots.esiNote")}
        </p>
      </div>
    </section>
  );
}
