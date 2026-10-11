"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import SpecDisclaimer from "@/components/SpecDisclaimer";

export default function Mip11HeroSection() {
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
          {t("mip11.hero.title")}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 text-left">
          <div className="rounded-xl border border-border bg-surface-elevated px-5 py-4">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-2">
              {t("mip11.hero.today")}
            </p>
            <p className="font-mono text-sm text-text-primary">
              {t("mip11.hero.fees")} → {t("mip11.hero.beneficiary")}
            </p>
          </div>
          <div className="rounded-xl border border-solution-accent/30 bg-surface-elevated px-5 py-4">
            <p className="font-mono text-[11px] tracking-widest uppercase text-solution-accent mb-2">
              {t("mip11.hero.withMip")}
            </p>
            <p className="font-mono text-sm text-text-primary">
              {t("mip11.hero.fees")} → {t("mip11.hero.pool")}
            </p>
          </div>
        </div>

        <p className="text-lg sm:text-xl text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
          {t("mip11.hero.desc")}
        </p>
        <SpecDisclaimer />
      </motion.div>
    </section>
  );
}
