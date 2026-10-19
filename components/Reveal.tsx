"use client";

import { motion } from "framer-motion";

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

// Mono "// label" whose letters drop in one by one, followed by a thin line that draws out.
export function SectionLabel({ children }: { children: string }) {
  return (
    <motion.h2
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ staggerChildren: 0.035 }}
      aria-label={children}
      className="mb-8 flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-widest text-accent dark:text-accent-dark"
    >
      <span aria-hidden>
        <span className="opacity-60">// </span>
        {children.split("").map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block whitespace-pre"
            variants={{ hidden: { opacity: 0, y: -10, rotate: -12 }, show: { opacity: 1, y: 0, rotate: 0 } }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            {ch}
          </motion.span>
        ))}
      </span>
      <motion.span
        aria-hidden
        className="h-px flex-1 origin-left bg-stone-300/70 dark:bg-stone-700"
        variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.h2>
  );
}
