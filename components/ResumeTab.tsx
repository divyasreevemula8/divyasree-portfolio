"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Caveat } from "next/font/google";
import { resumeUrl } from "@/lib/resume";

// A little piece of driftwood pinned to the edge of the screen, on every section, so the resume is
// never more than one click away. Hover nudges it out and it says what it does.

const hand = Caveat({ weight: ["700"], subsets: ["latin"], display: "swap" });

export function ResumeTab() {
  const calm = useReducedMotion();
  return (
    <motion.a
      href={resumeUrl}
      download
      aria-label="Download resume"
      initial={calm ? false : { x: 80 }}
      animate={{ x: 0 }}
      transition={{ delay: 1.6, type: "spring", stiffness: 120, damping: 14 }}
      whileHover={calm ? undefined : { x: -6 }}
      whileFocus={calm ? undefined : { x: -6 }}
      className={`group fixed z-40 print:hidden max-sm:bottom-20 max-sm:right-0 sm:top-1/2 sm:right-0 sm:-translate-y-1/2 ${hand.className}`}
    >
      <span className="relative block -rotate-3 rounded-l-[10px_14px] rounded-r-none border-y border-l border-coral-600/60 bg-coral-400 py-2 pr-3 pl-4 text-xl leading-none text-coral-900 shadow-[0_3px_0_0_var(--color-coral-600)] transition-colors group-hover:bg-coral-300 group-focus-visible:outline-2 group-focus-visible:outline-sea-500 sm:text-2xl dark:bg-coral-500 dark:text-coral-950">
        {/* wood grain */}
        <span aria-hidden className="pointer-events-none absolute inset-x-3 top-[30%] h-px rounded-full bg-coral-600/35" />
        <span aria-hidden className="pointer-events-none absolute inset-x-5 top-[68%] h-px rounded-full bg-coral-600/25" />
        <span className="relative">
          resume
          <span className="ml-1 inline-block max-w-0 overflow-hidden align-bottom whitespace-nowrap transition-[max-width] duration-300 group-hover:max-w-24 group-focus-visible:max-w-24">
            ↓
          </span>
        </span>
      </span>
    </motion.a>
  );
}
