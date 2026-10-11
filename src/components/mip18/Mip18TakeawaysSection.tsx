"use client";

import { motion } from "framer-motion";
import { useInView } from "../useInView";
import { useLanguage } from "@/i18n/LanguageContext";

const CARDS = ["card1", "card2", "card3"] as const;

export default function Mip18TakeawaysSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);

  return (
    <section ref={ref} className="py-24 px-6 bg-solution-bg relative">
      <div className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-10">
          {t("mip18.takeaways.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CARDS.map((card, i) => (
            <motion.div
              key={card}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface-elevated rounded-xl border border-border p-6 flex flex-col"
            >
              <p className="font-mono text-[11px] tracking-widest uppercase text-solution-accent mb-3">
                {t(`mip18.takeaways.${card}Who`)}
              </p>
              <h3 className="text-lg font-semibold mb-2">{t(`mip18.takeaways.${card}Title`)}</h3>
              <p className="text-sm text-text-secondary font-light leading-relaxed">
                {t(`mip18.takeaways.${card}Desc`)}
              </p>
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-text-secondary mt-8 max-w-3xl leading-relaxed">
          {t("mip18.takeaways.openQuestion")}
        </p>
      </div>
    </section>
  );
}
