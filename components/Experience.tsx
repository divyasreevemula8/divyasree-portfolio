"use client";

import { motion } from "framer-motion";
import { Caveat } from "next/font/google";
import { experience, type Role } from "@/data/profile";
import { SectionLabel } from "./Reveal";
import { PipelineDemo, ResultChips } from "./RoleDemo";
import { WaveStack } from "./WaveStack";
import { SkillIcon, brandVars, findSkill } from "./SkillIcon";

const hand = Caveat({ weight: ["600"], subsets: ["latin"], display: "swap" });

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Tool chip: logo when we have one, plain text otherwise. Pops in, wiggles on hover.
function ToolChip({ name, i }: { name: string; i: number }) {
  const s = findSkill(name);
  const b = s ? brandVars(s) : { style: {}, className: "" };
  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.6, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.3 + i * 0.06 }}
      // multi-step wiggle needs a tween (springs only support two keyframes)
      whileHover={{ y: -3, rotate: [0, -4, 4, 0], transition: { duration: 0.4, ease: "easeInOut" } }}
      style={b.style}
      className={`group flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/80 py-1 pl-1.5 pr-3 text-xs text-stone-600 dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300 ${b.className}`}
    >
      {s ? <SkillIcon s={s} size={16} /> : <span className="h-1.5 w-1.5 rounded-full bg-coral-400" />}
      {name}
    </motion.li>
  );
}

function RoleCard({ r }: { r: Role }) {
  return (
    <article
      id={slug(r.company)}
      className="relative scroll-mt-24 rounded-3xl border border-stone-200 bg-stone-50/90 p-6 shadow-[0_10px_30px_-22px_rgba(51,48,43,.45)] dark:border-stone-800 dark:bg-stone-900/80"
    >
      <p className={`text-base text-coral-700 dark:text-coral-300 ${hand.className}`}>{r.period}</p>
      <h3 className="text-base font-medium leading-tight tracking-tight">{r.title}</h3>
      <p className="text-sm text-stone-500">{r.company}</p>

      <p className="mt-3 text-sm text-stone-700 dark:text-stone-300">{r.story}</p>
      <ResultChips role={r} />

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {r.tools.map((t, k) => (
          <ToolChip key={t} name={t} i={k} />
        ))}
      </ul>

      <div className="mt-5">
        <PipelineDemo role={r} compact />
      </div>
    </article>
  );
}

// Roles come in one at a time as a wave stack while you scroll (see WaveStack).
export function Experience() {
  return (
    <section id="experience" className="pt-20 sm:pt-24">
      <SectionLabel>Experience</SectionLabel>
      <WaveStack labels={experience.map((r) => r.company)} items={experience.map((r) => <RoleCard key={r.company} r={r} />)} />
    </section>
  );
}
