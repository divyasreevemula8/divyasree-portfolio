"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Impact, Role } from "@/data/profile";
import { pipelines } from "@/data/pipelines";
import { PipelinePlayground } from "./PipelinePlayground";
import { Terminal, type LogLine } from "./Terminal";

// The real résumé result, as a short chip.
function resultText(i: Impact) {
  if (typeof i.value === "number") {
    const sign = i.kind === "down" ? "−" : i.kind === "up" ? "+" : "";
    return `${i.label} ${sign}${i.value}${i.suffix ?? ""}`;
  }
  return `${i.value} ${i.label}`;
}

/** Real results as chips. */
export function ResultChips({ role }: { role: Role }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {role.impact.map((i, k) => (
        <motion.li
          key={i.label}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + k * 0.08 }}
          className="rounded-lg bg-sea-50 px-2.5 py-1 text-[13px] font-medium text-sea-800 dark:bg-sea-950/60 dark:text-sea-200"
        >
          ✓ {resultText(i)}
        </motion.li>
      ))}
    </ul>
  );
}

/** A role's playground, always visible (never auto-runs), with a small log that appears after a run. */
export function PipelineDemo({ role, compact = false }: { role: Role; compact?: boolean }) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const pipeline = pipelines[role.company];
  if (!pipeline || !role.viz) return null;

  return (
    <div>
      <PipelinePlayground viz={role.viz} pipeline={pipeline} compact={compact} onLog={(l) => setLines((prev) => [...prev, ...l].slice(-30))} />
      <AnimatePresence>
        {lines.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 overflow-hidden">
            <Terminal title={`~/divyasree/${pipeline.job}`} lines={lines} bodyClass="max-h-28" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
