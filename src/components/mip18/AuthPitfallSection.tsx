"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { callerN, type Frame } from "./CallStackSection";

// Treasury.withdraw() is the frame doing the check. In "direct" the admin
// calls it as the transaction; in "relay" the admin calls a contract the
// attacker wrote, which calls Treasury.
const PATHS: { key: string; frames: Frame[] }[] = [
  {
    key: "direct",
    frames: [{ via: "tx", code: "Treasury", self: "Treasury", sender: "admin" }],
  },
  {
    key: "relay",
    frames: [
      { via: "tx", code: "ClaimAirdrop", self: "ClaimAirdrop", sender: "admin" },
      { via: "CALL", code: "Treasury", self: "Treasury", sender: "ClaimAirdrop" },
    ],
  },
];

const CHECKS = [
  { key: "caller", label: "require(CALLER == admin)", n: 0 },
  { key: "callern", label: "require(CALLERN(1) == admin)", n: 1 },
];

export default function AuthPitfallSection() {
  const { t } = useLanguage();
  const [pathKey, setPathKey] = useState("relay");
  const path = PATHS.find((p) => p.key === pathKey) ?? PATHS[1];
  const depth = path.frames.length - 1;

  return (
    <section className="py-20 sm:py-28 px-6 bg-problem-bg/40 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip18.auth.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip18.auth.subtitle")}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-4" role="tablist">
          {PATHS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={p.key === pathKey}
              onClick={() => setPathKey(p.key)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                p.key === pathKey
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {t(`mip18.auth.${p.key}Name`)}
            </button>
          ))}
        </div>
        <p className="text-sm text-text-secondary text-center mb-6 min-h-[2.5rem] max-w-xl mx-auto">
          {t(`mip18.auth.${path.key}Desc`)}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs mb-8">
          <span className="px-2.5 py-1 rounded-md border border-border bg-surface">admin</span>
          {path.frames.map((f) => (
            <span key={f.code} className="flex items-center gap-2">
              <span className="text-text-tertiary">→</span>
              <span
                className={`px-2.5 py-1 rounded-md border ${
                  f.code === "ClaimAirdrop"
                    ? "border-problem-accent/40 bg-problem-bg text-problem-accent"
                    : "border-border bg-surface"
                }`}
              >
                {f.code}
                {f.code === "Treasury" && ".withdraw()"}
              </span>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHECKS.map((c) => {
            const seen = callerN(path.frames, depth, c.n);
            const passes = seen === "admin";
            const safe = pathKey === "direct" ? passes : !passes;
            return (
              <div
                key={c.key}
                className={`rounded-2xl border p-5 bg-surface-elevated ${
                  safe ? "border-solution-accent/40" : "border-problem-accent/50"
                }`}
              >
                <p className="font-mono text-xs text-text-primary mb-4">{c.label}</p>
                <p className="font-mono text-[11px] text-text-tertiary">
                  {c.n === 0 ? "CALLER" : "CALLERN(1)"} ={" "}
                  <span className="text-text-primary">{seen ?? "0"}</span>
                </p>
                <p
                  className={`font-mono text-lg font-semibold mt-2 ${
                    passes ? "text-solution-accent" : "text-text-tertiary"
                  }`}
                >
                  {passes ? t("mip18.auth.passes") : t("mip18.auth.reverts")}
                </p>
                <p className={`text-sm mt-2 ${safe ? "text-text-secondary" : "text-problem-accent"}`}>
                  {t(`mip18.auth.${path.key}_${c.key}`)}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-text-secondary text-center mt-8 max-w-xl mx-auto">
          {t("mip18.auth.rule")}
        </p>
      </div>
    </section>
  );
}
