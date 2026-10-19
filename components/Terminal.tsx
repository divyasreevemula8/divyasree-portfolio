"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type LogLine = { text: string; tone?: "cmd" | "ok" | "warn" | "err" | "result" | "muted"; spark?: boolean };

const toneClass: Record<NonNullable<LogLine["tone"]>, string> = {
  cmd: "text-coral-700 dark:text-coral-300",
  ok: "text-stone-700 dark:text-stone-300",
  warn: "text-amber-700 dark:text-amber-300",
  err: "text-rose-600 dark:text-rose-400",
  result: "text-sea-700 font-semibold dark:text-sea-300",
  muted: "text-stone-500",
};

function Spark() {
  return (
    <svg viewBox="0 0 40 12" className="ml-2 inline-block h-3 w-10 align-middle" aria-hidden>
      <motion.path
        d="M1 10 L8 8 L15 9 L22 5 L29 6 L39 1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

/** Terminal window: warm paper in light mode, dark teal in dark mode. Renders log lines (auto-scrolls to the newest), then any extra children. */
export function Terminal({ title, lines, children, bodyClass = "max-h-56 min-h-[9.5rem]" }: { title: string; lines: LogLine[]; children?: React.ReactNode; bodyClass?: string }) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" });
  }, [lines, children]);

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-[#fffdf8] dark:border-stone-800 dark:bg-[#13262e] shadow-[0_12px_30px_-18px_rgba(15,30,38,.35)] dark:shadow-[0_12px_30px_-18px_rgba(15,30,38,.6)]">
      <div className="flex items-center gap-1.5 border-b border-stone-200 px-3 py-2 dark:border-white/5">
        <span className="h-2.5 w-2.5 rounded-full bg-coral-400/90" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-sea-400/90" />
        <span className="ml-2 font-mono text-[10px] text-stone-500">{title}</span>
      </div>
      <div ref={body} className={`overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed ${bodyClass}`}>
        <AnimatePresence initial={false}>
          {lines.map((l, k) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className={`whitespace-pre-wrap ${toneClass[l.tone ?? "ok"]}`}
            >
              {l.text}
              {l.spark && <Spark />}
            </motion.div>
          ))}
        </AnimatePresence>
        {children}
        <span className="inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-stone-400" aria-hidden />
      </div>
    </div>
  );
}
