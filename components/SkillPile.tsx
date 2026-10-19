"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { skills, type Skill } from "@/data/skills";
import { SkillIcon, brandVars } from "./SkillIcon";

// A pile of logo bubbles with a tiny hand-rolled circle physics loop.
// Units: px and "frames" (1 frame = 1/60 s), so the constants read like per-frame nudges.
const HEIGHT = 360;
const GRAVITY = 0.55;
const WALL_BOUNCE = 0.45;
const BALL_BOUNCE = 0.35;
const AIR = 0.996;
const FLOOR_FRICTION = 0.9;
const MAX_SPEED = 38;
const SLEEP_SPEED = 0.25;
const SLEEP_FRAMES = 45;
const DROP_STAGGER = 70; // ms between bubbles on the first drop

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  live: boolean; // dropped in yet?
  inside: boolean; // has fallen below the ceiling (so it now bounces off it)
  rest: number; // consecutive slow frames
};

type Drag = { i: number; id: number; ox: number; oy: number; tx: number; ty: number; vx: number; vy: number; t: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function Bubble({ s, size }: { s: Skill; size: number }) {
  const b = brandVars(s);
  return (
    <span
      style={{ ...b.style, width: size, height: size }}
      className={`bubble-face grid place-items-center rounded-full border border-[color-mix(in_srgb,var(--brand)_35%,transparent)] bg-[color-mix(in_srgb,var(--brand)_14%,white)] shadow-[0_6px_16px_-8px_var(--brand),inset_0_-4px_8px_-4px_color-mix(in_srgb,var(--brand)_30%,transparent),inset_0_3px_6px_-2px_rgba(255,255,255,0.9)] dark:bg-[color-mix(in_srgb,var(--brand)_22%,var(--color-stone-900))] dark:shadow-[0_6px_16px_-8px_var(--brand),inset_0_3px_6px_-3px_rgba(255,255,255,0.25)] ${b.className}`}
    >
      {/* full-colour logos carry their own padding, so draw them a touch bigger */}
      <SkillIcon s={s} size={Math.round(size * (s.art ? 0.56 : 0.44))} brand />
    </span>
  );
}

export function SkillPile() {
  const [reduced, setReduced] = useState(false);
  const [radius, setRadius] = useState(30);
  const box = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const faces = useRef<(HTMLSpanElement | null)[]>([]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const drag = useRef<Drag | null>(null);
  const width = useRef(0);
  const r = useRef(30);
  const raf = useRef(0);
  const last = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const paint = useCallback(() => {
    const R = r.current;
    bodies.current.forEach((b, i) => {
      const el = els.current[i];
      if (!el) return;
      el.style.opacity = b.live ? "1" : "0";
      el.style.transform = `translate3d(${b.x - R}px, ${b.y - R}px, 0)`;
      const face = faces.current[i];
      if (face) face.style.transform = `rotate(${b.angle}rad)`;
      // keep the name tag inside the box: nudge it off the side walls, flip it below near the ceiling
      const tag = labels.current[i];
      if (tag) {
        const half = tag.offsetWidth / 2 + 4;
        const shift = Math.max(half - b.x, 0) - Math.max(b.x + half - width.current, 0);
        tag.style.left = `calc(50% + ${shift}px)`;
        const below = b.y < R + 24;
        tag.style.top = below ? "calc(100% + 4px)" : "auto";
        tag.style.bottom = below ? "auto" : "calc(100% + 4px)";
      }
    });
  }, []);

  const step = useCallback((h: number) => {
    const R = r.current;
    const W = width.current;
    const list = bodies.current;
    const d = drag.current;

    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!b.live) continue;
      if (d && d.i === i) {
        b.x = d.tx;
        b.y = d.ty;
        b.vx = d.vx;
        b.vy = d.vy;
        continue;
      }
      b.vy += GRAVITY * h;
      b.vx *= AIR;
      b.vy *= AIR;
      b.x += b.vx * h;
      b.y += b.vy * h;
    }

    // circle–circle: push apart, then exchange momentum along the contact normal
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        if (!a.live) continue;
        for (let j = i + 1; j < list.length; j++) {
          const c = list[j];
          if (!c.live) continue;
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const d2 = dx * dx + dy * dy;
          const min = 2 * R;
          if (d2 >= min * min || d2 === 0) continue;
          const dist = Math.sqrt(d2);
          const nx = dx / dist;
          const ny = dy / dist;
          const wa = d && d.i === i ? 0 : 1;
          const wc = d && d.i === j ? 0 : 1;
          const wsum = wa + wc;
          if (!wsum) continue;
          const push = (min - dist) / wsum;
          a.x -= nx * push * wa;
          a.y -= ny * push * wa;
          c.x += nx * push * wc;
          c.y += ny * push * wc;
          if (pass) continue;
          const vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (vn < 0) {
            const imp = (-(1 + BALL_BOUNCE) * vn) / wsum;
            a.vx -= imp * nx * wa;
            a.vy -= imp * ny * wa;
            c.vx += imp * nx * wc;
            c.vy += imp * ny * wc;
          }
        }
      }
    }

    // walls, floor, ceiling
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!b.live || (d && d.i === i)) continue;
      if (b.x < R) {
        b.x = R;
        if (b.vx < 0) b.vx = -b.vx * WALL_BOUNCE;
      } else if (b.x > W - R) {
        b.x = W - R;
        if (b.vx > 0) b.vx = -b.vx * WALL_BOUNCE;
      }
      if (b.y > HEIGHT - R) {
        b.y = HEIGHT - R;
        if (b.vy > 0) b.vy = b.vy > 1.5 ? -b.vy * WALL_BOUNCE : 0;
        b.vx *= FLOOR_FRICTION;
      }
      if (b.y > R) b.inside = true;
      if (b.inside && b.y < R) {
        b.y = R;
        if (b.vy < 0) b.vy = -b.vy * WALL_BOUNCE;
      }
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAX_SPEED) {
        b.vx *= MAX_SPEED / sp;
        b.vy *= MAX_SPEED / sp;
      }
      b.angle += (b.vx * h) / R; // roll
    }
  }, []);

  const tick = useCallback(
    (now: number) => {
      const dt = Math.min((now - last.current) / (1000 / 60), 2.5);
      last.current = now;
      step(dt / 2);
      step(dt / 2);
      paint();

      let awake = !!drag.current;
      for (const b of bodies.current) {
        if (!b.live) continue;
        b.rest = Math.hypot(b.vx, b.vy) < SLEEP_SPEED ? b.rest + 1 : 0;
        if (b.rest < SLEEP_FRAMES) awake = true;
      }
      if (bodies.current.some((b) => !b.live)) awake = true;
      raf.current = awake ? requestAnimationFrame(tick) : 0;
    },
    [step, paint],
  );

  const wake = useCallback(() => {
    for (const b of bodies.current) b.rest = 0;
    if (raf.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  // measure, then drop the bubbles in the first time the pile scrolls into view
  useEffect(() => {
    if (reduced) return;
    const el = box.current;
    if (!el) return;
    width.current = el.clientWidth;
    r.current = width.current < 480 ? 27 : 31;
    setRadius(r.current);
    bodies.current = skills.map(() => ({ x: 0, y: -100, vx: 0, vy: 0, angle: 0, live: false, inside: false, rest: 0 }));
    paint();

    const ro = new ResizeObserver(() => {
      width.current = el.clientWidth;
      wake();
    });
    ro.observe(el);

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const order = skills.map((_, i) => i).sort(() => Math.random() - 0.5);
        order.forEach((i, k) => {
          timers.current.push(
            window.setTimeout(() => {
              const R = r.current;
              Object.assign(bodies.current[i], {
                x: rand(R, width.current - R),
                y: -R - rand(0, 20),
                vx: rand(-2, 2),
                vy: rand(1, 4),
                angle: rand(-0.6, 0.6),
                live: true,
              });
              wake();
            }, k * DROP_STAGGER),
          );
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    return () => {
      ro.disconnect();
      io.disconnect();
      timers.current.forEach(clearTimeout);
      timers.current = [];
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [reduced, paint, wake]);

  const local = (e: React.PointerEvent) => {
    const rect = box.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bodies.current[i];
    if (!b?.live || drag.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.drag = "true";
    const p = local(e);
    drag.current = { i, id: e.pointerId, ox: b.x - p.x, oy: b.y - p.y, tx: b.x, ty: b.y, vx: 0, vy: 0, t: performance.now() };
    b.inside = true;
    wake();
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const R = r.current;
    const p = local(e);
    const now = performance.now();
    const frames = Math.max((now - d.t) / (1000 / 60), 0.25);
    const tx = Math.min(Math.max(p.x + d.ox, R), width.current - R);
    const ty = Math.min(Math.max(p.y + d.oy, R), HEIGHT - R);
    // smoothed pointer velocity, in px/frame
    d.vx = d.vx * 0.4 + ((tx - d.tx) / frames) * 0.6;
    d.vy = d.vy * 0.4 + ((ty - d.ty) / frames) * 0.6;
    d.tx = tx;
    d.ty = ty;
    d.t = now;
  };

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    delete e.currentTarget.dataset.drag;
    const b = bodies.current[d.i];
    // a pointer that paused before letting go shouldn't fling
    const still = performance.now() - d.t > 90;
    b.vx = still ? 0 : d.vx;
    b.vy = still ? 0 : d.vy;
    drag.current = null;
    wake();
  };

  const shake = () => {
    for (const b of bodies.current) {
      if (!b.live) continue;
      b.vx += rand(-9, 9);
      b.vy -= rand(9, 17);
    }
    wake();
  };

  const size = radius * 2;

  return (
    <div>
      <ul className="sr-only">
        {skills.map((s) => (
          <li key={s.name}>{s.name}</li>
        ))}
      </ul>

      {reduced ? (
        <div aria-hidden className="flex flex-wrap justify-center gap-2 rounded-3xl border border-dashed border-stone-200 p-4 dark:border-stone-800">
          {skills.map((s) => (
            <div key={s.name} title={s.name}>
              <Bubble s={s} size={56} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div
            ref={box}
            aria-hidden
            style={{ height: HEIGHT }}
            className="relative w-full overflow-hidden rounded-3xl border border-dashed border-stone-200 bg-linear-to-b from-transparent to-sea-100/40 dark:border-stone-800 dark:to-sea-950/20"
          >
            {skills.map((s, i) => (
              <div
                key={s.name}
                ref={(el) => {
                  els.current[i] = el;
                }}
                onPointerDown={onDown(i)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                data-cursor
                style={{ width: size, height: size, opacity: 0, transform: "translate3d(0,-200px,0)" }}
                className="group absolute top-0 left-0 cursor-grab touch-none select-none will-change-transform hover:z-20 active:cursor-grabbing data-[drag=true]:z-30"
              >
                <span
                  ref={(el) => {
                    faces.current[i] = el;
                  }}
                  className="block transition-[scale] duration-150 group-hover:scale-105 group-data-[drag=true]:scale-110"
                >
                  <Bubble s={s} size={size} />
                </span>
                <span
                  ref={(el) => {
                    labels.current[i] = el;
                  }}
                  className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-stone-900 px-2 py-0.5 font-mono text-[10px] text-white opacity-0 transition-[opacity,translate] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-data-[drag=true]:translate-y-0 group-data-[drag=true]:opacity-100 dark:bg-stone-100 dark:text-stone-900">
                  {s.name}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 font-mono text-xs text-stone-500">
            <span>grab one &amp; toss it ↑</span>
            <button
              type="button"
              onClick={shake}
              className="rounded-full border border-stone-200 bg-white/70 px-3 py-1.5 text-stone-600 transition hover:-rotate-3 hover:border-accent hover:text-accent active:scale-95 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:border-accent-dark dark:hover:text-accent-dark"
            >
              🫨 shake
            </button>
          </div>
        </>
      )}
    </div>
  );
}
