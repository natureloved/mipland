"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const CODES = ["e32601", "e32004", "e32602", "e32001", "e32005"] as const;

export default function ErrorsSection() {
  const { t } = useLanguage();

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
            {t("mip16.errors.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip16.errors.subtitle")}
          </p>
        </motion.div>

        <ul className="space-y-2">
          {CODES.map((code) => (
            <li
              key={code}
              className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-1 sm:gap-4 rounded-xl border border-border bg-surface-elevated px-4 py-3"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-text-primary">-{code.slice(1)}</p>
                <p className="font-mono text-[11px] text-text-tertiary">{t(`mip16.errors.names.${code}`)}</p>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{t(`mip16.errors.rows.${code}`)}</p>
            </li>
          ))}
        </ul>
        <p className="font-mono text-[11px] text-text-tertiary text-center mt-6 max-w-xl mx-auto leading-relaxed">
          {t("mip16.errors.windowNote")}
        </p>
      </div>
    </section>
  );
}
