"use client";

import { motion } from "framer-motion";

// Hand-drawn style icons: slightly wobbly pen strokes that draw themselves in,
// then wiggle when their parent `.group` is hovered. Original drawings, not brand marks.
const paths: Record<string, string[]> = {
  mail: [
    "M3.2 6.4c5.8-.5 11.9-.6 17.7.1.4 3.8.3 7.6-.2 11.3-5.8.4-11.6.4-17.3-.1-.5-3.7-.6-7.5-.2-11.3z",
    "M3.6 6.9c2.7 2.4 5.5 4.6 8.5 6.4 2.9-2 5.7-4.1 8.4-6.3",
  ],
  linkedin: [
    "M3.5 3.6c5.6-.4 11.3-.4 17 .2.4 5.6.3 11.1-.3 16.6-5.6.4-11.1.4-16.6-.1-.5-5.6-.5-11.1-.1-16.7z",
    "M7.6 10.4c.1 2.4.1 4.8 0 7.1",
    "M7.5 7.1l.2.1",
    "M11.2 17.4c0-2.4.1-4.7 0-7 .1 1 .1 1.1.1 1.3.9-1.1 2.1-1.6 3.3-1.4 1.4.3 1.7 1.6 1.7 3v4.2",
  ],
  code: ["M8.4 7.2c-1.7 1.6-3.3 3.2-4.9 4.9 1.6 1.6 3.2 3.2 4.9 4.8", "M15.6 7.1c1.7 1.6 3.3 3.3 4.9 5-1.6 1.6-3.3 3.2-4.9 4.8", "M13.4 5.3c-1 4.5-2 9-3 13.4"],
  resume: [
    "M6.2 3.3c3.3-.2 6.6-.2 9.8.1l2.9 3c.2 4.5.1 9.1-.2 13.6-4.1.3-8.2.3-12.3 0-.4-5.6-.5-11.1-.2-16.7z",
    "M15.9 3.5c-.1 1.1-.1 2.2 0 3.2 1 .1 2 .1 3 0",
  ],
  arrow: ["M12.1 8.2c0 3.1 0 6.1-.1 9.1", "M8.9 14.3c1.1 1 2.1 2 3.1 3 1-1 2.1-2 3.1-3"],
};

export type DoodleName = keyof typeof paths;

export function DoodleIcon({ name, size = 24, className = "", delay = 0 }: { name: DoodleName; size?: number; className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${className}`}
    >
      {paths[name].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: delay + i * 0.25, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}
