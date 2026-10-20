"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Caveat } from "next/font/google";

const hand = Caveat({ weight: ["600", "700"], subsets: ["latin"], display: "swap" });

// Fades + lifts its children in once, when scrolled into view.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Section title "written in the sand": a handwritten word whose letters are traced in one by one
// with an uneven, finger-drawn rhythm, each sitting at its own small tilt. When it's done, one
// wave of foam washes across and the letters soften like wet sand. Plays once.

// small deterministic wobble per letter, so a title looks the same on every render
const jitter = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5; // -0.5..0.5
};

export function SectionLabel({ children }: { children: string }) {
  const calm = useReducedMotion();
  const letters = children.split("");
  const seed = children.length * 7;
  // finger-drawn rhythm: not perfectly even
  let t = 0;
  const at = letters.map((_, i) => (t += 0.07 + Math.abs(jitter(seed + i * 3)) * 0.09));
  const done = t + 0.15;

  return (
    <motion.h2
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      aria-label={children}
      className={`relative mb-8 flex items-end gap-4 ${hand.className}`}
    >
      <span aria-hidden className="relative inline-block overflow-hidden px-1 pb-1">
        <motion.span
          className="sand-letters relative inline-block text-[2.1rem] leading-none font-bold text-coral-700 sm:text-4xl dark:text-coral-300"
          variants={{ hidden: { filter: "blur(0px)" }, show: { filter: calm ? "blur(0px)" : ["blur(0px)", "blur(0px)", "blur(0.4px)"] } }}
          transition={{ duration: done + 1.2, times: [0, done / (done + 1.2), 1] }}
        >
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block whitespace-pre"
              style={{ rotate: `${jitter(seed + i) * 7}deg`, translateY: `${jitter(seed + i * 5) * 4}px` }}
              variants={{
                hidden: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
                show: { opacity: 1, clipPath: "inset(0 0% 0 0)" },
              }}
              transition={calm ? { duration: 0 } : { delay: at[i] - 0.07, duration: 0.16, ease: "easeOut" }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.span>
        {/* one wave of foam washes over after the word is written */}
        {!calm && (
          <motion.span
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,.75),rgba(200,225,235,.35)_45%,transparent_70%)] blur-[2px] dark:bg-[radial-gradient(ellipse_at_center,rgba(200,225,235,.35),transparent_70%)]"
            variants={{ hidden: { x: "0%", opacity: 0 }, show: { x: ["0%", "380%", "300%"], opacity: [0, 0.9, 0] } }}
            transition={{ delay: done, duration: 1.4, ease: "easeInOut" }}
          />
        )}
      </span>
      {/* a stick-drawn line in the sand */}
      <motion.svg aria-hidden className="mb-3 h-3 flex-1 overflow-visible text-coral-400/70 dark:text-coral-700" preserveAspectRatio="none" viewBox="0 0 100 6">
        <motion.path
          d="M0 3 C 12 1.5, 22 4.5, 35 3 S 58 1.8, 70 3.4 S 90 2.4, 100 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1 } }}
          transition={{ delay: calm ? 0 : done * 0.6, duration: calm ? 0 : 1.1, ease: "easeOut" }}
        />
      </motion.svg>
    </motion.h2>
  );
}
