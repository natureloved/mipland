"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

type ByteKind = "ext" | "selector" | "push" | "data";

// Each example is a complete instruction sequence. Neither opcode takes
// immediates, so CALLERN reads n from the stack.
const EXAMPLES: { key: string; bytes: [string, ByteKind][]; asm: string }[] = [
  { key: "depth", bytes: [["AE", "ext"], ["00", "selector"]], asm: "CALLSTACKDEPTH" },
  {
    key: "grandparent",
    bytes: [["60", "push"], ["01", "data"], ["AE", "ext"], ["01", "selector"]],
    asm: "PUSH1 1  CALLERN",
  },
  {
    key: "origin",
    bytes: [["AE", "ext"], ["00", "selector"], ["AE", "ext"], ["01", "selector"]],
    asm: "CALLSTACKDEPTH  CALLERN",
  },
];

const BYTE_STYLE: Record<ByteKind, string> = {
  ext: "bg-solution-accent text-surface",
  selector: "bg-solution-cell text-solution-accent",
  push: "bg-surface-alt text-text-secondary border border-border",
  data: "bg-surface text-text-secondary border border-border",
};

export default function OpcodesSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip18.opcodes.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip18.opcodes.subtitle")}{" "}
            <Link href="/mip-7" className="underline underline-offset-2 hover:text-text-primary">
              {t("mip18.opcodes.mip7Link")}
            </Link>
          </p>
        </motion.div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated mb-8">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="text-left text-text-tertiary border-b border-border">
                <th className="px-4 py-3 font-normal">{t("mip18.opcodes.bytes")}</th>
                <th className="px-4 py-3 font-normal">{t("mip18.opcodes.name")}</th>
                <th className="px-4 py-3 font-normal">{t("mip18.opcodes.input")}</th>
                <th className="px-4 py-3 font-normal">{t("mip18.opcodes.output")}</th>
                <th className="px-4 py-3 font-normal">{t("mip18.opcodes.gas")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3 text-text-secondary">0xAE 0x00</td>
                <td className="px-4 py-3 text-solution-accent font-semibold">CALLSTACKDEPTH</td>
                <td className="px-4 py-3 text-text-tertiary">{t("mip18.opcodes.none")}</td>
                <td className="px-4 py-3">depth</td>
                <td className="px-4 py-3">2</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-secondary">0xAE 0x01</td>
                <td className="px-4 py-3 text-solution-accent font-semibold">CALLERN</td>
                <td className="px-4 py-3">n</td>
                <td className="px-4 py-3">caller</td>
                <td className="px-4 py-3">2</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          {EXAMPLES.map((ex) => (
            <div
              key={ex.key}
              className="rounded-xl border border-border bg-surface p-4 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 sm:gap-6 items-center"
            >
              <div className="flex gap-1">
                {ex.bytes.map(([b, kind], i) => (
                  <span
                    key={i}
                    className={`font-mono text-xs w-8 h-8 rounded-md flex items-center justify-center ${BYTE_STYLE[kind]}`}
                  >
                    {b}
                  </span>
                ))}
              </div>
              <div>
                <p className="font-mono text-xs text-text-primary">{ex.asm}</p>
                <p className="text-sm text-text-secondary mt-0.5">
                  {t(`mip18.opcodes.${ex.key}Example`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="font-mono text-[11px] text-text-tertiary text-center mt-6 max-w-xl mx-auto">
          {t("mip18.opcodes.note")}
        </p>
      </div>
    </section>
  );
}
