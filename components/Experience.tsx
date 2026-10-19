"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { experience, type Role } from "@/data/profile";
import { pipelines } from "@/data/pipelines";
import { SectionLabel } from "./Reveal";
import { PipelineDemo, ResultChips } from "./RoleDemo";
import { SkillIcon, brandVars, findSkill } from "./SkillIcon";

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

function RoleCard({ r, idx, active }: { r: Role; idx: number; active: boolean }) {
  const fromLeft = idx % 2 === 0;

  return (
    <motion.article
      id={slug(r.company)}
      data-role={idx}
      initial={{ opacity: 0, x: fromLeft ? -40 : 40, rotate: fromLeft ? -2 : 2 }}
      whileInView={{ opacity: 1, x: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 70, damping: 16 }}
      className={`relative scroll-mt-24 rounded-3xl border bg-white/70 p-6 shadow-[0_10px_40px_-20px_rgba(31,127,122,.35)] backdrop-blur transition-[box-shadow,border-color] duration-500 dark:bg-stone-900/60 ${
        active ? "lg:border-sea-500 lg:ring-2 lg:ring-sea-300/60 dark:lg:border-sea-300" : ""
      } border-stone-200 dark:border-stone-800`}
    >
      <p className="font-mono text-[11px] text-stone-500">{r.period}</p>
      <h3 className="text-lg font-semibold leading-tight tracking-tight">{r.title}</h3>
      <p className="text-sm text-stone-500">{r.company}</p>

      <p className="mt-4 text-[15px] font-medium text-stone-700 dark:text-stone-300">{r.story}</p>
      <ResultChips role={r} />

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {r.tools.map((t, k) => (
          <ToolChip key={t} name={t} i={k} />
        ))}
      </ul>

      {/* phones & tablets: the pipeline lives right in the card, already open */}
      <div className="mt-5 lg:hidden">
        <PipelineDemo role={r} compact />
      </div>
      {/* desktop: a nudge toward the live panel */}
      <p className={`mt-4 hidden font-mono text-[11px] lg:block ${active ? "text-sea-700 dark:text-sea-300" : "text-stone-400"}`}>
        {active ? "→ this pipeline is in the panel. hit ▶ run" : "scroll here to load this pipeline →"}
      </p>
    </motion.article>
  );
}

// Which card sits in the middle band of the screen.
function useActiveCard(ref: React.RefObject<HTMLDivElement | null>) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const cards = ref.current?.querySelectorAll<HTMLElement>("[data-role]");
    if (!cards) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(Number((hit.target as HTMLElement).dataset.role));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [ref]);
  return active;
}

/** Desktop: one sticky panel showing the pipeline for the role you're reading. Nothing runs until Run is clicked. */
function LivePanel({ role }: { role: Role }) {
  const job = pipelines[role.company]?.job;
  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-stone-200 bg-stone-50/80 p-4 backdrop-blur dark:border-stone-800 dark:bg-stone-900/70">
      <AnimatePresence mode="wait">
        <motion.div key={role.company} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
          <p className="mb-1 font-mono text-xs text-stone-500">
            🛠 now playing: <span className="font-semibold text-sea-700 dark:text-sea-300">{role.company}</span> · {job}
          </p>
          <PipelineDemo role={role} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function Experience() {
  const list = useRef<HTMLDivElement>(null);
  const active = useActiveCard(list);

  return (
    // on wide screens the section breaks out of the narrow column to fit the side panel
    <section id="experience" className="pt-20 sm:pt-24 lg:relative lg:left-1/2 lg:w-screen lg:-translate-x-1/2">
      <div className="lg:mx-auto lg:max-w-6xl lg:px-8">
        <SectionLabel>Experience</SectionLabel>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
          <div ref={list} className="space-y-10">
            {experience.map((r, i) => (
              <RoleCard key={r.company} r={r} idx={i} active={i === active} />
            ))}
          </div>
          <div className="hidden lg:block">
            <LivePanel role={experience[active]} />
          </div>
        </div>
      </div>
    </section>
  );
}
