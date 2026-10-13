"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { equalStakeChunks, layoutFor, MAX_MESSAGE_BYTES, SEGMENT_LEN } from "./raptorcast";

const MIN_BYTES = 16 * 1024;
// Slider position 0..100 maps onto 16 KB..3 MiB on a log scale.
const toBytes = (pos: number) =>
  Math.round(MIN_BYTES * (MAX_MESSAGE_BYTES / MIN_BYTES) ** (pos / 100));

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
  return `${Math.round(bytes / 1024).toLocaleString("en-US")} KB`;
}

export default function SizingSection() {
  const { t } = useLanguage();
  const [pos, setPos] = useState(60);
  const [setSize, setSetSize] = useState(200);

  const bytes = toBytes(pos);
  const others = setSize - 1;
  const layout = layoutFor(bytes, others);
  const chunks = layout ? equalStakeChunks(layout.n, others) : 0;

  const stats = layout
    ? [
        { key: "depth", value: String(layout.depth) },
        { key: "proof", value: `${layout.proofBytes} B` },
        { key: "symbol", value: `${layout.symbolLen.toLocaleString("en-US")} B` },
        { key: "chunks", value: chunks.toLocaleString("en-US") },
        { key: "upload", value: formatBytes(chunks * SEGMENT_LEN) },
      ]
    : [];

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
            {t("mip10.sizing.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip10.sizing.subtitle")}
          </p>
        </motion.div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <label className="block">
              <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary">
                {t("mip10.sizing.blockSize")}
              </span>
              <span className="block font-mono text-lg font-semibold tabular-nums">{formatBytes(bytes)}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={pos}
                onChange={(e) => setPos(Number(e.target.value))}
                className="w-full accent-solution-accent"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary">
                {t("mip10.sizing.validators")}
              </span>
              <span className="block font-mono text-lg font-semibold tabular-nums">{setSize}</span>
              <input
                type="range"
                min={10}
                max={200}
                value={setSize}
                onChange={(e) => setSetSize(Number(e.target.value))}
                className="w-full accent-solution-accent"
              />
            </label>
          </div>

          {layout ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {stats.map((s) => (
                  <div key={s.key} className="rounded-xl border border-border bg-surface p-3">
                    <p className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary mb-1">
                      {t(`mip10.sizing.${s.key}`)}
                    </p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-text-primary">{s.value}</p>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[11px] text-text-tertiary mt-3 tabular-nums">
                K = {layout.k.toLocaleString("en-US")} · N = {layout.n.toLocaleString("en-US")} ·{" "}
                {t("mip10.sizing.kN")}
              </p>
            </>
          ) : (
            <p className="font-mono text-sm text-problem-accent-strong">{t("mip10.sizing.tooBig")}</p>
          )}
        </div>

        <div className="mt-6 text-sm text-text-secondary max-w-2xl mx-auto space-y-2 text-center leading-relaxed">
          <p>{t("mip10.sizing.packetNote")}</p>
          <p className="font-mono text-[11px] text-text-tertiary">{t("mip10.sizing.maxNote")}</p>
        </div>
      </div>
    </section>
  );
}
