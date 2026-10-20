"use client";

import { useState } from "react";
import { skills, type Skill } from "@/data/skills";
import { AnimatePresence, motion } from "framer-motion";
import { Bubble } from "./SkillPile";

// Logos orbit the centre in three rings. The rings spin in CSS (see .orbit-* in globals.css);
// each logo counter-spins so it stays upright. Hovering or focusing a logo pauses everything.
const core = ["Python", "SQL Server", "PySpark", "Azure Data Factory", "Power BI", "Gemini"];
const rest = skills.filter((s) => !core.includes(s.name));
const rings: { items: Skill[]; radius: number; seconds: number; reverse?: boolean }[] = [
  { items: core.map((n) => skills.find((s) => s.name === n)!).filter(Boolean), radius: 24, seconds: 30 },
  { items: rest.slice(0, 10), radius: 36.5, seconds: 48, reverse: true },
  { items: rest.slice(10), radius: 49, seconds: 70 },
];

export function SkillOrbit() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="orbit relative mx-auto aspect-square w-full max-w-[520px] p-6">
      <div className="absolute inset-6">
        {/* dashed tracks */}
        {rings.map((r) => (
          <span
            key={r.radius}
            aria-hidden
            style={{ width: `${r.radius * 2}%`, height: `${r.radius * 2}%` }}
            className="absolute top-1/2 left-1/2 -translate-1/2 rounded-full border border-dashed border-stone-200 dark:border-stone-800"
          />
        ))}

        {/* the centre: a hint at rest; the hovered tool's name, big, otherwise */}
        <div aria-live="polite" className="absolute top-1/2 left-1/2 grid w-[34%] -translate-1/2 place-items-center text-center">
          <AnimatePresence mode="wait" initial={false}>
            {active ? (
              <motion.span
                key={active}
                initial={{ opacity: 0, scale: 0.8, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="text-base font-semibold leading-tight text-sea-700 sm:text-2xl dark:text-sea-200"
              >
                {active}
              </motion.span>
            ) : (
              <motion.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-mono text-[11px] text-stone-500 sm:text-xs">
                hover a planet
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {rings.map((r, ri) => (
          <ul
            key={ri}
            aria-label={ri === 0 ? "Core skills" : "More skills"}
            style={{ "--orbit-d": `${r.seconds}s` } as React.CSSProperties}
            className={`orbit-ring pointer-events-none absolute inset-0 ${r.reverse ? "orbit-ring-rev" : ""}`}
          >
            {r.items.map((s, i) => {
              const a = (i / r.items.length) * Math.PI * 2 + ri * 0.5;
              return (
                <li
                  key={s.name}
                  tabIndex={0}
                  onMouseEnter={() => setActive(s.name)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(s.name)}
                  onBlur={() => setActive(null)}
                  data-cursor
                  // rounded so server and client render the same string
                  style={{ left: `${(50 + r.radius * Math.cos(a)).toFixed(3)}%`, top: `${(50 + r.radius * Math.sin(a)).toFixed(3)}%` }}
                  className="orbit-item group pointer-events-auto absolute -translate-1/2 rounded-full outline-none hover:z-10 focus-visible:z-10"
                >
                  <span className="orbit-upright relative block max-sm:scale-[.8]">
                    <span aria-hidden className="block transition-transform duration-200 group-hover:scale-115 group-focus-visible:scale-115">
                      <Bubble s={s} size={44} />
                    </span>
                    <span className="sr-only">{s.name}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
