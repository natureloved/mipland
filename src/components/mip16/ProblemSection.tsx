"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const TASKS = ["filter", "join", "fields", "paging"] as const;
type Task = (typeof TASKS)[number];

export default function ProblemSection() {
  const { t } = useLanguage();
  const [task, setTask] = useState<Task>("join");
  const k = (key: string) => t(`mip16.problem.${task}.${key}`);

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
            {t("mip16.problem.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip16.problem.subtitle")}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-6" role="tablist">
          {TASKS.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={key === task}
              onClick={() => setTask(key)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                key === task
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {t(`mip16.problem.tasks.${key}`)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={task}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-center text-base text-text-primary mb-6 max-w-2xl mx-auto">{k("goal")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-problem-accent/30 bg-problem-bg p-5 flex flex-col">
                <p className="font-mono text-[11px] tracking-widest uppercase text-problem-accent-strong mb-3">
                  {t("mip16.problem.today")}
                </p>
                <p className="font-mono text-4xl font-semibold tabular-nums text-problem-accent-strong">
                  {k("todayCount")}
                  <span className="text-sm font-normal text-text-secondary ml-2">{t("mip16.problem.calls")}</span>
                </p>
                <p className="text-sm text-text-secondary leading-relaxed mt-3">{k("today")}</p>
              </div>
              <div className="rounded-2xl border border-solution-accent/30 bg-solution-bg p-5 flex flex-col">
                <p className="font-mono text-[11px] tracking-widest uppercase text-solution-accent mb-3">
                  {t("mip16.problem.withMip")}
                </p>
                <p className="font-mono text-4xl font-semibold tabular-nums text-solution-accent">
                  {k("mipCount")}
                  {task !== "paging" && (
                    <span className="text-sm font-normal text-text-secondary ml-2">{t("mip16.problem.calls")}</span>
                  )}
                </p>
                <p className="text-sm text-text-secondary leading-relaxed mt-3">{k("mip")}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="font-mono text-[11px] text-text-tertiary text-center mt-6 max-w-2xl mx-auto leading-relaxed">
          {t("mip16.problem.countNote")}
        </p>
      </div>
    </section>
  );
}
