"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

type Format = "v0" | "v1" | "both";

const STAGES: { accepts: Format; publishes: "v0" | "v1" }[] = [
  { accepts: "v0", publishes: "v0" },
  { accepts: "both", publishes: "v0" },
  { accepts: "both", publishes: "v1" },
  { accepts: "v1", publishes: "v1" },
];
// Stage 3 since v0.16.2 (mainnet September 10, 2026).
const CURRENT = 2;

const reads = (accepts: Format, format: "v0" | "v1") => accepts === "both" || accepts === format;

/** Two nodes interoperate when each accepts what the other publishes. */
export function interoperate(a: number, b: number): boolean {
  return reads(STAGES[a].accepts, STAGES[b].publishes) && reads(STAGES[b].accepts, STAGES[a].publishes);
}

export default function RolloutSection() {
  const { t } = useLanguage();
  const fmt = (f: Format) => (f === "both" ? t("mip10.rollout.both") : f);

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
            {t("mip10.rollout.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip10.rollout.subtitle")}
          </p>
        </motion.div>

        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
          {STAGES.map((s, i) => (
            <li
              key={i}
              className={`rounded-xl border p-4 flex flex-col ${
                i === CURRENT
                  ? "border-solution-accent bg-solution-bg"
                  : i < CURRENT
                    ? "border-border bg-surface-elevated"
                    : "border-dashed border-border bg-surface"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary">
                  {t("mip10.rollout.stage")} {i + 1}
                </span>
                {i === CURRENT && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-solution-accent text-white">
                    {t("mip10.rollout.current")}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-text-secondary">
                {t("mip10.rollout.accepts")} <span className="text-text-primary font-semibold">{fmt(s.accepts)}</span>
              </p>
              <p className="font-mono text-xs text-text-secondary mb-3">
                {t("mip10.rollout.publishes")} <span className="text-text-primary font-semibold">{s.publishes}</span>
              </p>
              <p className="text-xs text-text-secondary leading-relaxed mt-auto">
                {t(`mip10.rollout.stage${i + 1}Note`)}
              </p>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5 max-w-md mx-auto">
          <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-1">
            {t("mip10.rollout.matrixTitle")}
          </p>
          <p className="text-xs text-text-secondary mb-4 leading-relaxed">{t("mip10.rollout.matrixDesc")}</p>
          <table className="w-full font-mono text-xs text-center border-separate border-spacing-1">
            <thead>
              <tr>
                <th />
                {STAGES.map((_, b) => (
                  <th key={b} className="text-text-tertiary font-normal">
                    {b + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAGES.map((_, a) => (
                <tr key={a}>
                  <th className="text-text-tertiary font-normal pr-1">{a + 1}</th>
                  {STAGES.map((_, b) => {
                    const ok = interoperate(a, b);
                    return (
                      <td
                        key={b}
                        className={`rounded py-1.5 ${
                          ok ? "bg-solution-bg text-solution-accent" : "bg-problem-bg text-problem-accent-strong"
                        }`}
                      >
                        {ok ? t("mip10.rollout.yes") : t("mip10.rollout.no")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-text-secondary mt-6 max-w-2xl mx-auto text-center leading-relaxed">
          {t("mip10.rollout.pendingNote")}
        </p>
      </div>
    </section>
  );
}
