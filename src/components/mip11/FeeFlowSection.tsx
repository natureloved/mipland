"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const TXS = [0.02, 0.05, 0.03]; // MON of priority fees, illustrative
const TOTAL = TXS.reduce((a, b) => a + b, 0);
const DISTRIBUTION_ACCOUNT = "0xfee5…fee5";

type Step = { key: string; label: string; value?: string; tone?: "accent" | "muted" };

export default function FeeFlowSection() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"today" | "mip11">("mip11");
  const total = `+${TOTAL.toFixed(2)} MON`;

  const steps: Step[] =
    mode === "today"
      ? [
          { key: "coinbase", label: t("mip11.flow.todayCoinbase"), value: total, tone: "accent" },
          { key: "manual", label: t("mip11.flow.todayManual"), tone: "muted" },
          { key: "pool", label: t("mip11.flow.todayPool"), value: t("mip11.flow.usuallyZero"), tone: "muted" },
        ]
      : [
          { key: "account", label: `${t("mip11.flow.mipAccount")} ${DISTRIBUTION_ACCOUNT}`, value: total },
          { key: "syscall", label: t("mip11.flow.mipSyscall") },
          { key: "pool", label: t("mip11.flow.mipPool"), value: total, tone: "accent" },
          { key: "coinbase", label: t("mip11.flow.mipCoinbase"), value: "+0 MON", tone: "muted" },
        ];

  return (
    <section className="py-20 sm:py-28 px-6 bg-surface-alt">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip11.flow.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip11.flow.subtitle")}
          </p>
        </motion.div>

        <div className="flex justify-center gap-2 mb-8" role="tablist">
          {(["today", "mip11"] as const).map((m) => (
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
              {t(`mip11.flow.${m}Tab`)}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-3">
            {t("mip11.flow.block")}
          </p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {TXS.map((fee, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-elevated px-3 py-2 font-mono text-xs">
                <span className="text-text-tertiary">tx {i + 1}</span>
                <span className="block text-text-primary">{fee.toFixed(2)} MON</span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {steps.map((s, i) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 * i, duration: 0.3 }}
                >
                  <div className="flex justify-center text-text-tertiary font-mono text-sm py-1" aria-hidden>
                    ↓
                  </div>
                  <div
                    className={`rounded-lg border px-4 py-3 flex items-center justify-between gap-4 ${
                      s.tone === "accent"
                        ? "border-solution-accent/40 bg-solution-bg"
                        : s.tone === "muted"
                          ? "border-dashed border-border"
                          : "border-border bg-surface-elevated"
                    }`}
                  >
                    <span className={`text-sm ${s.tone === "muted" ? "text-text-tertiary" : "text-text-primary"}`}>
                      {s.label}
                    </span>
                    {s.value && (
                      <span
                        className={`font-mono text-xs whitespace-nowrap ${
                          s.tone === "accent" ? "text-solution-accent font-semibold" : "text-text-secondary"
                        }`}
                      >
                        {s.value}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-sm text-text-secondary text-center mt-6 max-w-xl mx-auto">
          {t(`mip11.flow.${mode}Note`)}
        </p>
      </div>
    </section>
  );
}
