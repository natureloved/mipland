"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { BLOCK_REWARD_MON, SAMPLE_FEES_MON, delegatorCut, mean, median } from "./fees";

const PRESETS = [
  { key: "median", value: median(SAMPLE_FEES_MON) },
  { key: "mean", value: mean(SAMPLE_FEES_MON) },
  { key: "max", value: Math.max(...SAMPLE_FEES_MON) },
];

const fmt = (mon: number) =>
  mon >= 0.01 ? mon.toFixed(4) : mon === 0 ? "0" : mon.toPrecision(2);

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between font-mono text-xs text-text-secondary mb-2">
        <span>{label}</span>
        <span className="tabular-nums text-text-primary font-semibold">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-solution-accent"
      />
    </label>
  );
}

export default function DelegatorShareSection() {
  const { t } = useLanguage();
  const [preset, setPreset] = useState("median");
  const fees = PRESETS.find((p) => p.key === preset)?.value ?? PRESETS[0].value;
  const [sharePct, setSharePct] = useState(1);
  const [commissionPct, setCommissionPct] = useState(10);

  const share = sharePct / 100;
  const commission = commissionPct / 100;
  const noCommission = delegatorCut(fees, share, commission, false);
  const withCommission = delegatorCut(fees, share, commission, true);
  const blockReward = BLOCK_REWARD_MON * (1 - commission) * share;

  return (
    <section className="py-20 sm:py-28 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip11.share.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip11.share.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-6">
            <div>
              <p className="font-mono text-xs text-text-secondary mb-2">{t("mip11.share.fees")}</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPreset(p.key)}
                    aria-pressed={p.key === preset}
                    className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      p.key === preset
                        ? "bg-text-primary text-surface border-text-primary"
                        : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
                    }`}
                  >
                    {t(`mip11.share.${p.key}`)} · {p.value.toFixed(3)} MON
                  </button>
                ))}
              </div>
            </div>
            <Slider
              label={t("mip11.share.stake")}
              value={sharePct}
              display={`${sharePct}%`}
              min={0.1}
              max={50}
              step={0.1}
              onChange={setSharePct}
            />
            <Slider
              label={t("mip11.share.commission")}
              value={commissionPct}
              display={`${commissionPct}%`}
              min={0}
              max={100}
              step={1}
              onChange={setCommissionPct}
            />
          </div>

          <div className="rounded-2xl border border-solution-accent/30 bg-surface-elevated p-6 flex flex-col gap-4 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">{t("mip11.share.today")}</span>
              <span className="text-text-secondary tabular-nums">0 MON</span>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-[11px] tracking-widest uppercase text-solution-accent mb-3">
                {t("mip11.share.withMip")}
              </p>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-text-secondary">{t("mip11.share.noCommission")}</span>
                <span className="text-text-primary font-semibold tabular-nums">{fmt(noCommission)} MON</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">{t("mip11.share.withCommission")}</span>
                <span className="text-text-primary font-semibold tabular-nums">{fmt(withCommission)} MON</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 flex justify-between text-xs">
              <span className="text-text-tertiary">{t("mip11.share.blockReward")}</span>
              <span className="text-text-secondary tabular-nums">{fmt(blockReward)} MON</span>
            </div>
          </div>
        </div>

        <p className="font-mono text-[11px] text-text-tertiary text-center mt-6 max-w-2xl mx-auto">
          {t("mip11.share.note")}
        </p>
      </div>
    </section>
  );
}
