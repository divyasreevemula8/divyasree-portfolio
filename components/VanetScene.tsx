"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// Little road for the VANET project: cars stream past, a detector scan sweeps across,
// and one car (with a flickering "ghost" copy = spoofed position) gets flagged as an anomaly.
const cars = [
  { lane: 0, dur: 7, delay: 0, color: "#6fc0b8" },
  { lane: 1, dur: 9, delay: -3, color: "#a99f8d" },
  { lane: 0, dur: 7, delay: -3.5, color: "#9ad6cf" },
  { lane: 1, dur: 9, delay: -7.5, color: "#d6cab3" },
];

function Car({ color }: { color: string }) {
  return (
    <g>
      <rect x="-14" y="-6" width="28" height="12" rx="4" fill={color} />
      <rect x="-5" y="-4.5" width="10" height="9" rx="2" fill="white" opacity=".55" />
    </g>
  );
}

export function VanetScene() {
  const ref = useRef<SVGSVGElement>(null);
  const on = useInView(ref, { margin: "-40px" });
  const laneY = [34, 70];
  const loop = (dur: number, delay: number) => ({
    animate: on ? { x: [-30, 430] } : undefined,
    transition: { duration: dur, delay, repeat: Infinity, ease: "linear" as const },
  });

  return (
    <svg ref={ref} viewBox="0 0 400 104" className="mt-5 w-full rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-950" aria-label="Animation: vehicles on a road; a detector flags one spoofing vehicle">
      {/* road */}
      <rect x="0" y="18" width="400" height="68" className="fill-stone-300/60 dark:fill-stone-800" />
      <line x1="0" y1="52" x2="400" y2="52" strokeDasharray="12 10" strokeWidth="2" className="stroke-stone-50 dark:stroke-stone-600" />

      {cars.map((c, i) => (
        <motion.g key={i} initial={{ x: -30 }} {...loop(c.dur, c.delay)} style={{ y: laneY[c.lane] }}>
          <Car color={c.color} />
        </motion.g>
      ))}

      {/* the spoofer: real car + flickering ghost a lane over, ringed and tagged */}
      <motion.g initial={{ x: -30 }} {...loop(8, -1.5)} style={{ y: laneY[1] }}>
        <motion.g animate={on ? { opacity: [0, 0.45, 0, 0.35, 0] } : undefined} transition={{ duration: 1.2, repeat: Infinity }} transform="translate(18,-36)">
          <rect x="-14" y="-6" width="28" height="12" rx="4" fill="none" stroke="#ec7f69" strokeDasharray="3 2" />
        </motion.g>
        <Car color="#f49e8c" />
        <motion.circle r="19" fill="none" stroke="#ec7f69" strokeWidth="2" animate={on ? { scale: [1, 1.15, 1], opacity: [0.9, 0.4, 0.9] } : undefined} transition={{ duration: 1, repeat: Infinity }} />
        <g transform="translate(0,-26)">
          <rect x="-24" y="-8" width="48" height="13" rx="6.5" fill="#ec7f69" />
          <text x="0" y="1.5" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="white">anomaly</text>
        </g>
      </motion.g>

      {/* detector scan */}
      <motion.rect y="14" width="3" height="76" rx="1.5" fill="#1f7f7a" opacity=".55" initial={{ x: 0 }} animate={on ? { x: [0, 397, 0] } : undefined} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <text x="8" y="12" fontSize="8" fontFamily="ui-monospace, monospace" className="fill-stone-500">CNN-LSTM + SVM · scanning telemetry</text>
    </svg>
  );
}
