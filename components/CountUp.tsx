"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";

// Counts from 0 to `to` the first time it scrolls into view. Writes text directly (no re-renders).
export function CountUp({ to, suffix = "", prefix = "", duration = 1.4 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = `${prefix}${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, to, suffix, prefix, duration]);

  // server/first paint shows the final value so it's correct without JS
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {to}
      {suffix}
    </span>
  );
}
