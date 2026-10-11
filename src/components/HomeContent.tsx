"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import MipIndexSection from "@/components/MipIndexSection";
import type { MipIndexEntry } from "@/lib/mip-index";

/* ─── Others list ────────────────────────────────────────────────────── */

const OTHERS = [
  {
    href: "/spam-mev",
    title: "Spam MEV",
    description: "How block capacity, gas price floors and ordering set spam volumes",
    label: "Category Labs",
  },
  {
    href: "/btx",
    title: "BTX",
    description: "Batched threshold encryption for encrypted mempools",
    label: "Category Labs",
  },
  {
    href: "/clear-signing",
    title: "Clear Signing",
    description: "Readable wallet prompts on Monad, with a live signature demo",
    label: "ERC-7730",
  },
];

/* ─── Main page ──────────────────────────────────────────────────────── */

export default function HomeContent({ mipIndex }: { mipIndex: MipIndexEntry[] }) {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen flex flex-col items-center px-6">
      {/* Hero */}
      <div className="max-w-4xl w-full text-center mt-28 sm:mt-36 mb-2">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.05] tracking-tight mb-5">
          {t("home.title")}
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary font-light max-w-lg mx-auto leading-relaxed">
          {t("home.subtitle")}{" "}
          <br className="hidden sm:block" />
          {t("home.subtitleBreak")}
        </p>
      </div>

      <section
        aria-labelledby="about-mips"
        className="w-full max-w-4xl mt-16 rounded-2xl border border-border bg-surface-elevated px-6 py-7 sm:px-8"
      >
        <h2 id="about-mips" className="text-2xl font-semibold tracking-tight mb-3">
          {t("home.aboutTitle")}
        </h2>
        <p className="text-text-secondary leading-relaxed max-w-3xl">
          {t("home.aboutBody")}
        </p>
        <p className="text-sm text-text-tertiary leading-relaxed max-w-3xl mt-3">
          {t("home.aboutNote")}
        </p>
        <a
          href="https://mips.monad.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex mt-5 font-mono text-xs text-solution-accent hover:underline underline-offset-4"
        >
          {t("home.browseSpecs")} →
        </a>
      </section>

      <MipIndexSection entries={mipIndex} />

      {/* Others */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-4xl mb-5 mt-16"
      >
        <h2 className="font-mono text-[11px] text-text-tertiary tracking-widest uppercase">
          {t("home.others")}
        </h2>
      </motion.div>

      <ul className="w-full max-w-4xl mb-28 rounded-2xl border border-border bg-surface-elevated overflow-hidden">
        {OTHERS.map((item) => (
          <li key={item.href} className="border-t border-border first:border-t-0">
            <Link
              href={item.href}
              className="group flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-surface transition-colors"
            >
              <span className="text-sm font-medium text-text-primary sm:w-32 shrink-0">
                {item.title}
              </span>
              <span className="flex-1 min-w-0 basis-full sm:basis-auto text-sm text-text-secondary">
                {item.description}
              </span>
              <span className="font-mono text-[10px] text-text-tertiary shrink-0">
                {item.label}
              </span>
              <span className="font-mono text-xs text-text-tertiary group-hover:text-text-secondary shrink-0 sm:w-20 sm:text-right">
                {t("home.explore")} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
