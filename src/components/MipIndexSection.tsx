"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { explainerRoute, isMipSlug } from "@/lib/mip-routes";
import type { MipIndexEntry } from "@/lib/mip-index";

function statusClass(status: string): string {
  switch (status) {
    case "Final":
      return "text-solution-accent border-solution-accent/40 bg-solution-bg";
    case "Review":
    case "Last Call":
      return "text-problem-accent border-problem-accent/40 bg-surface";
    case "Withdrawn":
      return "text-text-tertiary border-border bg-surface line-through";
    default:
      return "text-text-secondary border-border bg-surface";
  }
}

function Row({ entry }: { entry: MipIndexEntry }) {
  const { t } = useLanguage();
  const id = `${entry.kind}-${entry.number}`;
  const slug = id.toLowerCase();
  const explainer = entry.kind === "MIP" && isMipSlug(slug) ? explainerRoute(slug) : null;
  const withdrawn = entry.status === "Withdrawn";

  return (
    <li
      className={`flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 px-5 py-3.5 border-t border-border first:border-t-0`}
    >
      <span className="font-mono text-xs text-text-tertiary w-14 shrink-0">{id}</span>
      <span
        className={`flex-1 min-w-0 basis-[calc(100%-5rem)] sm:basis-auto text-sm ${
          withdrawn ? "text-text-tertiary" : "text-text-primary"
        }`}
      >
        {entry.title}
      </span>
      <span
        className={`font-mono text-[10px] rounded-full border px-2 py-0.5 shrink-0 ml-[4.5rem] sm:ml-0 ${statusClass(entry.status)}`}
      >
        {entry.status}
      </span>
      <span className="flex items-center gap-3 shrink-0 sm:w-36 sm:justify-end font-mono text-xs">
        {explainer && (
          <Link href={explainer} className="text-solution-accent hover:underline underline-offset-4">
            {t("home.index.explainer")} →
          </Link>
        )}
        <a
          href={entry.specUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-tertiary hover:text-text-secondary hover:underline underline-offset-4"
        >
          {t("home.index.spec")} ↗
        </a>
      </span>
    </li>
  );
}

export default function MipIndexSection({ entries }: { entries: MipIndexEntry[] }) {
  const { t } = useLanguage();
  const [kind, setKind] = useState<"MIP" | "MRC">("MIP");

  // Newest first, so open proposals sit at the top.
  const rows = entries.filter((e) => e.kind === kind).sort((a, b) => b.number - a.number);
  const counts = {
    MIP: entries.filter((e) => e.kind === "MIP").length,
    MRC: entries.filter((e) => e.kind === "MRC").length,
  };

  return (
    <section aria-labelledby="all-proposals" className="w-full max-w-4xl mt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-wrap items-center justify-between gap-3 mb-5"
      >
        <h2
          id="all-proposals"
          className="font-mono text-[11px] text-text-tertiary tracking-widest uppercase"
        >
          {t("home.index.title")}
        </h2>
        <div className="flex gap-1.5" role="tablist">
          {(["MIP", "MRC"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                kind === k
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {t(k === "MIP" ? "home.index.mips" : "home.index.mrcs")} ({counts[k]})
            </button>
          ))}
        </div>
      </motion.div>

      <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
        {kind === "MRC" && (
          <p className="px-5 py-3 text-xs text-text-tertiary border-b border-border">
            {t("home.index.mrcNote")}
          </p>
        )}
        <ul>
          {rows.map((entry) => (
            <Row key={`${entry.kind}-${entry.number}`} entry={entry} />
          ))}
        </ul>
      </div>

      <p className="font-mono text-[10px] text-text-tertiary mt-3">
        {t("home.index.sourceNote")}{" "}
        <a
          href="https://mips.monad.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-text-secondary"
        >
          mips.monad.xyz
        </a>
      </p>
    </section>
  );
}
