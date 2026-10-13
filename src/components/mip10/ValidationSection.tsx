"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const CHUNK_CHECKS = ["timeliness", "canonical", "author", "proof", "commitment", "index"] as const;
type Check = (typeof CHUNK_CHECKS)[number] | "reencode";
type Status = "pass" | "fail" | "na";

// The check each bad proposal fails. Per-chunk failures drop the chunk, so
// the block-level re-encode is never reached for it.
export const SCENARIOS = {
  honest: null,
  forged: "author",
  stale: "timeliness",
  depth: "canonical",
  equivocate: "commitment",
  mixed: "reencode",
} as const satisfies Record<string, Check | null>;
type Scenario = keyof typeof SCENARIOS;

export function statusOf(scenario: Scenario, check: Check): Status {
  const failing = SCENARIOS[scenario];
  if (check === failing) return "fail";
  if (check === "reencode" && failing !== null) return "na";
  return "pass";
}

const STATUS_STYLE: Record<Status, string> = {
  pass: "bg-solution-bg text-solution-accent border-solution-accent/30",
  fail: "bg-problem-bg text-problem-accent-strong border-problem-accent/40",
  na: "bg-surface text-text-tertiary border-border",
};

export default function ValidationSection() {
  const { t } = useLanguage();
  const [scenario, setScenario] = useState<Scenario>("honest");

  const row = (check: Check) => {
    const status = statusOf(scenario, check);
    return (
      <li
        key={check}
        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${STATUS_STYLE[status]}`}
      >
        <span className={status === "na" ? "" : "text-text-primary"}>{t(`mip10.validate.checks.${check}`)}</span>
        <span className="font-mono text-[11px] shrink-0">{t(`mip10.validate.${status}`)}</span>
      </li>
    );
  };

  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip10.validate.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip10.validate.subtitle")}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-6" role="tablist">
          {(Object.keys(SCENARIOS) as Scenario[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={s === scenario}
              onClick={() => setScenario(s)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                s === scenario
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {t(`mip10.validate.scenarios.${s}`)}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5">
          <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-2">
            {t("mip10.validate.perChunk")}
          </p>
          <ul className="space-y-1.5 mb-5">{CHUNK_CHECKS.map(row)}</ul>
          <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-2">
            {t("mip10.validate.perBlock")}
          </p>
          <ul className="space-y-1.5">{row("reencode")}</ul>

          <AnimatePresence mode="wait">
            <motion.p
              key={scenario}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-text-secondary leading-relaxed mt-5 min-h-[4.5rem]"
            >
              {t(`mip10.validate.outcomes.${scenario}`)}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
