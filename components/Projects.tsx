"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { projects, type Project } from "@/data/profile";
import { Reveal, SectionLabel } from "./Reveal";
import { VanetScene } from "./VanetScene";
import { BandhuScene } from "./BandhuScene";

function Card({ p }: { p: Project }) {
  // Cursor-follow spotlight: pointer position is written to CSS vars and read by the gradient overlay.
  // The same pointer position also drives a subtle 3D tilt (max ~4deg), eased by springs.
  const tx = useMotionValue(0.5);
  const ty = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(ty, [0, 1], [4, -4]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(tx, [0, 1], [-4, 4]), { stiffness: 200, damping: 20 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
    tx.set((e.clientX - r.left) / r.width);
    ty.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    tx.set(0.5);
    ty.set(0.5);
  };

  const Tag = p.href ? motion.a : motion.article;
  const linkProps = p.href ? { href: p.href, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Tag
      {...linkProps}
      data-cursor-label="view"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative block overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-stone-800 dark:bg-stone-900 dark:hover:shadow-sea-950/60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(320px circle at var(--x) var(--y), rgba(143,216,210,.28), transparent 70%)" }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{p.name}</h3>
          {p.href && (
            <span className="text-stone-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent dark:group-hover:text-accent-dark">↗</span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">{p.blurb}</p>
        <ul className="mt-4 list-disc space-y-1 pl-4 text-sm text-stone-500 marker:text-stone-400">
          {p.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        {p.scene === "vanet" && <VanetScene />}
        {p.scene === "bandhu" && <BandhuScene />}
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {p.stack.map((s) => (
            <li key={s} className="rounded-full border border-stone-200 px-2.5 py-0.5 font-mono text-xs text-stone-600 dark:border-stone-700 dark:text-stone-400">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </Tag>
  );
}

export function Projects() {
  return (
    <section id="projects" className="pt-20 sm:pt-24">
      <Reveal>
        <SectionLabel>Projects</SectionLabel>
      </Reveal>
      <div className="grid gap-5">
        {projects.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <Card p={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
