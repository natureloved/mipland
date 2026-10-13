"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { continuesChain, findRecoveryPoint, type BlockRef } from "./query";

// Page 1 covered blocks 100 to 104; block 100 is finalized. The reorg swaps
// in new versions of 103 and 104 before page 2 (105 to 106) is requested.
const BEFORE: BlockRef[] = [
  { number: 100, hash: "0x1a", parentHash: "0x09" },
  { number: 101, hash: "0x2b", parentHash: "0x1a" },
  { number: 102, hash: "0x3c", parentHash: "0x2b" },
  { number: 103, hash: "0x4d", parentHash: "0x3c" },
  { number: 104, hash: "0x5e", parentHash: "0x4d" },
  { number: 105, hash: "0x6f", parentHash: "0x5e" },
  { number: 106, hash: "0x70", parentHash: "0x6f" },
];

const AFTER: BlockRef[] = [
  ...BEFORE.slice(0, 3),
  { number: 103, hash: "0x8d", parentHash: "0x3c" },
  { number: 104, hash: "0x9e", parentHash: "0x8d" },
  { number: 105, hash: "0xaf", parentHash: "0x9e" },
  { number: 106, hash: "0xb0", parentHash: "0xaf" },
];

export function chainFor(reorg: boolean): BlockRef[] {
  return reorg ? AFTER : BEFORE;
}

/** What the client stored from page 1: number and hash of blocks 100 to 104. */
export const RETAINED = new Map(BEFORE.slice(0, 5).map((b) => [b.number, b.hash]));

const STEPS = ["page1", "page2", "recover"] as const;
type Step = (typeof STEPS)[number];

export default function ReorgSection() {
  const { t } = useLanguage();
  const [reorg, setReorg] = useState(true);
  const [step, setStep] = useState<Step>("page1");

  const chain = chainFor(reorg);
  const cursor1 = BEFORE[4];
  const from2 = chain[5];
  const ok = continuesChain(cursor1, from2);
  const canonicalDesc = [...chain].reverse();
  const recovery = findRecoveryPoint(canonicalDesc, RETAINED);

  const visible = step === "page1" ? BEFORE.slice(0, 5) : chain;

  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip16.reorg.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip16.reorg.subtitle")}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center items-center gap-2 mb-4">
          {STEPS.map((s, i) => (
            <button
              key={s}
              role="tab"
              aria-selected={s === step}
              onClick={() => setStep(s)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                s === step
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {i + 1}. {t(`mip16.reorg.steps.${s}`)}
            </button>
          ))}
        </div>
        <label className="flex justify-center items-center gap-2 text-sm text-text-secondary mb-8 cursor-pointer">
          <input
            type="checkbox"
            checked={reorg}
            onChange={(e) => setReorg(e.target.checked)}
            className="accent-[var(--color-problem-accent)]"
          />
          {t("mip16.reorg.reorgToggle")}
        </label>

        <div className="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="text-left text-text-tertiary">
                  <th className="font-normal pb-2 pr-3">{t("mip16.reorg.height")}</th>
                  <th className="font-normal pb-2 pr-3">{t("mip16.reorg.stored")}</th>
                  <th className="font-normal pb-2 pr-3">{t("mip16.reorg.canonical")}</th>
                  <th className="font-normal pb-2 hidden sm:table-cell" />
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => {
                  const stored = RETAINED.get(b.number);
                  const isCursor = b.number === 104;
                  const isFrom2 = step !== "page1" && b.number === 105;
                  const isRecovery = step === "recover" && b.number === recovery;
                  const replaced = step === "recover" && stored !== undefined && stored !== b.hash;
                  const status = isCursor && step === "page1" ? (
                    <span className="text-text-tertiary">cursorBlock</span>
                  ) : isFrom2 ? (
                    <span className={ok ? "text-solution-accent" : "text-problem-accent-strong"}>
                      fromBlock · {ok ? t("mip16.reorg.match") : t("mip16.reorg.mismatch")}
                    </span>
                  ) : isRecovery ? (
                    <span className="text-solution-accent">{t("mip16.reorg.recoveryPoint")}</span>
                  ) : replaced ? (
                    <span className="text-problem-accent-strong">{t("mip16.reorg.mismatch")}</span>
                  ) : null;
                  return (
                    <tr
                      key={b.number}
                      className={`border-t border-border-soft ${
                        isRecovery ? "bg-solution-bg" : replaced ? "bg-problem-bg" : ""
                      }`}
                    >
                      <td className="py-2 pr-3 text-text-primary whitespace-nowrap align-top">
                        {b.number}
                        {b.number === 100 && <span className="text-text-tertiary"> {t("mip16.reorg.finalized")}</span>}
                        <span className="block sm:hidden text-[10px]">{status}</span>
                      </td>
                      <td className="py-2 pr-3 text-text-secondary align-top">{stored ?? ""}</td>
                      <td className="py-2 pr-3 text-text-secondary whitespace-nowrap align-top">
                        {t("mip16.reorg.hash")} {b.hash}
                        <span className="hidden sm:inline"> · </span>
                        <span className="block sm:inline">
                          {t("mip16.reorg.parent")}{" "}
                          <span
                            className={
                              isFrom2 ? (ok ? "text-solution-accent font-semibold" : "text-problem-accent-strong font-semibold") : ""
                            }
                          >
                            {b.parentHash}
                          </span>
                        </span>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap hidden sm:table-cell">{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${step}-${reorg}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-text-secondary leading-relaxed mt-5 space-y-2 min-h-[4.5rem]"
            >
              {step === "page1" && <p>{t("mip16.reorg.page1Desc")}</p>}
              {step === "page2" && <p>{ok ? t("mip16.reorg.page2Ok") : t("mip16.reorg.page2Bad")}</p>}
              {step === "recover" &&
                (ok || recovery === null ? (
                  <p>{t("mip16.reorg.noRecover")}</p>
                ) : (
                  <>
                    <p>{t("mip16.reorg.recoverDesc")}</p>
                    <p className="text-text-primary">
                      {t("mip16.reorg.discard")
                        .replace("{n}", String(recovery))
                        .replace("{m}", String(recovery + 1))}
                    </p>
                  </>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-6 text-sm text-text-secondary max-w-2xl mx-auto text-center leading-relaxed">
          {t("mip16.reorg.finalNote")}
        </p>
      </div>
    </section>
  );
}
