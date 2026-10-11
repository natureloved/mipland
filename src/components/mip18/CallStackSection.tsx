"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

export interface Frame {
  via: "tx" | "CALL" | "DELEGATECALL";
  code: string; // whose code runs in this frame
  self: string; // ADDRESS in this frame
  sender: string; // CALLER in this frame
}

// MIP-18: CALLERN(n) is sender(F_{d-n}) when n <= d, and 0 otherwise.
export function callerN(frames: Frame[], depth: number, n: number): string | null {
  return n <= depth ? frames[depth - n].sender : null;
}

interface Scenario {
  key: string;
  frames: Frame[];
}

const SCENARIOS: Scenario[] = [
  {
    key: "plain",
    frames: [
      { via: "tx", code: "Aggregator", self: "Aggregator", sender: "alice" },
      { via: "CALL", code: "Router", self: "Router", sender: "Aggregator" },
      { via: "CALL", code: "Pool", self: "Pool", sender: "Router" },
      { via: "CALL", code: "Token", self: "Token", sender: "Pool" },
    ],
  },
  {
    // DELEGATECALL keeps the caller, so Wallet shows up at two depths.
    key: "delegate",
    frames: [
      { via: "tx", code: "Wallet", self: "Wallet", sender: "alice" },
      { via: "CALL", code: "Vault", self: "Vault", sender: "Wallet" },
      { via: "DELEGATECALL", code: "VaultLib", self: "Vault", sender: "Wallet" },
      { via: "CALL", code: "Token", self: "Token", sender: "Vault" },
    ],
  },
];

const MAX_N = 5;

export default function CallStackSection() {
  const { t } = useLanguage();
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey) ?? SCENARIOS[0];
  const frames = scenario.frames;
  const [depth, setDepth] = useState(frames.length - 1);
  const [n, setN] = useState(1);

  const result = callerN(frames, depth, n);
  const target = n <= depth ? depth - n : null;
  const badge =
    n > depth
      ? t("mip18.stack.outOfRange")
      : n === 0
        ? t("mip18.stack.sameAsCaller")
        : n === depth
          ? t("mip18.stack.sameAsOrigin")
          : null;

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
            {t("mip18.stack.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip18.stack.subtitle")}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-4" role="tablist">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={s.key === scenarioKey}
              onClick={() => {
                setScenarioKey(s.key);
                setDepth(s.frames.length - 1);
              }}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                s.key === scenarioKey
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {t(`mip18.stack.${s.key}Name`)}
            </button>
          ))}
        </div>
        <p className="text-sm text-text-secondary text-center mb-8 min-h-[2.5rem] max-w-xl mx-auto">
          {t(`mip18.stack.${scenario.key}Desc`)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
          {/* Call stack, F_0 at the top */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-3">
              {t("mip18.stack.frames")}
            </p>
            <p className="font-mono text-xs text-text-tertiary mb-2 pl-1">
              alice · {t("mip18.stack.eoa")}
            </p>
            <div className="space-y-2">
              {frames.map((f, i) => {
                const inactive = i > depth;
                const isCurrent = i === depth;
                const isTarget = i === target;
                return (
                  <button
                    key={i}
                    onClick={() => setDepth(i)}
                    aria-pressed={isCurrent}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 font-mono text-xs transition-colors ${
                      isTarget
                        ? "border-solution-accent bg-solution-bg"
                        : isCurrent
                          ? "border-text-primary bg-surface-elevated"
                          : inactive
                            ? "border-dashed border-border opacity-40"
                            : "border-border bg-surface-elevated hover:border-text-tertiary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-text-primary font-semibold">
                        F{i} · {f.code}
                        {f.self !== f.code && (
                          <span className="text-text-tertiary font-normal">
                            {" "}
                            {t("mip18.stack.runsAs")} {f.self}
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          f.via === "DELEGATECALL"
                            ? "bg-problem-bg text-problem-accent"
                            : "text-text-tertiary"
                        }`}
                      >
                        {f.via === "tx" ? t("mip18.stack.tx") : f.via}
                      </span>
                    </div>
                    <div className="mt-1 text-text-secondary">
                      CALLER = <span className="text-text-primary">{f.sender}</span>
                      {isCurrent && (
                        <span className="ml-2 text-text-tertiary">← {t("mip18.stack.running")}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="font-mono text-[10px] text-text-tertiary mt-3">
              {t("mip18.stack.clickHint")}
            </p>
          </div>

          {/* Opcode results */}
          <div className="rounded-2xl border border-solution-accent/30 bg-surface-elevated p-5 flex flex-col gap-5">
            <div>
              <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-1">
                CALLSTACKDEPTH
              </p>
              <p className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
                {depth}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary">
                  CALLERN(n)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setN(Math.max(0, n - 1))}
                    disabled={n === 0}
                    aria-label={t("mip18.stack.decrease")}
                    className="font-mono text-sm w-7 h-7 rounded-md border border-border bg-surface disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="font-mono text-sm tabular-nums w-10 text-center">n={n}</span>
                  <button
                    onClick={() => setN(Math.min(MAX_N, n + 1))}
                    disabled={n === MAX_N}
                    aria-label={t("mip18.stack.increase")}
                    className="font-mono text-sm w-7 h-7 rounded-md border border-border bg-surface disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${scenario.key}-${depth}-${n}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <p
                    className={`font-mono text-2xl font-semibold ${
                      result ? "text-solution-accent" : "text-text-tertiary"
                    }`}
                  >
                    {result ?? "0"}
                  </p>
                  <p className="font-mono text-[11px] text-text-tertiary mt-1">
                    {target === null
                      ? t("mip18.stack.noFrame")
                      : `${t("mip18.stack.callerIn")} F${target}`}
                  </p>
                  {badge && (
                    <p className="inline-block mt-3 font-mono text-[11px] px-2 py-1 rounded bg-solution-bg text-solution-accent">
                      {badge}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-text-secondary max-w-2xl mx-auto space-y-2 text-center">
          {scenario.key === "delegate" && <p>{t("mip18.stack.delegateNote")}</p>}
          <p className="font-mono text-[11px] text-text-tertiary">{t("mip18.stack.precompileNote")}</p>
        </div>
      </div>
    </section>
  );
}
