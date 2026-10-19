"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll, type Variants } from "framer-motion";
import { nav } from "@/data/profile";
import { ThemeToggle } from "./ThemeToggle";
import { resumeUrl } from "@/lib/resume";

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

const grain: Variants = {
  rest: { opacity: 0, x: 0, y: 0 },
  hover: (i: number) => ({
    opacity: [0, 1, 1, 0],
    x: [0, -3 - i * 0.6, -5 - i],
    y: [0, 5, 15 + (i % 3) * 3],
    transition: { duration: 0.9, delay: 0.2 + i * 0.08, repeat: Infinity, repeatDelay: 0.25, ease: "easeIn" },
  }),
};

// Doodle sand bucket (icon only). Hover: it tips and pours sand + a "Download résumé" tag.
// Click: the bucket slides off to the right, the résumé opens, and a fresh bucket slides back in.
function ResumeButton() {
  const [round, setRound] = useState(0); // bumping this remounts the bucket so it slides back in
  const [leaving, setLeaving] = useState(false);

  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      const w = window.open(resumeUrl, "_blank", "noopener");
      if (!w) window.location.href = resumeUrl; // popup blocked → open in this tab
      setLeaving(false);
      setRound((r) => r + 1);
    }, 450);
  };

  return (
    <motion.a
      href={resumeUrl}
      onClick={go}
      aria-label="Download my resume"
      data-cursor
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap={{ scale: 0.92 }}
      className="group relative grid h-10 w-10 place-items-center rounded-full border border-stone-300 bg-stone-50/70 backdrop-blur transition-colors hover:border-coral-400 dark:border-stone-700 dark:bg-stone-900/60"
    >
      <span className="block overflow-hidden rounded-full p-1">
        <motion.svg
          key={round}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="overflow-visible"
          initial={round ? { x: -28, opacity: 0 } : false}
          animate={leaving ? { x: 30, opacity: 0, rotate: 25 } : { x: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <motion.g
            variants={{ rest: { rotate: 0 }, hover: { rotate: -38 } }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            style={{ originX: "30%", originY: "80%" }}
          >
            {/* handle */}
            <path d="M7.4 9.2c.3-3.6 8.9-3.8 9.3-.1" stroke="currentColor" strokeWidth="1.4" />
            {/* body */}
            <path d="M6.2 9.4c3.9-.4 7.8-.4 11.7 0l-1.4 9.8c-2.9.4-5.9.4-8.8 0z" className="fill-coral-300 dark:fill-coral-400" stroke="currentColor" strokeWidth="1.5" />
            {/* sand heap at the rim */}
            <path d="M7 9.3c1.6-1.3 3.4-1.6 5-.6 1.7-.9 3.4-.6 5 .6" className="fill-shell" stroke="currentColor" strokeWidth="1.1" />
          </motion.g>
          {/* grains pour from the rim once tipped */}
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.circle key={i} cx={6.5} cy={10.5} r={0.9} className="fill-amber-300 dark:fill-shell" variants={grain} custom={i} />
          ))}
        </motion.svg>
      </span>
      {/* hover / focus tag */}
      <motion.span
        variants={{ rest: { opacity: 0, y: -4 }, hover: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.18 }}
        className="pointer-events-none absolute top-full right-0 mt-2 whitespace-nowrap rounded-full bg-stone-900 px-2.5 py-1 font-mono text-[11px] text-stone-50 shadow dark:bg-shell dark:text-stone-900"
      >
        grab my resume ↓
      </motion.span>
    </motion.a>
  );
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
          <ResumeButton />
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
