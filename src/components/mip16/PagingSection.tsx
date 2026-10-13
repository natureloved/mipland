"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { buildPage, nextFromBlock, type Order, type PageResult } from "./query";

// The spec's example: blocks 10 to 20, with 40, 0, 55 and 30 matches in
// blocks 10 to 13. The counts after block 13 are made up.
export const FIRST_BLOCK = 10;
export const LAST_BLOCK = 20;
export const COUNTS = [40, 0, 55, 30, 12, 0, 0, 70, 25, 8, 60];

const TARGETS = [undefined, 50, 100, 200] as const;
const BUDGETS = [undefined, 100, 30] as const;
const ORDERS: Order[] = ["asc", "desc"];
const MAX_COUNT = Math.max(...COUNTS);

const PAGE_COLORS = [
  "bg-solution-accent",
  "bg-solution-muted",
  "bg-user-accent",
  "bg-user-muted",
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-text-primary text-surface border-text-primary"
          : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
      }`}
    >
      {children}
    </button>
  );
}

export default function PagingSection() {
  const { t } = useLanguage();
  const [target, setTarget] = useState<number | undefined>(100);
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [order, setOrder] = useState<Order>("asc");
  const [pages, setPages] = useState<PageResult[]>([]);

  const fromBlock = order === "asc" ? FIRST_BLOCK : LAST_BLOCK;
  const toBlock = order === "asc" ? LAST_BLOCK : FIRST_BLOCK;
  const last = pages.at(-1);
  const nextFrom =
    last === undefined ? fromBlock : last.ok ? nextFromBlock(last.cursorBlock, toBlock, order) : null;
  const done = last?.ok === true && nextFrom === null;

  const reset = () => setPages([]);
  const step = () => {
    if (nextFrom === null) return;
    setPages([...pages, buildPage({ counts: COUNTS, firstBlock: FIRST_BLOCK, fromBlock: nextFrom, toBlock, order, target, budget })]);
  };

  // Which page (if any) covers each block, and which block failed.
  const pageOf = new Map<number, number>();
  let failedBlock: number | null = null;
  let resumeAt: number | null = fromBlock;
  for (const [i, page] of pages.entries()) {
    if (!page.ok) {
      failedBlock = resumeAt;
      break;
    }
    const lo = Math.min(page.fromBlock, page.cursorBlock);
    const hi = Math.max(page.fromBlock, page.cursorBlock);
    for (let b = lo; b <= hi; b++) pageOf.set(b, i);
    resumeAt = nextFromBlock(page.cursorBlock, toBlock, order);
  }

  const blocks = COUNTS.map((count, i) => ({ number: FIRST_BLOCK + i, count }));
  if (order === "desc") blocks.reverse();

  const shortPage =
    last?.ok === true && !done && target !== undefined && last.objects < target;

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
            {t("mip16.paging.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip16.paging.subtitle")}
          </p>
        </motion.div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5 mb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary w-28">
              {t("mip16.paging.target")}
            </span>
            {TARGETS.map((v) => (
              <Chip key={String(v)} active={v === target} onClick={() => { setTarget(v); reset(); }}>
                {v ?? t("mip16.paging.none")}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary w-28">
              {t("mip16.paging.budget")}
            </span>
            {BUDGETS.map((v) => (
              <Chip key={String(v)} active={v === budget} onClick={() => { setBudget(v); reset(); }}>
                {v === undefined ? t("mip16.paging.none") : `${v} ${t("mip16.paging.objects")}`}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary w-28">
              {t("mip16.paging.order")}
            </span>
            {ORDERS.map((o) => (
              <Chip key={o} active={o === order} onClick={() => { setOrder(o); reset(); }}>
                {o}
              </Chip>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-end gap-1 sm:gap-1.5 h-36">
            {blocks.map(({ number, count }) => {
              const page = pageOf.get(number);
              const failed = number === failedBlock;
              const isNext = !done && number === nextFrom;
              return (
                <div key={number} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                  <span className="font-mono text-[10px] text-text-tertiary tabular-nums mb-1">{count}</span>
                  <div
                    className={`w-full rounded-t transition-colors ${
                      failed
                        ? "bg-problem-accent"
                        : page !== undefined
                          ? PAGE_COLORS[page % PAGE_COLORS.length]
                          : "bg-border"
                    } ${isNext ? "ring-2 ring-text-primary ring-offset-1" : ""}`}
                    style={{ height: `${Math.max(3, (count / MAX_COUNT) * 100)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 sm:gap-1.5 mt-1.5">
            {blocks.map(({ number }) => (
              <span key={number} className="flex-1 text-center font-mono text-[10px] text-text-secondary tabular-nums">
                {number}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <button
              onClick={step}
              disabled={nextFrom === null}
              className="font-mono text-xs px-4 py-2 rounded-lg bg-text-primary text-surface disabled:opacity-30"
            >
              {t("mip16.paging.next")}
              {nextFrom !== null && ` (fromBlock ${nextFrom})`}
            </button>
            <button
              onClick={reset}
              disabled={pages.length === 0}
              className="font-mono text-xs px-4 py-2 rounded-lg border border-border bg-surface-elevated disabled:opacity-30"
            >
              {t("mip16.paging.reset")}
            </button>
          </div>

          <ol className="mt-4 space-y-1.5">
            {pages.map((page, i) => (
              <li
                key={i}
                className={`font-mono text-xs rounded-lg border px-3 py-2 ${
                  page.ok ? "border-border bg-surface-elevated" : "border-problem-accent/40 bg-problem-bg"
                }`}
              >
                {page.ok ? (
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`inline-block w-2.5 h-2.5 rounded-sm ${PAGE_COLORS[i % PAGE_COLORS.length]}`} />
                    <span className="text-text-primary font-semibold">
                      {t("mip16.paging.page")} {i + 1}
                    </span>
                    <span className="text-text-secondary">
                      {page.fromBlock} → {page.cursorBlock}
                    </span>
                    <span className="text-text-secondary">
                      {page.objects} {t("mip16.paging.returned")}
                    </span>
                    <span className="text-text-secondary">
                      {t("mip16.paging.cursor")} {page.cursorBlock}
                    </span>
                  </span>
                ) : (
                  <span className="text-problem-accent-strong font-semibold">
                    {t("mip16.paging.page")} {i + 1}: -32005
                  </span>
                )}
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            {last && (
              <motion.div
                key={pages.length}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-text-secondary leading-relaxed mt-4 space-y-2"
              >
                <p>{last.ok ? t(`mip16.paging.ends.${last.end}`) : t("mip16.paging.error")}</p>
                {shortPage && <p className="text-problem-accent-strong">{t("mip16.paging.lessThanTarget")}</p>}
                {done && <p className="text-solution-accent font-medium">{t("mip16.paging.done")}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 text-sm text-text-secondary max-w-2xl mx-auto space-y-2 text-center leading-relaxed">
          <p>{t("mip16.paging.rule")}</p>
          <p className="font-mono text-[11px] text-text-tertiary">{t("mip16.paging.budgetNote")}</p>
        </div>
      </div>
    </section>
  );
}
