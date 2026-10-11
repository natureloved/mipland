"use client";

import { motion } from "framer-motion";
import { useInView } from "../useInView";
import { useLanguage } from "@/i18n/LanguageContext";

const CARDS = ["delegators", "validators", "coinbase", "wrappers"] as const;
const QUESTIONS = ["q1", "q2"] as const;

export default function AffectedSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);

  return (
    <section ref={ref} className="py-24 px-6 bg-solution-bg relative">
      <div className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-10">
          {t("mip11.affected.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {CARDS.map((card, i) => (
            <motion.div
              key={card}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface-elevated rounded-xl border border-border p-6"
            >
              <h3 className="text-lg font-semibold mb-2">{t(`mip11.affected.${card}Title`)}</h3>
              <p className="text-sm text-text-secondary font-light leading-relaxed">
                {t(`mip11.affected.${card}Desc`)}
              </p>
            </motion.div>
          ))}
        </div>

        <h3 className="text-xl font-semibold mb-4">{t("mip11.affected.openTitle")}</h3>
        <ol className="space-y-3 max-w-3xl list-decimal pl-5">
          {QUESTIONS.map((q) => (
            <li key={q} className="text-sm text-text-secondary leading-relaxed">
              <span className="text-text-primary font-medium">{t(`mip11.affected.${q}Title`)}</span>{" "}
              {t(`mip11.affected.${q}Desc`)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
