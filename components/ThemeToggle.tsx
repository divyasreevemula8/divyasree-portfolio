"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

// A little window: daytime sky with drifting clouds, or (scene slides up) a starry night with the moon.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const flip = () => {
    const el = document.documentElement;
    el.classList.add("theme-transition"); // enables the cross-fade defined in globals.css
    setTheme(dark ? "light" : "dark");
    setTimeout(() => el.classList.remove("theme-transition"), 400);
  };

  return (
    <motion.button
      onClick={flip}
      whileHover={{ y: -2, rotate: -3 }}
      whileTap={{ scale: 0.9 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Open the curtains" : "Goodnight"}
      className="relative h-9 w-11 overflow-hidden rounded-lg border-2 border-stone-700 bg-stone-700 shadow-[0_2px_0_0_rgba(0,0,0,0.15)] dark:border-stone-300 dark:bg-stone-300"
    >
      {/* scene: top half = day, bottom half = night; slides up at night */}
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 block h-[200%]"
        initial={false}
        animate={{ y: dark ? "-50%" : "0%" }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        {/* day */}
        <span className="relative block h-1/2 overflow-hidden bg-[#bfe3f2]">
          <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-amber-300" />
          <span className="cloud absolute left-0 top-3 h-1.5 w-4 rounded-full bg-white" style={{ "--cloud-d": "7s" } as React.CSSProperties} />
          <span className="cloud absolute left-0 top-[1.15rem] h-1.5 w-3 rounded-full bg-white/90" style={{ "--cloud-d": "11s", animationDelay: "-5s" } as React.CSSProperties} />
          <span className="absolute inset-x-0 bottom-0 h-1.5 bg-[#f6e3c6]" />
        </span>
        {/* night */}
        <span className="relative block h-1/2 overflow-hidden bg-[#1b2f4a]">
          <span className="absolute right-1.5 top-1 h-3 w-3 rounded-full bg-[#f6e3c6]" />
          <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-[#1b2f4a]" />
          {[
            ["left-1 top-1", "0s"],
            ["left-3.5 top-3", "-0.8s"],
            ["left-1.5 top-5", "-1.6s"],
            ["left-5 top-1.5", "-1.2s"],
          ].map(([pos, delay]) => (
            <span key={pos} className={`twinkle absolute h-[3px] w-[3px] rounded-full bg-white ${pos}`} style={{ animationDelay: delay }} />
          ))}
          <span className="absolute inset-x-0 bottom-0 h-1.5 bg-[#24353d]" />
        </span>
      </motion.span>
      {/* window panes */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-stone-700 dark:bg-stone-300" />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-stone-700 dark:bg-stone-300" />
    </motion.button>
  );
}
