"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { nav } from "@/data/profile";
import { ThemeToggle } from "./ThemeToggle";

// Which section is in the middle band of the screen (-1 while on the hero).
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(-1);
  useEffect(() => {
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        setActive(ids.findIndex((id) => seen.get(id)));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));
  const [ids] = useState(() => nav.map((n) => n.href.slice(1)));
  const active = useActiveSection(ids);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-20 border-b backdrop-blur-md transition-colors ${
        scrolled ? "border-stone-200 bg-stone-50/85 dark:border-stone-800 dark:bg-stone-950/85" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-5">
        {/* pipeline: sections are stations, a data packet rides to the one you're reading */}
        <nav aria-label="Sections" className="flex min-w-0 items-center">
          {nav.map((item, i) => {
            const on = i === active;
            const passed = active > i;
            return (
              <div key={item.href} className="flex items-center">
                <a href={item.href} aria-label={item.label} aria-current={on ? "true" : undefined} className="group relative flex flex-col items-center px-1 pt-1 sm:px-1.5">
                  <span className="relative grid h-4 w-4 place-items-center">
                    <span
                      className={`h-2.5 w-2.5 rounded-full border-2 transition-colors duration-300 ${
                        passed || on
                          ? "border-sea-500 bg-sea-500 dark:border-sea-300 dark:bg-sea-300"
                          : "border-stone-400 bg-stone-50 group-hover:border-sea-500 dark:border-stone-600 dark:bg-stone-950"
                      }`}
                    />
                    {on && (
                      <motion.span
                        layoutId="data-packet"
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        className="absolute -top-0.5 grid h-5 min-w-7 place-items-center rounded-full bg-coral-400 px-1 font-mono text-[9px] leading-none text-white shadow-sm"
                      >
                        •••
                      </motion.span>
                    )}
                  </span>
                  <span
                    className={`mt-0.5 hidden whitespace-nowrap text-[11px] transition-colors md:block ${
                      on ? "font-semibold text-sea-700 dark:text-sea-200" : "text-stone-500 group-hover:text-stone-900 dark:group-hover:text-stone-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </a>
                {i < nav.length - 1 && (
                  <span aria-hidden className="relative -mt-0 h-[2px] w-2 overflow-hidden rounded-full bg-stone-300 sm:w-5 md:-mt-4 md:w-4 dark:bg-stone-700">
                    <motion.span className="absolute inset-0 origin-left bg-sea-500 dark:bg-sea-300" animate={{ scaleX: passed ? 1 : 0 }} transition={{ duration: 0.4 }} />
                  </span>
                )}
              </div>
            );
          })}
          {/* small screens: the current station's name */}
          <span className="ml-2 hidden truncate text-xs font-semibold text-sea-700 sm:inline md:hidden dark:text-sea-200">{active >= 0 ? nav[active].label : ""}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
