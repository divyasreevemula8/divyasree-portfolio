"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { star as cfg } from "@/lib/cursorConfig";

// Cursor follower that changes with the theme:
//  light → a coral starfish that "rolls" as it follows the pointer
//  dark  → a soft glowing star that twinkles
// It grows and spins over links/buttons, and shows a small tag for elements with data-cursor-label.
// The native cursor stays visible; this only runs on fine pointers without reduced motion.

const STAR = "M12 1.8c.9 0 1.4 2.6 2.2 5.7.4 1.4 1 1.9 2.5 2.1 3.2.4 5.7.8 5.7 1.7s-2.3 1.9-5 3.4c-1.2.7-1.5 1.4-1.2 2.8.7 3.2 1.2 5.6.4 6.1-.8.5-2.6-1.3-4.8-3.6-1-1-1.7-1-2.7 0-2.2 2.3-4 4.1-4.8 3.6s-.3-2.9.4-6.1c.3-1.4 0-2.1-1.2-2.8-2.7-1.5-5-2.5-5-3.4s2.5-1.3 5.7-1.7c1.5-.2 2.1-.7 2.5-2.1C10.6 4.4 11.1 1.8 12 1.8z";

export function StarCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [down, setDown] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, cfg.follow);
  const sy = useSpring(y, cfg.follow);
  // rolling: rotation follows horizontal travel
  const roll = useTransform(sx, (v) => v * cfg.roll);

  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(fine.matches && !calm.matches);
    sync();
    fine.addEventListener("change", sync);
    calm.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      calm.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x.set(e.clientX + cfg.offset);
      y.set(e.clientY + cfg.offset);
      setVisible(true);
      const t = e.target as Element | null;
      setHot(!!t?.closest?.("a, button, [role=button], [data-cursor]"));
      setLabel(t?.closest?.("[data-cursor-label]")?.getAttribute("data-cursor-label") ?? null);
    };
    const leave = () => setVisible(false);
    const dn = () => setDown(true);
    const up = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;
  const size = hot || label ? cfg.hoverSize : cfg.size;

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      animate={{ opacity: visible ? 1 : 0 }}
      className="pointer-events-none fixed left-0 top-0 z-[99] flex flex-col items-center"
    >
      <motion.div style={{ rotate: roll }}>
        <motion.div
          animate={{ width: size, height: size, scale: down ? 0.75 : 1, rotate: hot || label ? 72 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          {/* light: starfish */}
          <svg viewBox="0 0 24 24" className="h-full w-full dark:hidden">
            <path d={STAR} fill="#c7a982" stroke="#94744d" strokeWidth="0.9" strokeLinejoin="round" opacity={hot || label ? 0.75 : 1} />
            <g fill="#fff4f1" opacity=".9">
              <circle cx="12" cy="7" r=".7" />
              <circle cx="16.6" cy="11.4" r=".7" />
              <circle cx="14.6" cy="16.7" r=".7" />
              <circle cx="9.4" cy="16.7" r=".7" />
              <circle cx="7.4" cy="11.4" r=".7" />
              <circle cx="12" cy="12.3" r="1" />
            </g>
          </svg>
          {/* dark: glowing star */}
          <motion.svg
            viewBox="0 0 24 24"
            className="hidden h-full w-full drop-shadow-[0_0_6px_rgba(246,227,198,.85)] dark:block"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d={STAR} fill="#f6e3c6" opacity={hot || label ? 0.8 : 1} />
          </motion.svg>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {label && (
          <motion.span
            key={label}
            initial={{ opacity: 0, y: -4, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-1 rounded-full bg-stone-900 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-stone-50 dark:bg-shell dark:text-stone-900"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
