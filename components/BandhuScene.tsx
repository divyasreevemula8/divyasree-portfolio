"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

// Little story for Bandhu, left to right: WhatsApp chat lines scroll in → Gemini reads them and
// fills a PersonaProfile (dialect, tone, phrases) → the cloned voice speaks (waveform) and a
// proactive check-in bubble pops up. Loops while on screen; still frame for reduced motion.

const MONO = "ui-monospace, monospace";
const SEA = "#2d6a85";
const CORAL = "#b08d63";
const GEMINI = "M12 1.5c.6 4.9 2.6 8.5 10.5 10.5-7.9 2-9.9 5.6-10.5 10.5-.6-4.9-2.6-8.5-10.5-10.5 7.9-2 9.9-5.6 10.5-10.5z";

const chats = [
  { side: 0, w: 52 },
  { side: 1, w: 40 },
  { side: 0, w: 60 },
  { side: 1, w: 34 },
  { side: 0, w: 46 },
];
const profile = [
  { k: "dialect", v: "Telugu · Chittoor", w: 58 },
  { k: "tone", v: "warm, teasing", w: 46 },
  { k: "phrases", v: "“em chestunnav?”", w: 52 },
];
const BARS = 14;

export function BandhuScene() {
  const ref = useRef<SVGSVGElement>(null);
  const on = useInView(ref, { margin: "-40px" });
  const calm = useReducedMotion();
  const live = on && !calm;
  const LOOP = 6; // seconds for one ingest → persona → voice cycle

  return (
    <svg
      ref={ref}
      viewBox="0 0 400 120"
      className="mt-5 w-full rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-950"
      aria-label="Animation: WhatsApp chat lines are read by Gemini into a persona profile, then a cloned voice speaks a proactive check-in"
    >
      <text x="8" y="12" fontSize="8" fontFamily={MONO} className="fill-stone-500">
        chat.txt → Gemini → PersonaProfile → voice
      </text>

      {/* 1. chat export: bubbles scroll upward inside a phone-ish window */}
      <rect x="10" y="20" width="96" height="90" rx="10" className="fill-stone-50 stroke-stone-300 dark:fill-stone-900 dark:stroke-stone-700" />
      <clipPath id="bandhu-chat">
        <rect x="14" y="26" width="88" height="80" rx="6" />
      </clipPath>
      <g clipPath="url(#bandhu-chat)">
        <motion.g animate={live ? { y: [0, -36] } : undefined} transition={{ duration: LOOP / 2, repeat: Infinity, ease: "linear" }}>
          {[...chats, ...chats, ...chats].map((c, i) => (
            <rect
              key={i}
              x={c.side ? 98 - c.w : 18}
              y={30 + i * 18}
              width={c.w}
              height={11}
              rx={5.5}
              fill={c.side ? "#c3d8df" : "#f6e3c6"}
              opacity={0.95}
            />
          ))}
        </motion.g>
      </g>

      {/* chat lines flowing to Gemini */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          r="2"
          fill={SEA}
          cy={65}
          initial={{ cx: 108, opacity: 0 }}
          animate={live ? { cx: [108, 150], opacity: [0, 1, 0] } : undefined}
          transition={{ duration: 1.1, delay: i * 0.37, repeat: Infinity, ease: "easeIn" }}
        />
      ))}

      {/* 2. Gemini reads the chats */}
      {/* framer's transform would replace an SVG transform attribute, so position on an outer <g> */}
      <g transform="translate(146 53)">
        <motion.g
          animate={live ? { rotate: [0, 90], scale: [1, 1.15, 1] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <path d={GEMINI} fill="#3f84a3" opacity=".85" />
        </motion.g>
      </g>

      {/* PersonaProfile card filling in, row by row */}
      <rect x="180" y="26" width="100" height="78" rx="8" className="fill-stone-50 stroke-stone-300 dark:fill-stone-900 dark:stroke-stone-700" />
      <text x="188" y="39" fontSize="7.5" fontFamily={MONO} fontWeight="700" fill={SEA}>PersonaProfile</text>
      {profile.map((r, i) => (
        <g key={r.k} transform={`translate(188 ${52 + i * 18})`}>
          <text fontSize="6.5" fontFamily={MONO} className="fill-stone-500">{r.k}</text>
          <motion.text
            y="9"
            fontSize="7"
            className="fill-stone-800 dark:fill-stone-200"
            initial={{ opacity: calm ? 1 : 0 }}
            animate={live ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }}
            transition={{ duration: LOOP, times: [0, 0.12 + i * 0.1, 0.2 + i * 0.1, 0.9, 1], repeat: Infinity }}
          >
            {r.v}
          </motion.text>
        </g>
      ))}

      {/* arrow to voice */}
      <path d="M285 65h14m-4-4 4 4-4 4" fill="none" stroke={SEA} strokeWidth="1.5" strokeLinecap="round" opacity=".6" />

      {/* 3. cloned voice: speaker + waveform, then a proactive check-in bubble */}
      <g transform="translate(306 66)">
        <path d="M0-4h4l5-5v18l-5-5H0z" fill={SEA} />
        {Array.from({ length: BARS }, (_, i) => {
          const peak = 4 + ((i * 7) % 11) * 1.4;
          return (
            <motion.rect
              key={i}
              x={14 + i * 5}
              width="3"
              rx="1.5"
              fill={i % 4 === 0 ? CORAL : SEA}
              initial={{ height: peak, y: -peak / 2 }}
              animate={live ? { height: [3, peak, 5, peak * 0.7, 3], y: [-1.5, -peak / 2, -2.5, -peak * 0.35, -1.5] } : undefined}
              transition={{ duration: 1.1, delay: i * 0.06, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </g>
      <g transform="translate(318 24)">
      <motion.g
        initial={{ opacity: calm ? 1 : 0 }}
        animate={live ? { opacity: [0, 0, 1, 1, 0], y: [6, 6, 0, 0, -4] } : { opacity: 1 }}
        transition={{ duration: LOOP, times: [0, 0.5, 0.58, 0.92, 1], repeat: Infinity }}
      >
        <rect x="-10" y="0" width="84" height="20" rx="10" fill={CORAL} />
        <path d="M2 19l-4 6 9-6z" fill={CORAL} />
        <text x="32" y="13.5" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
          అన్నం తిన్నావా?
        </text>
      </motion.g>
      </g>
      <text x="306" y="112" fontSize="6.5" fontFamily={MONO} className="fill-stone-500">IndicF5 voice · daily check-in</text>
    </svg>
  );
}
