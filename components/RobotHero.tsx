"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Chewy } from "next/font/google";
import { profile } from "@/data/profile";
import { asset } from "@/lib/asset";

// The hero: a little data-cleaning robot stands at a conveyor belt of messy cells. Bad cells
// (NULL, dup, #REF!, impossible dates) get swept off the end with its broom; good ones get tidied
// and float up into the row of clean values under the name. Its eyes follow the cursor; hover it
// and it waves. One rAF clock drives the belt; reduced motion shows the finished, still scene.

const fun = Chewy({ weight: "400", subsets: ["latin"], display: "swap" });
const MONO = "var(--font-mono-jb), ui-monospace, monospace";

type Feed = { raw: string; clean: string | null };
const FIRST_PASS: Feed[] = [
  { raw: '" divya "', clean: "Divyasree" },
  { raw: "NULL", clean: null },
  { raw: "VEMULA  ", clean: "Vemula" },
  { raw: "2023-13-01", clean: null },
  { raw: "data&ai eng.", clean: "Data & AI Engineer" },
  { raw: "dup", clean: null },
  { raw: "winnipeg mb", clean: "Winnipeg, MB" },
  { raw: "#REF!", clean: null },
];
const JUNK = ["NULL", "dup", "#REF!", "n/a", "??", "2019/02/30", "null", "N/A"];
const CLEAN_ORDER = FIRST_PASS.filter((f) => f.clean).map((f) => f.clean!);

// scene geometry, in SVG units (viewBox 0 0 640 190)
const W = 640;
const BELT_Y = 150;
const CELL_H = 24;
const ROBOT_X = 470;
const SPEED = 70; // belt speed, units per second
const GAP = 14;

type Cell = { id: number; text: string; clean: string | null; x: number; w: number; state: "belt" | "swept" | "cleaned"; t0: number };
const widthOf = (s: string) => s.length * 7.3 + 18;

export function RobotHero() {
  const calm = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const cells = useRef<Cell[]>([]);
  const feed = useRef(0);
  const nextId = useRef(0); // survives effect re-runs, so React keys never repeat
  const sweptAt = useRef(-10);
  const [, setFrame] = useState(0);
  const [clean, setClean] = useState<string[]>([]);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [hi, setHi] = useState(false);
  const [blink, setBlink] = useState(false);
  const clock = useRef(0);
  // phones: frame only the robot's end of the belt so the cell text stays readable
  const [vbX, setVbX] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const set = () => setVbX(mq.matches ? 170 : 0);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  const vbXRef = useRef(0);
  vbXRef.current = vbX;

  // the finished state for reduced motion
  useEffect(() => {
    if (calm) setClean(CLEAN_ORDER);
  }, [calm]);

  // belt clock
  useEffect(() => {
    if (calm) return;
    let raf = 0;
    let last = performance.now();
    const next = (): Feed => {
      const i = feed.current++;
      if (i < FIRST_PASS.length) return FIRST_PASS[i];
      // after the first pass: mostly junk, now and then a good cell again
      return i % 3 === 0 ? FIRST_PASS.filter((f) => f.clean)[i % 4] : { raw: JUNK[i % JUNK.length], clean: null };
    };
    // start with the belt already loaded, the first cell just short of the robot
    if (!cells.current.length) {
      let right = ROBOT_X - 34;
      for (let k = 0; k < 4; k++) {
        const f = next();
        const w = widthOf(f.raw);
        cells.current.push({ id: nextId.current++, text: f.raw, clean: f.clean, x: right - w, w, state: "belt", t0: 0 });
        right -= w + GAP;
      }
    }
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock.current += dt;
      const t = clock.current;
      const list = cells.current;

      // spawn when the newest cell has cleared the left edge
      const newest = list[list.length - 1];
      if (!newest || newest.x > 10 + GAP) {
        const f = next();
        list.push({ id: nextId.current++, text: f.raw, clean: f.clean, x: 10 - widthOf(f.raw), w: widthOf(f.raw), state: "belt", t0: 0 });
      }
      for (const c of list) {
        if (c.state === "belt") {
          c.x += SPEED * dt;
          if (c.x + c.w >= ROBOT_X - 26) {
            c.t0 = t;
            if (c.clean) {
              c.state = "cleaned";
              c.text = c.clean;
              c.w = widthOf(c.clean);
              const v = c.clean;
              setClean((s) => (s.includes(v) ? s : [...s, v].sort((a, b) => CLEAN_ORDER.indexOf(a) - CLEAN_ORDER.indexOf(b))));
            } else {
              c.state = "swept";
              sweptAt.current = t;
            }
          }
        }
      }
      cells.current = list.filter((c) => c.state === "belt" || t - c.t0 < 1.2);
      setFrame((f) => (f + 1) % 1e6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [calm]);

  // eyes follow the pointer anywhere on the page
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = svg.current?.getBoundingClientRect();
        if (!r) return;
        const s = r.width / (W - vbXRef.current);
        const cx = r.left + (ROBOT_X + 18 - vbXRef.current) * s;
        const cy = r.top + 72 * s;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 160) * 3.2;
        setLook({ x: (dx / d) * k, y: (dy / d) * k });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // blink every few seconds
  useEffect(() => {
    if (calm) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, 2500 + Math.random() * 3000);
    };
    loop();
    return () => clearTimeout(t);
  }, [calm]);

  const t = clock.current;
  const sweeping = t - sweptAt.current < 0.45;
  const broom = sweeping ? -38 * Math.sin(((t - sweptAt.current) / 0.45) * Math.PI) : 0;
  const bob = calm ? 0 : Math.sin(t * 3) * 1.5;

  return (
    <div className="flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(profile.photo)}
        alt={profile.name}
        className="mb-4 h-20 w-20 rounded-full border-[3px] border-stone-50 object-cover ring-2 ring-sea-400 sm:h-24 sm:w-24 dark:border-stone-900"
      />
      <h1 className={`text-5xl leading-[0.95] text-stone-900 sm:text-7xl dark:text-stone-50 ${fun.className}`}>{profile.name}</h1>

      {/* clean values the robot has produced so far */}
      <ul aria-label="Cleaned values" className="mt-3 flex min-h-[26px] flex-wrap justify-center gap-1.5 font-mono text-[11px]">
        <AnimatePresence>
          {clean.map((v) => (
            <motion.li
              key={v}
              initial={{ opacity: 0, y: 24, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="rounded-md bg-sea-100 px-2 py-1 text-sea-700 dark:bg-sea-900/60 dark:text-sea-200"
            >
              &quot;{v}&quot;
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-sea-700 sm:text-sm dark:text-sea-300">{profile.title}</p>

      <svg ref={svg} viewBox={`${vbX} 0 ${W - vbX} 190`} className="mt-4 w-full max-w-2xl overflow-visible" role="img" aria-label="A small robot at a conveyor belt sweeps bad data like NULL and duplicates off the end and turns messy values into clean ones">
        {/* belt */}
        <rect x="10" y={BELT_Y} width={ROBOT_X + 60} height="14" rx="7" className="fill-stone-600 dark:fill-stone-500" />
        {[30, 140, 250, 360, 470].map((x) => (
          <g key={x}>
            <circle cx={x} cy={BELT_Y + 7} r="10" className="fill-stone-400 dark:fill-stone-600" />
            <circle cx={x} cy={BELT_Y + 7} r="3.5" className="fill-stone-100 dark:fill-stone-300" />
          </g>
        ))}

        <clipPath id="robot-belt-clip">
          <rect x={Math.max(10, vbX)} y="-200" width={W + 400} height="600" />
        </clipPath>
        {/* cells */}
        <g clipPath="url(#robot-belt-clip)">
        {calm
          ? FIRST_PASS.slice(0, 4).map((f, i) => {
              const w = widthOf(f.raw);
              const x = 20 + FIRST_PASS.slice(0, i).reduce((a, g) => a + widthOf(g.raw) + GAP, 0);
              const bad = !f.clean;
              return <CellView key={i} x={x} y={BELT_Y - CELL_H - 3} w={w} text={f.raw} kind={bad ? "bad" : "raw"} />;
            })
          : cells.current.map((c) => {
              const age = t - c.t0;
              if (c.state === "swept") {
                // knocked off the end: arcs up and away, spinning, fading
                const x = c.x + age * 190;
                const y = BELT_Y - CELL_H - 3 - (age * 170 - age * age * 260);
                return <CellView key={c.id} x={x} y={y} w={c.w} text={c.text} kind="bad" rotate={age * 260} opacity={Math.max(0, 1 - age / 1.1)} />;
              }
              if (c.state === "cleaned") {
                // tidied, then lifted toward the clean row above
                const y = BELT_Y - CELL_H - 3 - Math.max(0, age - 0.35) * 140;
                return <CellView key={c.id} x={c.x} y={y} w={c.w} text={c.text} kind="clean" opacity={Math.max(0, 1 - Math.max(0, age - 0.35) / 0.8)} />;
              }
              const bad = !c.clean;
              return <CellView key={c.id} x={c.x} y={BELT_Y - CELL_H - 3} w={c.w} text={c.text} kind={bad ? "bad" : "raw"} />;
            })}
        </g>

        {/* the robot (hover: waves and says hi) */}
        <g
          transform={`translate(${ROBOT_X + 18} ${70 + bob})`}
          onMouseEnter={() => setHi(true)}
          onMouseLeave={() => setHi(false)}
          onClick={() => setHi((h) => !h)}
          className="cursor-pointer"
          data-cursor
        >
          <rect x="-5" y="38" width="10" height="40" className="fill-stone-400" />
          <circle cx="0" cy="80" r="11" className="fill-stone-600 dark:fill-stone-400" />
          <rect x="-32" y="0" width="64" height="46" rx="20" className="fill-sea-300 stroke-sea-700 dark:fill-sea-600 dark:stroke-sea-300" strokeWidth="3" />
          {/* waving arm */}
          <g transform={`rotate(${hi ? -30 + Math.sin(t * 14) * 25 : 0} -30 14)`} style={{ transition: hi ? "none" : "transform .3s" }}>
            <line x1="-30" y1="14" x2="-52" y2={hi ? -8 : 34} strokeWidth="5" strokeLinecap="round" className="stroke-sea-700 dark:stroke-sea-300" />
            <circle cx="-53" cy={hi ? -10 : 36} r="5" className="fill-coral-400" />
          </g>
          {/* head */}
          <circle cx="0" cy="-22" r="28" className="fill-stone-50 stroke-sea-700 dark:fill-stone-100 dark:stroke-sea-300" strokeWidth="3" />
          {blink ? (
            <path d="M-15 -24h10M5 -24h10" strokeWidth="2.5" strokeLinecap="round" className="stroke-stone-900" />
          ) : (
            <g>
              <circle cx={-10 + look.x} cy={-24 + look.y} r="5.5" className="fill-stone-900" />
              <circle cx={10 + look.x} cy={-24 + look.y} r="5.5" className="fill-stone-900" />
              <circle cx={-8.5 + look.x} cy={-25.5 + look.y} r="1.8" fill="#fff" />
              <circle cx={11.5 + look.x} cy={-25.5 + look.y} r="1.8" fill="#fff" />
            </g>
          )}
          <path d={hi ? "M-9 -12q9 9 18 0" : "M-8 -12q8 6 16 0"} strokeWidth="2.5" fill="none" strokeLinecap="round" className="stroke-stone-900" />
          <circle cx="-20" cy="-13" r="4" className="fill-coral-300" opacity=".75" />
          <circle cx="20" cy="-13" r="4" className="fill-coral-300" opacity=".75" />
          <line x1="0" y1="-50" x2="0" y2="-62" strokeWidth="3" className="stroke-sea-700 dark:stroke-sea-300" />
          <circle cx="0" cy="-66" r="5" className={`fill-coral-400 ${sweeping ? "opacity-100" : "opacity-80"}`} />
          {/* broom: swings left when it sweeps */}
          <g transform={`rotate(${broom} 26 18)`}>
            <line x1="26" y1="18" x2="-22" y2="78" strokeWidth="5" strokeLinecap="round" stroke="#a46d40" />
            <path d="M-14 70l-26 4-2 18 30-6z" fill="#e8b84a" stroke="#b9862a" strokeWidth="2" />
          </g>
          {/* speech bubble */}
          {hi && (
            <g transform="translate(18 -96)">
              <rect x="0" y="0" width="74" height="26" rx="13" className="fill-stone-50 stroke-sea-700 dark:fill-stone-800 dark:stroke-sea-300" strokeWidth="2" />
              <text x="37" y="17.5" textAnchor="middle" fontSize="13" className={`fill-stone-900 dark:fill-stone-50 ${fun.className}`}>
                hi there!
              </text>
            </g>
          )}
        </g>

        {sweeping && (
          <text x={ROBOT_X + 70} y={BELT_Y - 60} fontSize="15" className={`fill-coral-600 dark:fill-coral-300 ${fun.className}`}>
            swoosh!
          </text>
        )}
      </svg>
      <p className="mt-1 font-mono text-[11px] text-stone-500">hover the robot to say hi · it&apos;s cleaning your data live</p>
    </div>
  );
}

function CellView({ x, y, w, text, kind, rotate = 0, opacity = 1 }: { x: number; y: number; w: number; text: string; kind: "raw" | "bad" | "clean"; rotate?: number; opacity?: number }) {
  const box =
    kind === "bad"
      ? "fill-coral-50 stroke-coral-400 dark:fill-coral-950 dark:stroke-coral-400"
      : kind === "clean"
        ? "fill-sea-100 stroke-sea-500 dark:fill-sea-900 dark:stroke-sea-400"
        : "fill-shell stroke-[#d8c3a0] dark:fill-stone-800 dark:stroke-stone-600";
  const ink = kind === "bad" ? "fill-coral-700 dark:fill-coral-300" : kind === "clean" ? "fill-sea-700 dark:fill-sea-200" : "fill-stone-700 dark:fill-stone-200";
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${CELL_H / 2})`} opacity={opacity}>
      <rect width={w} height={CELL_H} rx="5" className={box} strokeWidth="1.2" />
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" style={{ fontFamily: MONO, whiteSpace: "pre" }} className={ink}>
        {text}
      </text>
    </g>
  );
}
