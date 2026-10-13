"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import SpecDisclaimer from "@/components/SpecDisclaimer";

const FACTS = ["methods", "join", "page"] as const;

export default function Mip16HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl relative z-10 mt-30"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight mb-10">
          {t("mip16.hero.title")}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {FACTS.map((fact) => (
            <div
              key={fact}
              className="rounded-xl border border-solution-accent/30 bg-surface-elevated px-5 py-4 text-left"
            >
              <p className="font-mono text-lg font-semibold text-solution-accent">
                {t(`mip16.hero.${fact}Value`)}
              </p>
              <p className="text-sm text-text-secondary mt-1">{t(`mip16.hero.${fact}Desc`)}</p>
            </div>
          ))}
        </div>

        <p className="text-lg sm:text-xl text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
          {t("mip16.hero.desc")}
        </p>
        <SpecDisclaimer />
      </motion.div>
    </section>
  );
}
