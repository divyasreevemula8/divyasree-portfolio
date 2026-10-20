"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Chewy } from "next/font/google";
import { profile } from "@/data/profile";
import { asset } from "@/lib/asset";

// The hero: a cute robot vacuum sits at the end of a conveyor belt of messy cells. Bad cells
// (NULL, dup, #REF!, impossible dates) get slurped up with a whoosh; good ones hop over it, get
// tidied and float up into a row of clean facts under the name. Its eyes follow the cursor, and
// every hover (or tap) it says the next line: hi, how are you, then something silly.
// One rAF clock drives the belt; reduced motion shows the finished, still scene.

const fun = Chewy({ weight: "400", subsets: ["latin"], display: "swap" });
const MONO = "var(--font-mono-jb), ui-monospace, monospace";

type Feed = { raw: string; clean: string | null };
// good cells clean into facts that aren't already in the name or title above
const FIRST_PASS: Feed[] = [
  { raw: '" 4+ YRS "', clean: "4+ years in data" },
  { raw: "NULL", clean: null },
  { raw: "winnipeg mb", clean: "Winnipeg, MB" },
  { raw: "2023-13-01", clean: null },
  { raw: "adf|ssis|sql", clean: "ADF · SSIS · SQL" },
  { raw: "dup", clean: null },
  { raw: "genai agnts", clean: "GenAI agents" },
  { raw: "#REF!", clean: null },
];
const JUNK = ["NULL", "dup", "#REF!", "n/a", "??", "2019/02/30", "null", "N/A"];
const CLEAN_ORDER = FIRST_PASS.filter((f) => f.clean).map((f) => f.clean!);

const LINES = ["Hi there!", "How are you?"];
const FUNNY = [
  "I eat NULLs for breakfast",
  "#REF! is my villain origin story",
  "No duplicates were harmed… okay, a few",
  "I run on clean data & chai",
  "Ask me about your messy spreadsheets",
];
const lineAt = (n: number) => (n < LINES.length ? LINES[n] : FUNNY[(n - LINES.length) % FUNNY.length]);

// scene geometry, in SVG units (viewBox 0 0 640 190)
const W = 640;
const BELT_Y = 150;
const CELL_H = 24;
const VAC_X = 492; // vacuum centre
const MOUTH_X = VAC_X - 50; // where bad cells get slurped
const SPEED = 70; // belt speed, units per second
const GAP = 14;

type Cell = { id: number; text: string; clean: string | null; x: number; w: number; state: "belt" | "slurped" | "hopped"; t0: number };
const widthOf = (s: string) => s.length * 7.3 + 18;

export function RobotHero() {
  const calm = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const cells = useRef<Cell[]>([]);
  const feed = useRef(0);
  const nextId = useRef(0); // survives effect re-runs, so React keys never repeat
  const slurpAt = useRef(-10);
  const clock = useRef(0);
  const [, setFrame] = useState(0);
  const [clean, setClean] = useState<string[]>([]);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  // hover talk: which line we're on, and whether the bubble is showing
  const [said, setSaid] = useState(-1);
  const [talking, setTalking] = useState(false);
  const [hover, setHover] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // phones: frame only the vacuum's end of the belt so the cell text stays readable
  const [vbX, setVbX] = useState(0);
  const vbXRef = useRef(0);
  vbXRef.current = vbX;
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const set = () => setVbX(mq.matches ? 170 : 0);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

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
    // start with the belt already loaded, the first cell just short of the vacuum
    if (!cells.current.length) {
      let right = MOUTH_X - 20;
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

      const newest = list[list.length - 1];
      if (!newest || newest.x > 10 + GAP) {
        const f = next();
        list.push({ id: nextId.current++, text: f.raw, clean: f.clean, x: 10 - widthOf(f.raw), w: widthOf(f.raw), state: "belt", t0: 0 });
      }
      for (const c of list) {
        if (c.state !== "belt") continue;
        c.x += SPEED * dt;
        if (c.x + c.w >= MOUTH_X - 4) {
          c.t0 = t;
          if (c.clean) {
            c.state = "hopped";
            const v = c.clean;
            setClean((s) => (s.includes(v) ? s : [...s, v].sort((a, b) => CLEAN_ORDER.indexOf(a) - CLEAN_ORDER.indexOf(b))));
          } else {
            c.state = "slurped";
            slurpAt.current = t;
          }
        }
      }
      cells.current = list.filter((c) => c.state === "belt" || t - c.t0 < 1.4);
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
        const dx = e.clientX - (r.left + (VAC_X - vbXRef.current) * s);
        const dy = e.clientY - (r.top + 118 * s);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 160) * 2.6;
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
        setTimeout(() => setBlink(false), 130);
        loop();
      }, 2500 + Math.random() * 3000);
    };
    loop();
    return () => clearTimeout(t);
  }, [calm]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const say = () => {
    clearTimeout(hideTimer.current);
    setSaid((n) => n + 1);
    setTalking(true);
  };
  const quiet = (ms: number) => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTalking(false), ms);
  };

  const t = clock.current;
  const sinceSlurp = t - slurpAt.current;
  const gulp = !calm && sinceSlurp < 0.55 ? Math.sin((sinceSlurp / 0.55) * Math.PI) : 0; // squash & stretch
  const wobble = calm ? 0 : Math.sin(t * 2.2) * 1.5;
  const line = said >= 0 ? lineAt(said) : "";
  const bubbleW = line.length * 6.6 + 26;
  const bubbleX = Math.min(Math.max(VAC_X - bubbleW / 2, vbX + 4), W - 4 - bubbleW);

  return (
    <div className="flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(profile.photo)}
        alt={profile.name}
        className="mb-4 h-20 w-20 rounded-full border-[3px] border-stone-50 object-cover ring-2 ring-sea-400 sm:h-24 sm:w-24 dark:border-stone-900"
      />
      <h1 className={`text-5xl leading-[0.95] text-stone-900 sm:text-7xl dark:text-stone-50 ${fun.className}`}>{profile.name}</h1>
      <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-sea-700 sm:text-sm dark:text-sea-300">{profile.title}</p>

      {/* clean facts the vacuum has produced so far */}
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
              {v}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <span className="sr-only" aria-live="polite">
        {talking ? line : ""}
      </span>

      <svg
        ref={svg}
        viewBox={`${vbX} 0 ${W - vbX} 190`}
        className="mt-4 w-full max-w-2xl overflow-visible"
        role="img"
        aria-label="A cute robot vacuum at the end of a conveyor belt slurps up bad data like NULL and duplicates, while good values hop over it and get cleaned"
      >
        {/* belt */}
        <rect x="10" y={BELT_Y} width={VAC_X + 40} height="14" rx="7" className="fill-stone-600 dark:fill-stone-500" />
        {[30, 140, 250, 360, 470].map((x) => (
          <g key={x}>
            <circle cx={x} cy={BELT_Y + 7} r="10" className="fill-stone-400 dark:fill-stone-600" />
            <circle cx={x} cy={BELT_Y + 7} r="3.5" className="fill-stone-100 dark:fill-stone-300" />
          </g>
        ))}

        <clipPath id="robot-belt-clip">
          <rect x={Math.max(10, vbX)} y="-200" width={W + 400} height="600" />
        </clipPath>
        <g clipPath="url(#robot-belt-clip)">
          {calm
            ? FIRST_PASS.slice(0, 4).map((f, i) => {
                const w = widthOf(f.raw);
                const x = 20 + FIRST_PASS.slice(0, i).reduce((a, g) => a + widthOf(g.raw) + GAP, 0);
                return <CellView key={i} x={x} y={BELT_Y - CELL_H - 3} w={w} text={f.raw} kind={f.clean ? "raw" : "bad"} />;
              })
            : cells.current.map((c) => {
                const age = t - c.t0;
                const baseY = BELT_Y - CELL_H - 3;
                if (c.state === "belt") {
                  return <CellView key={c.id} x={c.x} y={baseY} w={c.w} text={c.text} kind={c.clean ? "raw" : "bad"} />;
                }
                if (c.state === "slurped") {
                  // pulled into the mouth: shrinks, spins, swirls in
                  const p = Math.min(age / 0.5, 1);
                  const ease = p * p;
                  const x = c.x + (MOUTH_X + 6 - (c.x + c.w / 2)) * ease;
                  const y = baseY + Math.sin(p * Math.PI) * -10 + ease * 8;
                  return <CellView key={c.id} x={x} y={y} w={c.w} text={c.text} kind="bad" rotate={p * 300} scale={1 - p} opacity={1 - p * 0.4} />;
                }
                // good cell: hops over the vacuum, gets tidied mid-air, then floats up and fades
                const hop = Math.min(age / 0.8, 1);
                const x = c.x + age * 130;
                const y = baseY - Math.sin(hop * Math.PI) * 62 - Math.max(0, age - 0.8) * 120;
                const tidy = age > 0.3;
                return (
                  <CellView
                    key={c.id}
                    x={x}
                    y={y}
                    w={tidy ? widthOf(c.clean!) : c.w}
                    text={tidy ? c.clean! : c.text}
                    kind={tidy ? "clean" : "raw"}
                    opacity={Math.max(0, 1 - Math.max(0, age - 0.8) / 0.55)}
                  />
                );
              })}
        </g>

        {/* the vacuum buddy (hover or tap: it talks) */}
        <g
          onMouseEnter={() => {
            setHover(true);
            say();
          }}
          onMouseLeave={() => {
            setHover(false);
            quiet(2500);
          }}
          onClick={() => {
            say();
            quiet(3500);
          }}
          className="cursor-pointer"
          data-cursor
          transform={`rotate(${wobble} ${VAC_X} ${BELT_Y})`}
        >
          {/* squash on each gulp, anchored on the belt */}
          <g transform={`translate(${VAC_X} ${BELT_Y}) scale(${1 + gulp * 0.08} ${1 - gulp * 0.1}) translate(${-VAC_X} ${-BELT_Y})`}>
            {/* wheels */}
            <ellipse cx={VAC_X - 30} cy={BELT_Y - 2} rx="9" ry="5" className="fill-stone-700 dark:fill-stone-400" />
            <ellipse cx={VAC_X + 30} cy={BELT_Y - 2} rx="9" ry="5" className="fill-stone-700 dark:fill-stone-400" />
            {/* side wall + bumper */}
            <path d={`M${VAC_X - 52} 116v18a52 18 0 0 0 104 0v-18z`} className="fill-coral-400 dark:fill-coral-500" />
            <path d={`M${VAC_X - 52} 128a52 18 0 0 0 104 0`} fill="none" strokeWidth="3" className="stroke-coral-600/50" />
            {/* mouth slot at the front-left, where cells go in */}
            <ellipse cx={MOUTH_X + 6} cy="132" rx="6" ry="9" className="fill-stone-800 dark:fill-stone-900" />
            {/* top shell */}
            <ellipse cx={VAC_X} cy="116" rx="52" ry="18" className="fill-stone-50 stroke-coral-500 dark:fill-stone-100" strokeWidth="2.5" />
            <ellipse cx={VAC_X - 14} cy="110" rx="18" ry="5" fill="#fff" opacity=".7" />
            {/* antenna */}
            <line x1={VAC_X + 22} y1="104" x2={VAC_X + 28} y2="90" strokeWidth="2.5" strokeLinecap="round" className="stroke-coral-600" />
            <circle cx={VAC_X + 29} cy="87" r={4 + gulp * 2} className="fill-coral-400" />
            <circle cx={VAC_X + 29} cy="87" r={8 + gulp * 6} className="fill-coral-300" opacity={0.25 + gulp * 0.4} />
            {/* face */}
            {hover ? (
              <path d={`M${VAC_X - 19} 117q6-8 12 0M${VAC_X + 7} 117q6-8 12 0`} strokeWidth="2.8" fill="none" strokeLinecap="round" className="stroke-stone-900" />
            ) : blink ? (
              <path d={`M${VAC_X - 19} 116h12M${VAC_X + 7} 116h12`} strokeWidth="2.8" strokeLinecap="round" className="stroke-stone-900" />
            ) : (
              <g>
                {[-13, 13].map((ox) => (
                  <g key={ox}>
                    <ellipse cx={VAC_X + ox + look.x * 0.4} cy={116 + look.y * 0.3} rx="7.5" ry="8.5" className="fill-stone-900" />
                    <circle cx={VAC_X + ox - 2.4 + look.x} cy={113 + look.y} r="2.8" fill="#fff" />
                    <circle cx={VAC_X + ox + 2.6 + look.x * 0.6} cy={119 + look.y * 0.6} r="1.2" fill="#fff" />
                  </g>
                ))}
              </g>
            )}
            {/* ω mouth: opens into an "o" mid-gulp */}
            {gulp > 0.3 ? (
              <ellipse cx={VAC_X} cy="126" rx="3.2" ry={2 + gulp * 2.5} className="fill-stone-900" />
            ) : (
              <path d={`M${VAC_X - 5} 125q2.5 3.5 5 0q2.5 3.5 5 0`} strokeWidth="2" fill="none" strokeLinecap="round" className="stroke-stone-900" />
            )}
            <ellipse cx={VAC_X - 27} cy="123" rx="6" ry="3.5" className="fill-coral-300" opacity=".8" />
            <ellipse cx={VAC_X + 27} cy="123" rx="6" ry="3.5" className="fill-coral-300" opacity=".8" />
          </g>
        </g>

        {/* slurp effects: swirl at the mouth while eating, then whoosh + sparkles */}
        {!calm && sinceSlurp < 0.5 && (
          <path
            d={`M${MOUTH_X - 26} 120q10 12 24 10M${MOUTH_X - 30} 136q12-4 26 0M${MOUTH_X - 24} 150q10-12 22-12`}
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="3 3"
            className="stroke-stone-400"
          />
        )}
        {!calm && sinceSlurp > 0.3 && sinceSlurp < 1.1 && (
          <g opacity={1 - Math.max(0, sinceSlurp - 0.7) / 0.4}>
            <text x={VAC_X + 34} y={BELT_Y - 70 - (sinceSlurp - 0.3) * 14} fontSize="15" className={`fill-coral-600 dark:fill-coral-300 ${fun.className}`}>
              whoosh!
            </text>
            {[
              [VAC_X + 62, 100, 1],
              [VAC_X + 78, 122, 0.7],
              [VAC_X + 54, 128, 0.55],
            ].map(([x, y, s], i) => (
              <path
                key={i}
                transform={`translate(${x} ${y - (sinceSlurp - 0.3) * 16}) scale(${s * (0.6 + (sinceSlurp - 0.3))})`}
                d="M0-7l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
                className="fill-amber-300"
              />
            ))}
          </g>
        )}

        {/* speech bubble */}
        {/* one bubble at a time; keyed by line so each new line fades in fresh */}
        {talking && line && (
            <motion.g key={said} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
              <rect x={bubbleX} y="44" width={bubbleW} height="26" rx="13" strokeWidth="2" className="fill-stone-50 stroke-coral-500 dark:fill-stone-800 dark:stroke-coral-300" />
              <path d={`M${VAC_X - 6} 69l6 9 6-9`} strokeWidth="2" className="fill-stone-50 stroke-coral-500 dark:fill-stone-800 dark:stroke-coral-300" />
              <rect x={VAC_X - 7} y="66" width="14" height="3" className="fill-stone-50 dark:fill-stone-800" />
              <text x={bubbleX + bubbleW / 2} y="61.5" textAnchor="middle" fontSize="13" className={`fill-stone-900 dark:fill-stone-50 ${fun.className}`}>
                {line}
              </text>
            </motion.g>
        )}
      </svg>
      <p className="mt-1 font-mono text-[11px] text-stone-500">hover the little vacuum to chat · it&apos;s cleaning your data live</p>
    </div>
  );
}

function CellView({
  x,
  y,
  w,
  text,
  kind,
  rotate = 0,
  scale = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  w: number;
  text: string;
  kind: "raw" | "bad" | "clean";
  rotate?: number;
  scale?: number;
  opacity?: number;
}) {
  const box =
    kind === "bad"
      ? "fill-coral-50 stroke-coral-400 dark:fill-coral-950 dark:stroke-coral-400"
      : kind === "clean"
        ? "fill-sea-100 stroke-sea-500 dark:fill-sea-900 dark:stroke-sea-400"
        : "fill-shell stroke-[#d8c3a0] dark:fill-stone-800 dark:stroke-stone-600";
  const ink = kind === "bad" ? "fill-coral-700 dark:fill-coral-300" : kind === "clean" ? "fill-sea-700 dark:fill-sea-200" : "fill-stone-700 dark:fill-stone-200";
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${CELL_H / 2}) translate(${w / 2} ${CELL_H / 2}) scale(${Math.max(scale, 0.001)}) translate(${-w / 2} ${-CELL_H / 2})`} opacity={opacity}>
      <rect width={w} height={CELL_H} rx="5" className={box} strokeWidth="1.2" />
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" style={{ fontFamily: MONO, whiteSpace: "pre" }} className={ink}>
        {text}
      </text>
    </g>
  );
}
