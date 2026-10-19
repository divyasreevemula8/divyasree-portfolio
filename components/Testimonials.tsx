"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { recommendationsUrl, testimonials, type Testimonial } from "@/data/profile";
import { SectionLabel } from "./Reveal";

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

// Quote with its `highlight` phrase marked by a flat highlighter stroke that sweeps across when seen.
function Quote({ t }: { t: Testimonial }) {
  const at = t.highlight ? t.quote.indexOf(t.highlight) : -1;
  if (at < 0) return <>{t.quote}</>;
  return (
    <>
      {t.quote.slice(0, at)}
      <motion.mark
        initial={{ backgroundSize: "0% 45%" }}
        whileInView={{ backgroundSize: "100% 45%" }}
        viewport={{ once: true, margin: "-30% 0px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="bg-transparent bg-[linear-gradient(#f8b5a4,#f8b5a4)] bg-left-bottom bg-no-repeat text-[inherit] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] dark:bg-[linear-gradient(rgba(236,127,105,.45),rgba(236,127,105,.45))]"
      >
        {t.highlight}
      </motion.mark>
      {t.quote.slice(at + t.highlight!.length)}
    </>
  );
}

// One card in the deck: sticks near the top, and shrinks/dims as later cards slide over it.
function StackCard({ t, i, n, progress }: { t: Testimonial; i: number; n: number; progress: MotionValue<number> }) {
  const target = 1 - (n - 1 - i) * 0.05;
  const scale = useTransform(progress, [i / n, 1], [1, target]);
  const opacity = useTransform(progress, [i / n, 1], [1, i === n - 1 ? 1 : 0.75]);

  return (
    <div className="sticky top-20 flex min-h-[60vh] items-start justify-center sm:top-24 sm:h-[70vh]">
      <motion.figure
        style={{ scale, opacity, top: i * 22 }}
        className="relative w-full origin-top overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-[0_18px_40px_-24px_rgba(15,30,38,.35)] sm:p-9 dark:border-stone-800 dark:bg-stone-900"
      >
        <motion.span
          aria-hidden
          initial={{ scale: 0.3, rotate: -30, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="pointer-events-none absolute -top-4 right-6 select-none font-serif text-[6rem] leading-none sm:text-[9rem] text-coral-300 dark:text-coral-400/70"
        >
          &ldquo;
        </motion.span>

        <blockquote className="relative text-base leading-relaxed text-stone-700 sm:text-lg dark:text-stone-300">
          <Quote t={t} />
        </blockquote>

        <figcaption className="mt-7 flex flex-wrap items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-sea-200 text-sm font-bold text-sea-800 dark:bg-sea-800 dark:text-sea-100">{initials(t.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t.name}</p>
            <p className="text-sm text-stone-500">{t.title}</p>
            <p className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
              {t.relation} · {t.date}
            </p>
          </div>
          <a href={recommendationsUrl} target="_blank" rel="noopener noreferrer" data-cursor-label="read" className="link-sweep font-mono text-xs text-accent dark:text-accent-dark">
            See on LinkedIn ↗
          </a>
        </figcaption>
        <span className="absolute bottom-3 right-5 font-mono text-[10px] text-stone-500 dark:text-stone-400">
          {i + 1}/{n}
        </span>
      </motion.figure>
    </div>
  );
}

export function Testimonials() {
  const deck = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: deck, offset: ["start start", "end end"] });
  const n = testimonials.length;

  return (
    <section id="testimonials" className="pt-20 sm:pt-24">
      <SectionLabel>Kind words</SectionLabel>
      <p className="-mt-4 mb-6 font-mono text-xs text-stone-500">keep scrolling, the cards stack ↓</p>
      <div ref={deck} className="relative">
        {testimonials.map((t, i) => (
          <StackCard key={t.name} t={t} i={i} n={n} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
