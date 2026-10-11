"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  DUST_THRESHOLD_WEI,
  EXTERNAL_REWARD_MIN_WEI,
  SAMPLE,
  SAMPLE_FEES_MON,
  SAMPLE_FEES_WEI,
  burnedUnder,
} from "./fees";

// Bucket edges in MON. 1 MON sits on an edge, so a bucket is either wholly
// under it or wholly over it. 1 gwei is below every sampled block.
const EDGES = [0, 0.01, 0.03, 0.1, 0.3, 1, 3];
const BUCKETS = EDGES.slice(0, -1).map((lo, i) => {
  const hi = EDGES[i + 1];
  return { lo, hi, count: SAMPLE_FEES_MON.filter((f) => f >= lo && f < hi).length };
});
const MAX_COUNT = Math.max(...BUCKETS.map((b) => b.count));

const THRESHOLDS = [
  { key: "gwei", wei: DUST_THRESHOLD_WEI, mon: 1e-9 },
  { key: "mon", wei: EXTERNAL_REWARD_MIN_WEI, mon: 1 },
];

const range = (lo: number, hi: number) => `${lo} to ${hi} MON`;

export default function ThresholdSection() {
  const { t } = useLanguage();
  const [key, setKey] = useState("mon");
  const [hover, setHover] = useState<number | null>(null);
  const threshold = THRESHOLDS.find((th) => th.key === key) ?? THRESHOLDS[1];
  const { blocks, feeShare } = burnedUnder(SAMPLE_FEES_WEI, threshold.wei);
  const total = SAMPLE_FEES_WEI.length;

  return (
    <section className="py-20 sm:py-28 px-6 bg-problem-bg/40 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip11.threshold.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-2xl mx-auto leading-relaxed">
            {t("mip11.threshold.subtitle")}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist">
          {THRESHOLDS.map((th) => (
            <button
              key={th.key}
              role="tab"
              aria-selected={th.key === key}
              onClick={() => setKey(th.key)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                th.key === key
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {t(`mip11.threshold.${th.key}Name`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
          <div className="rounded-2xl border border-border bg-surface-elevated p-5">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-4">
              {t("mip11.threshold.chartTitle")}
            </p>
            <div className="relative h-48 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
              {BUCKETS.map((b, i) => {
                const burned = b.hi <= threshold.mon;
                return (
                  <div
                    key={i}
                    className="flex-1 h-full flex flex-col justify-end items-center relative"
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    tabIndex={0}
                    aria-label={`${range(b.lo, b.hi)}: ${b.count} ${t("mip11.threshold.blocks")}`}
                  >
                    <span className="font-mono text-[10px] text-text-secondary mb-1 tabular-nums">
                      {b.count}
                    </span>
                    <motion.div
                      initial={false}
                      animate={{ height: `${(b.count / MAX_COUNT) * 80}%` }}
                      transition={{ duration: 0.4 }}
                      className={`w-full max-w-14 rounded-t-[4px] ${
                        burned ? "bg-problem-accent" : "bg-solution-accent"
                      } ${hover === i ? "opacity-80" : ""}`}
                      style={{ minHeight: b.count ? 2 : 0 }}
                    />
                    {hover === i && (
                      <div className="absolute bottom-full mb-2 z-10 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-[11px] text-text-primary shadow-sm">
                        {range(b.lo, b.hi)} · {b.count} {t("mip11.threshold.blocks")}
                        {burned && <span className="text-problem-accent"> · {t("mip11.threshold.burned")}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-[2px] mt-2 border-t border-border pt-2">
              {BUCKETS.map((b, i) => (
                <span key={i} className="flex-1 text-center font-mono text-[10px] text-text-tertiary">
                  {b.lo === 0 ? "<0.01" : `${b.lo}+`}
                </span>
              ))}
            </div>
            <p className="font-mono text-[10px] text-text-tertiary mt-2 text-center">
              {t("mip11.threshold.axis")}
            </p>

            <table className="sr-only">
              <caption>{t("mip11.threshold.chartTitle")}</caption>
              <thead>
                <tr>
                  <th>MON</th>
                  <th>{t("mip11.threshold.blocks")}</th>
                </tr>
              </thead>
              <tbody>
                {BUCKETS.map((b, i) => (
                  <tr key={i}>
                    <td>{range(b.lo, b.hi)}</td>
                    <td>{b.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-problem-accent/40 bg-surface-elevated p-5 flex flex-col gap-5">
            <div>
              <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-1">
                {t("mip11.threshold.blocksBurned")}
              </p>
              <p className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
                {blocks}
                <span className="text-base text-text-tertiary font-normal"> / {total}</span>
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-1">
                {t("mip11.threshold.feesBurned")}
              </p>
              <p className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
                {Math.round(feeShare * 100)}%
              </p>
            </div>
            <p className="text-sm text-text-secondary">{t(`mip11.threshold.${threshold.key}Desc`)}</p>
          </div>
        </div>

        <p className="font-mono text-[11px] text-text-tertiary text-center mt-6 max-w-2xl mx-auto">
          {t("mip11.threshold.sample")
            .replace("{count}", String(total))
            .replace("{from}", SAMPLE.fromBlock.toLocaleString("en-US"))
            .replace("{to}", SAMPLE.toBlock.toLocaleString("en-US"))
            .replace("{date}", SAMPLE.sampledAt)}
        </p>
      </div>
    </section>
  );
}
