"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Viz } from "@/data/profile";
import { runPipeline, type Cell, type Pipeline, type StepResult } from "@/lib/pipeline";

import type { LogLine } from "./Terminal";
export type { LogLine };
type Status = "idle" | "active" | "ok" | "fail" | "retry" | "skipped";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fmt = (v: Cell | undefined) => (v === null || v === undefined || v === "" ? "∅" : typeof v === "number" ? v.toLocaleString() : v);
const dots = (s: string) => s + " " + ".".repeat(Math.max(3, 26 - s.length));

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="group inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 py-1 pl-1 pr-3 text-xs text-stone-600 transition-colors hover:border-sea-300 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900/70 dark:text-stone-300"
    >
      <span className={`relative h-4 w-7 rounded-full transition-colors ${on ? "bg-sea-500" : "bg-stone-300 dark:bg-stone-700"}`}>
        <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 30 }} className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow ${on ? "right-0.5" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function PipelinePlayground({ viz, pipeline, onLog, compact = false }: { viz: Viz; pipeline: Pipeline; onLog: (l: LogLine[]) => void; compact?: boolean }) {
  const steps = pipeline.steps;
  const uid = useId(); // the same pipeline can be mounted twice (card + desktop panel), so keep layoutIds unique
  const [tab, setTab] = useState<"play" | "code">("play");
  const [off, setOff] = useState<Set<number>>(new Set());
  const [tuned, setTuned] = useState(false);
  const [broken, setBroken] = useState(false);
  const [slow, setSlow] = useState(true); // slow by default so people can follow each step
  const [showData, setShowData] = useState(!compact); // compact mode keeps the table tucked away until asked
  const [hasRun, setHasRun] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Status[]>(() => steps.map(() => "idle"));
  const [results, setResults] = useState<StepResult[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [packet, setPacket] = useState<{ i: number; n: number; k: number } | null>(null);
  const alive = useRef(true);
  // set true on (re)mount too: Strict Mode mounts → unmounts → remounts in dev
  useEffect(() => {
    alive.current = true;
    return () => void (alive.current = false);
  }, []);

  const hasTuned = steps.some((s) => s.tuned);
  const tunedLabel = steps.find((s) => s.tuned)?.tuned?.label ?? "";
  // preview of what the next run would cost, so the meter reacts to switches immediately
  const preview = useMemo(() => runPipeline(pipeline, { off, tuned }), [pipeline, off, tuned]);
  const total = preview.reduce((a, r) => a + (r.skipped ? 0 : r.cost), 0);
  const worst = useMemo(() => runPipeline(pipeline, { off: new Set(), tuned: false }).reduce((a, r) => a + r.cost, 0), [pipeline]);

  const setStat = (i: number, s: Status) => setStatus((prev) => prev.map((v, k) => (k === i ? s : v)));

  const run = async () => {
    if (running) return;
    setHasRun(true);
    const pace = slow ? 1 : 0.45; // multiplies every wait below
    setRunning(true);
    setStatus(steps.map(() => "idle"));
    const res = runPipeline(pipeline, { off, tuned });
    setResults(res);
    onLog([{ text: `$ run ${pipeline.job}${tuned && hasTuned ? " --tuned" : ""}${broken ? " --chaos" : ""}`, tone: "cmd" }]);

    for (let i = 0; i < steps.length; i++) {
      if (!alive.current) return;
      const s = steps[i];
      setSelected(i);
      if (res[i].skipped) {
        setStat(i, "skipped");
        onLog([{ text: `> ${dots(s.log)} skipped`, tone: "muted" }]);
        await sleep(500 * pace);
        continue;
      }
      setStat(i, "active");
      // chaos mode: the breakable step fails twice, then the retry policy saves the day
      if (broken && s.breakable) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          await sleep(900 * pace);
          if (!alive.current) return;
          setStat(i, "fail");
          onLog([{ text: `! ${s.log} failed: timeout (attempt ${attempt}/3), retrying in ${attempt * 2}s`, tone: "err" }]);
          await sleep(900 * pace);
          setStat(i, "retry");
        }
      }
      await sleep(Math.min(Math.max(900 + res[i].cost * 0.5, 900), 2200) * pace);
      if (!alive.current) return;
      setStat(i, "ok");
      const dropped = res[i].removed.size;
      onLog([
        {
          text: `> ${dots(s.log)} ok  (${res[i].output.length} rows${dropped ? `, −${dropped}` : ""}, ${res[i].cost}ms)`,
          tone: "ok",
        },
      ]);
      if (i < steps.length - 1) setPacket({ i, n: res[i].output.length, k: Date.now() });
    }
    const t = res.reduce((a, r) => a + (r.skipped ? 0 : r.cost), 0);
    onLog([{ text: `✓ done in ${(t / 1000).toFixed(2)}s simulated${broken ? " · recovered after 2 retries" : ""}`, tone: "result" }]);
    setRunning(false);
  };

  // table for the selected step: kept rows show their transformed values, removed rows are struck through
  const shown = results ?? preview.map((r, i) => (i === 0 ? r : { ...r, output: [], removed: new Set() as StepResult["removed"] }));
  const r = shown[selected] ?? shown[0];
  const tableRows = r.removed.size
    ? r.input.map((row) => (r.removed.has(row.id) ? { row, gone: true } : { row: r.output.find((o) => o.id === row.id) ?? row, gone: false }))
    : r.output.map((row) => ({ row, gone: false }));
  const cols = Array.from(new Set(tableRows.flatMap(({ row }) => Object.keys(row))));

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-white/70 p-4 dark:border-stone-800 dark:bg-stone-900/60">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs text-stone-500">{viz.title} · sample data</p>
        <div className="flex gap-1 font-mono text-xs">
          {(["play", "code"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`relative rounded-md px-2 py-1 ${tab === t ? "text-stone-900 dark:text-stone-100" : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"}`}>
              {tab === t && <motion.span layoutId={`pt-${uid}`} className="absolute inset-0 -z-10 rounded-md bg-sea-100 dark:bg-sea-950" />}
              {t === "play" ? "playground" : viz.codeLabel}
            </button>
          ))}
        </div>
      </div>

      {tab === "code" ? (
        <pre className="overflow-x-auto rounded-lg bg-stone-100 p-3 font-mono text-xs leading-relaxed text-stone-700 dark:bg-stone-950 dark:text-stone-300">
          <code>{viz.code}</code>
        </pre>
      ) : (
        <>
          {/* controls */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              // gentle pulse until the first run, to invite a click (nothing runs on its own)
              animate={!hasRun && !running ? { scale: [1, 1.07, 1] } : { scale: 1 }}
              transition={!hasRun && !running ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
              onClick={run}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-full bg-sea-600 px-4 py-1.5 font-mono text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sea-700 disabled:opacity-60 dark:bg-sea-400 dark:text-stone-950 dark:hover:bg-sea-300"
            >
              {running ? "running…" : "▶ run"}
            </motion.button>
            {steps.map((s, i) =>
              s.optional ? (
                <Switch
                  key={i}
                  on={!off.has(i)}
                  disabled={running}
                  label={s.optional}
                  onChange={(v) => setOff((prev) => { const n = new Set(prev); if (v) n.delete(i); else n.add(i); return n; })}
                />
              ) : null,
            )}
            {hasTuned && <Switch on={tuned} onChange={setTuned} label={tunedLabel} disabled={running} />}
            <Switch on={slow} onChange={setSlow} label={slow ? "slow-mo" : "normal speed"} disabled={running} />
            <Switch on={broken} onChange={setBroken} label="break it" disabled={running} />
          </div>

          {/* stages */}
          <ol className="-mx-1 flex snap-x items-center gap-y-3 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {viz.nodes.map((n, i) => {
              const st = status[i];
              return (
                <li key={n.label} className="flex shrink-0 snap-start items-center">
                  <motion.button
                    onClick={() => setSelected(i)}
                    animate={st === "fail" ? { x: [0, -4, 4, -3, 3, 0] } : st === "active" ? { scale: [1, 1.05, 1] } : { x: 0, scale: 1 }}
                    transition={st === "active" ? { duration: 0.8, repeat: Infinity } : { duration: 0.4 }}
                    title={n.desc}
                    className={`relative rounded-xl border px-3 py-1.5 text-left transition-colors ${
                      st === "fail"
                        ? "border-coral-300 bg-coral-50 dark:bg-coral-950/40"
                        : st === "ok"
                          ? "border-sea-300 bg-sea-50/70 dark:border-sea-700 dark:bg-sea-950/30"
                          : st === "active" || st === "retry"
                            ? "border-sea-400 bg-sea-50 dark:bg-sea-950/50"
                            : st === "skipped"
                              ? "border-dashed border-stone-300 opacity-50 dark:border-stone-700"
                              : "border-stone-200 dark:border-stone-800"
                    } ${selected === i ? "ring-2 ring-sea-300/70 ring-offset-1 ring-offset-transparent dark:ring-sea-500/50" : ""}`}
                  >
                    <span className="block text-xs font-medium">
                      {n.label} {st === "ok" && "✓"} {st === "fail" && "✗"} {st === "retry" && "↻"}
                    </span>
                    <span className="block font-mono text-[10px] text-stone-500">{n.sub}</span>
                  </motion.button>
                  {i < viz.nodes.length - 1 && (
                    <span className="relative mx-1 h-px w-6 bg-stone-300 sm:w-8 dark:bg-stone-700" aria-hidden>
                      {packet?.i === i && (
                        <motion.span
                          key={packet.k}
                          initial={{ left: "-10%", opacity: 0 }}
                          animate={{ left: "80%", opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.2, ease: "easeInOut" }}
                          className="absolute -top-2.5 rounded-full bg-sea-500 px-1.5 font-mono text-[9px] leading-4 text-white dark:bg-sea-400 dark:text-stone-950"
                        >
                          {packet.n}
                        </motion.span>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* runtime meter */}
          <div className="mt-4 flex items-center gap-3 font-mono text-[11px] text-stone-500">
            <span className="shrink-0">runtime</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
              <motion.div className="h-full rounded-full bg-sea-400" animate={{ width: `${(total / worst) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
            </div>
            <span className="w-14 shrink-0 text-right tabular-nums">{(total / 1000).toFixed(2)}s</span>
          </div>

          {/* data preview for the selected stage */}
          {compact && (
            <button onClick={() => setShowData((v) => !v)} aria-expanded={showData} className="mt-4 font-mono text-[11px] text-accent underline-offset-2 hover:underline dark:text-accent-dark">
              {showData ? "hide data ▴" : "show data ▾"}
            </button>
          )}
          {showData && <div className="mt-4">
            <p className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-stone-500">
              <span>
                output of <span className="text-accent dark:text-accent-dark">{viz.nodes[selected]?.label}</span>
                {!results && selected === 0 && " · press ▶ run"}
              </span>
              {r.removed.size > 0 && <span className="text-coral-700">−{r.removed.size} rows</span>}
            </p>
            <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
              <table className="w-full font-mono text-[11px]">
                <thead className="bg-stone-100/80 text-stone-500 dark:bg-stone-950/60">
                  <tr>{cols.map((c) => <th key={c} className="px-2 py-1 text-left font-medium">{c}</th>)}</tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {tableRows.map(({ row, gone }, k) => (
                      <motion.tr
                        key={`${selected}-${row.id}`}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={gone ? { opacity: 0.55, x: 0, backgroundColor: "rgba(244,63,94,0.10)" } : { opacity: 1, x: 0, backgroundColor: "rgba(0,0,0,0)" }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: k * 0.03 }}
                        className={`border-t border-stone-100 dark:border-stone-800/60 ${gone ? "text-coral-700 line-through" : "text-stone-700 dark:text-stone-300"}`}
                      >
                        {cols.map((c) => (
                          <td key={c} className={`whitespace-nowrap px-2 py-1 ${row[c] === null || row[c] === "" ? "text-stone-400" : ""}`}>
                            {fmt(row[c])}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {tableRows.length === 0 && <p className="px-2 py-3 text-center font-mono text-[11px] text-stone-400">run the pipeline to see this step&apos;s output</p>}
            </div>
            <p className="mt-1.5 text-[11px] text-stone-500">{viz.nodes[selected]?.desc}</p>
          </div>}
        </>
      )}
    </div>
  );
}
