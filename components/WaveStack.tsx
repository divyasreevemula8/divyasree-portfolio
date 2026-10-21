"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

// Wave stack: the section holds still while you scroll through it. Each next card rolls up from
// below over the last one, a line of foam on its leading edge; the card underneath sinks back,
// shrinks a little and goes soft, like something left behind on wet sand. A slim tide gauge on the
// side fills with water as you go. Everything follows the scroll and reverses if you scroll back.
// Phones and short screens get a lighter version, Wash in: each card washes up with foam as it
// scrolls into view and settles back as it leaves, so nothing has to fit in one pinned screen.
// Reduced motion gets a plain list.

// A ragged line of foam along a card's top edge.
function Foam({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 400 20"
      preserveAspectRatio="none"
      style={{ opacity }}
      className="pointer-events-none absolute inset-x-2 -top-3 z-10 h-5 w-[calc(100%-1rem)]"
    >
      <path
        d="M0 14C18 6 30 16 48 10s34 4 52-1 30 7 50 2 36-6 54 0 30 6 50 0 32-5 50 1 30 4 46-2 32 5 50 0V20H0Z"
        className="fill-white/85 dark:fill-sea-200/40"
      />
      <path d="M0 14C18 6 30 16 48 10s34 4 52-1 30 7 50 2 36-6 54 0 30 6 50 0 32-5 50 1 30 4 46-2 32 5 50 0" fill="none" className="stroke-sea-300/70" strokeWidth="1.5" />
    </motion.svg>
  );
}

function Card({ i, f, children }: { i: number; f: MotionValue<number>; children: React.ReactNode }) {
  // local < 0: still rolling in from below; 0: current; > 0: being covered by the next one
  const local = useTransform(f, (v) => v - i);
  const y = useTransform(local, [-1, 0, 1], ["105%", "0%", "-4%"]);
  const scale = useTransform(local, [0, 1, 2], [1, 0.93, 0.88]);
  // a sand-coloured veil instead of a CSS blur: blur on a big card repaints every frame and makes scrolling stutter
  const veil = useTransform(local, [0, 1, 2], [0, 0.55, 0.8]);
  const opacity = useTransform(local, [-1, -0.98, 0, 1, 2.2], [0, 1, 1, 0.65, 0]);
  const foam = useTransform(local, [-1, -0.6, -0.05, 0], [1, 1, 0.9, 0]);
  const tilt = ((i * 37) % 5) - 2; // each card lands a hair crooked
  const rotate = useTransform(local, [-1, 0, 1], [tilt * 0.6, tilt * 0.15, tilt * 0.3]);
  // cards still waiting below (invisible) or long buried shouldn't catch the mouse or the wheel
  const pointerEvents = useTransform(local, (v) => (v > -0.5 && v < 1.5 ? "auto" : "none"));

  return (
    <motion.div style={{ y: i === 0 ? undefined : y, scale, opacity, rotate, zIndex: i, pointerEvents }} className="absolute inset-x-0 top-0 origin-top will-change-transform">
      {/* foam riding the top edge while the card comes in */}
      {i > 0 && <Foam opacity={foam} />}
      {/* solid backing so the card underneath doesn't show through the glassy card; if an opened
          demo makes it taller than the screen it scrolls, and the wheel passes on to the page at the end */}
      <div className="relative max-h-[calc(100vh-11rem)] overflow-y-auto rounded-3xl bg-stone-50 dark:bg-stone-950">
        {children}
        <motion.div aria-hidden style={{ opacity: veil }} className="pointer-events-none absolute inset-0 rounded-3xl bg-stone-50 dark:bg-stone-950" />
      </div>
    </motion.div>
  );
}

// A slim glass gauge on the edge: water rises with progress, with a little wave on its surface.
function TideGauge({ p, n, labels, current }: { p: MotionValue<number>; n: number; labels: string[]; current: number }) {
  const level = useTransform(p, [0, 1], ["6%", "100%"]);
  return (
    <div aria-hidden className="absolute top-2 -right-2 bottom-2 hidden w-14 sm:block lg:-right-16">
      <div className="absolute top-0 bottom-0 left-1/2 w-3 -translate-x-1/2 overflow-hidden rounded-full border border-stone-300/80 bg-stone-100/70 dark:border-stone-700 dark:bg-stone-900/60">
        <motion.div style={{ height: level }} className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sea-600/80 to-sea-300/70">
          <svg viewBox="0 0 12 6" className="wave absolute -top-[5px] left-0 h-[6px] w-[24px]" style={{ "--wave-d": "2.4s" } as React.CSSProperties}>
            <path d="M0 3q1.5-3 3 0t3 0 3 0 3 0V6H0z" className="fill-sea-300/90" />
          </svg>
        </motion.div>
      </div>
      {/* a tick per card */}
      {labels.map((l, k) => (
        <span
          key={l}
          className={`absolute left-full ml-1 -translate-y-1/2 font-mono text-[9px] whitespace-nowrap transition-colors ${k === current ? "text-sea-700 dark:text-sea-300" : "text-stone-400"}`}
          style={{ bottom: `${(k / Math.max(1, n - 1)) * 94 + 3}%` }}
        >
          {k === current ? "●" : "·"}
        </span>
      ))}
    </div>
  );
}

export function WaveStack({ items, labels }: { items: React.ReactNode[]; labels: string[] }) {
  const calm = useReducedMotion();
  const [roomy, setRoomy] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (min-height: 680px)");
    const set = () => setRoomy(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  if (!calm && !roomy) {
    return (
      <div className="space-y-10">
        {items.map((it, i) => (
          <WashIn key={labels[i]} i={i}>
            {it}
          </WashIn>
        ))}
      </div>
    );
  }
  if (calm) {
    return (
      <div className="space-y-10">
        {items.map((it, i) => (
          <div key={labels[i]}>{it}</div>
        ))}
      </div>
    );
  }
  return <PinnedStack items={items} labels={labels} />;
}

// Phone version: the card follows its own trip through the screen. It rises in from below a little
// crooked with foam on top, straightens and stays clear while you read, then sinks back as it leaves.
function WashIn({ i, children }: { i: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // 0: card's top reaches the bottom of the screen, 1: its bottom leaves the top
  const { scrollYProgress: t } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const tilt = i % 2 ? 1.6 : -1.6;
  const y = useTransform(t, [0, 0.3, 0.75, 1], [70, 0, 0, -24]);
  const rotate = useTransform(t, [0, 0.3], [tilt, 0]);
  const scale = useTransform(t, [0, 0.3, 0.75, 1], [0.94, 1, 1, 0.96]);
  const opacity = useTransform(t, [0, 0.22, 0.8, 1], [0.25, 1, 1, 0.55]);
  const foam = useTransform(t, [0, 0.12, 0.3, 0.36], [0, 1, 1, 0]);
  return (
    <motion.div ref={ref} style={{ y, rotate, scale, opacity }} className="relative will-change-transform">
      <Foam opacity={foam} />
      {children}
    </motion.div>
  );
}

// Separate component so useScroll attaches once the track is actually in the page.
function PinnedStack({ items, labels }: { items: React.ReactNode[]; labels: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const n = items.length;
  const [current, setCurrent] = useState(0);

  // progress through the section while its sticky stage is pinned
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start 96px", "end end"] });
  // 0 → n-1, with a short pause on each card so it can be read before the next rolls in
  const f = useTransform(p, (v) => {
    const raw = v * (n - 1);
    const k = Math.floor(raw);
    const frac = raw - k;
    const held = frac < 0.1 ? 0 : frac > 0.9 ? 1 : (frac - 0.1) / 0.8;
    return Math.min(n - 1, k + held);
  });
  useMotionValueEvent(f, "change", (v) => setCurrent(Math.round(v)));

  return (
    // tall track: a bit over half a screen of scroll per card; the stage inside stays pinned
    <div ref={ref} style={{ height: `${n * 55 + 45}vh` }} className="relative">
      <div className="sticky top-24 h-[calc(100vh-7rem)]">
        <div className="relative h-full">
          {items.map((it, i) => (
            <Card key={labels[i]} i={i} f={f}>
              {it}
            </Card>
          ))}
          <TideGauge p={p} n={n} labels={labels} current={current} />
        </div>
      </div>
    </div>
  );
}
