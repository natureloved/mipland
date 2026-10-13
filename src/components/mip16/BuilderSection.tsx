"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { RELATIONS, runQuery, type Method, type Order, type Relation, type Row } from "./query";
import { RELATION_FIELDS, SAMPLE, SAMPLE_FIELDS, SAMPLE_FILTER_JSON, SAMPLE_FILTERS } from "./sample";

const METHODS: Method[] = ["blocks", "transactions", "logs", "traces", "transfers"];
const ALL_RELATIONS: Relation[] = ["transactions", "blocks"];
const ORDERS: Order[] = ["asc", "desc"];

export const methodName = (m: Method) => `eth_query${m[0].toUpperCase()}${m.slice(1)}`;

const hex = (n: number) => `0x${n.toString(16)}`;

/** Picks the selected fields and encodes numbers as QUANTITY hex strings. */
function project(row: object, fields: readonly string[]): Record<string, unknown> {
  const source = row as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const value = f === "input" ? `${source.selector}(…)` : source[f];
    out[f] = typeof value === "number" ? hex(value) : value;
  }
  return out;
}

const isFlat = (v: unknown) =>
  v === null || typeof v !== "object" || (Array.isArray(v) && v.every((x) => x === null || typeof x !== "object"));
const isScalar = (v: unknown) => v === null || typeof v !== "object";
const flat = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(", ")}]` : JSON.stringify(v);

/** JSON with flat objects and arrays kept on one line, so each row reads as one line. */
export function compactJson(value: unknown, indent = ""): string {
  if (isFlat(value)) return flat(value);
  const inner = indent + "  ";
  if (Array.isArray(value)) {
    return `[\n${value.map((v) => inner + compactJson(v, inner)).join(",\n")}\n${indent}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.every(([k, v]) => isScalar(v) || k === "traceAddress" || k === "topics")) {
    return `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${flat(v)}`).join(", ")} }`;
  }
  return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${compactJson(v, inner)}`).join(",\n")}\n${indent}}`;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

export default function BuilderSection() {
  const { t } = useLanguage();
  const [method, setMethod] = useState<Method>("logs");
  const [filterOn, setFilterOn] = useState(true);
  const [joins, setJoins] = useState<Relation[]>(["transactions", "blocks"]);
  const [order, setOrder] = useState<Order>("asc");

  // The primary type's own key selects primary fields, so it is never a join.
  const joinable = ALL_RELATIONS.filter((r) => r !== method);
  const activeJoins = joins.filter((r) => joinable.includes(r));
  const outcome = runQuery(SAMPLE, method, filterOn ? SAMPLE_FILTERS[method] : () => true, activeJoins, order);

  const fields: Record<string, readonly string[]> = { [method]: SAMPLE_FIELDS[method] };
  for (const r of activeJoins) fields[r] = RELATION_FIELDS[r];
  const request = {
    jsonrpc: "2.0",
    id: 1,
    method: methodName(method),
    params: [
      {
        fromBlock: hex(101),
        toBlock: hex(103),
        order,
        ...(filterOn ? { filter: SAMPLE_FILTER_JSON[method] } : {}),
        fields,
      },
    ],
  };

  let response: unknown;
  const refCounts: { label: string; count: number }[] = [];
  if (outcome.ok) {
    const { primary, transactions, blocks } = outcome.result;
    const data: Record<string, unknown[]> = {
      [method]: primary.map((row: Row) => project(row, SAMPLE_FIELDS[method])),
    };
    if (activeJoins.includes("transactions")) {
      data.transactions = transactions.map((tx) => project(tx, RELATION_FIELDS.transactions));
      for (const tx of transactions) {
        const count = primary.filter((p) => "transactionHash" in p && p.transactionHash === tx.hash).length;
        if (count > 1) refCounts.push({ label: `tx ${tx.hash}`, count });
      }
    }
    if (activeJoins.includes("blocks")) {
      data.blocks = blocks.map((b) => project(b, RELATION_FIELDS.blocks));
      for (const b of blocks) {
        const count = primary.filter((p) => "blockNumber" in p && p.blockNumber === b.number).length;
        if (count > 1) refCounts.push({ label: `block ${hex(b.number)}`, count });
      }
    }
    response = { jsonrpc: "2.0", id: 1, result: { data } };
  }

  const toggleJoin = (r: Relation) =>
    setJoins((current) => (current.includes(r) ? current.filter((x) => x !== r) : [...current, r]));

  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip16.builder.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip16.builder.subtitle")}
          </p>
        </motion.div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5 mb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary w-16">
              {t("mip16.builder.method")}
            </span>
            {METHODS.map((m) => (
              <Chip
                key={m}
                active={m === method}
                onClick={() => {
                  setMethod(m);
                  setJoins(RELATIONS[m]);
                }}
              >
                {methodName(m)}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary w-16">
              {t("mip16.builder.filter")}
            </span>
            <Chip active={filterOn} onClick={() => setFilterOn(!filterOn)}>
              {t(`mip16.builder.filters.${method}`)}
            </Chip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary w-16">
              {t("mip16.builder.join")}
            </span>
            {joinable.map((r) => (
              <Chip key={r} active={joins.includes(r)} onClick={() => toggleJoin(r)}>
                {r}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary w-16">
              {t("mip16.builder.order")}
            </span>
            {ORDERS.map((o) => (
              <Chip key={o} active={o === order} onClick={() => setOrder(o)}>
                {o}
              </Chip>
            ))}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed pt-1">{t(`mip16.builder.notes.${method}`)}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-border bg-surface p-4 min-w-0">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-2">
              {t("mip16.builder.request")}
            </p>
            <pre className="font-mono text-[11px] leading-relaxed text-text-primary overflow-x-auto">
              {compactJson(request)}
            </pre>
          </div>
          <div
            className={`rounded-2xl border p-4 min-w-0 ${
              outcome.ok ? "border-solution-accent/30 bg-solution-bg" : "border-problem-accent/40 bg-problem-bg"
            }`}
          >
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-2">
              {t("mip16.builder.response")}
            </p>
            {outcome.ok ? (
              <>
                {refCounts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {refCounts.map(({ label, count }) => (
                      <span
                        key={label}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-elevated border border-solution-accent/30 text-solution-accent"
                      >
                        {label}: {t("mip16.builder.referencedBy")} {count}
                        {t("mip16.builder.times")}, {t("mip16.builder.once")}
                      </span>
                    ))}
                  </div>
                )}
                <pre className="font-mono text-[11px] leading-relaxed text-text-primary overflow-x-auto">
                  {compactJson(response)}
                </pre>
              </>
            ) : (
              <div>
                <p className="font-mono text-sm font-semibold text-problem-accent-strong">
                  {t("mip16.builder.unsupported")}
                </p>
                <p className="text-sm text-text-secondary mt-2">{t("mip16.builder.unsupportedDesc")}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-text-secondary text-center mt-6 max-w-2xl mx-auto leading-relaxed">
          {t("mip16.builder.normalizedNote")}
        </p>
        <p className="font-mono text-[11px] text-text-tertiary text-center mt-3 max-w-2xl mx-auto">
          {t("mip16.builder.sampleNote")}
        </p>
      </div>
    </section>
  );
}
