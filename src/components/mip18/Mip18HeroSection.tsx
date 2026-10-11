"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import SpecDisclaimer from "@/components/SpecDisclaimer";

const OPCODES = [
  { bytes: "0xAE 0x00", name: "CALLSTACKDEPTH", key: "depth" },
  { bytes: "0xAE 0x01", name: "CALLERN", key: "callern" },
];

export default function Mip18HeroSection() {
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
          {t("mip18.hero.title")}
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 mb-10">
          {OPCODES.map((op) => (
            <div
              key={op.name}
              className="rounded-xl border border-solution-accent/30 bg-surface-elevated px-5 py-4 text-left"
            >
              <p className="font-mono text-[11px] text-text-tertiary mb-1">{op.bytes}</p>
              <p className="font-mono text-lg font-semibold text-solution-accent">{op.name}</p>
              <p className="text-sm text-text-secondary mt-1">
                {t(`mip18.hero.${op.key}`)}
              </p>
            </div>
          ))}
        </div>

        <p className="text-lg sm:text-xl text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
          {t("mip18.hero.desc")}
        </p>
        <SpecDisclaimer />
      </motion.div>
    </section>
  );
}
