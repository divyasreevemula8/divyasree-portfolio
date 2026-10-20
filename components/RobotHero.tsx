"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Chewy } from "next/font/google";
import { profile } from "@/data/profile";
import { asset } from "@/lib/asset";

// The hero: a glossy little robot floats along a conveyor belt of messy cells, glides to each one
// and cleans it. Bad cells (NULL, dup, #REF!, impossible dates) get sucked in and come out as soap
// bubbles; good ones get polished and float up into a row of clean facts under the name. Its eyes
// follow the cursor. Put the cursor on it (or tap it) and it stops, the belt pauses, and it says
// the next line: hi, how are you, then something silly.
// One rAF clock drives everything; reduced motion shows a finished, still scene.

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

// scene geometry, in SVG units (viewBox 0 0 640 210)
const W = 640;
const H = 210;
const BELT_Y = 170;
const BELT_END = 600;
const CELL_H = 24;
const CELL_Y = BELT_Y - CELL_H - 3;
const HEAD_Y = 58; // robot head centre (before bob)
const BELLY_Y = 106;
const SPEED = 55; // belt speed, units per second
const GAP = 16;
const MAX_X = 570;

type Cell = { id: number; text: string; clean: string | null; x: number; w: number; state: "belt" | "sucked" | "polished"; t0: number; rx: number; burst?: boolean };
type Bubble = { id: number; x: number; y: number; r: number; vx: number; vy: number; born: number; life: number };
const widthOf = (s: string) => s.length * 7.3 + 18;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function RobotHero() {
  const calm = useReducedMotion();
  const uid = useId().replace(/[^\w-]/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const cells = useRef<Cell[]>([]);
  const bubbles = useRef<Bubble[]>([]);
  const feed = useRef(0);
  const nextId = useRef(0); // survives effect re-runs, so React keys never repeat
  const clock = useRef(0);
  // robot state
  const rx = useRef(380);
  const rv = useRef(0);
  const cleaning = useRef<{ id: number; t0: number } | null>(null);
  const beltSpeed = useRef(SPEED);
  const paused = useRef(false);
  const lastIdleBubble = useRef(0);

  const [, setFrame] = useState(0);
  const [clean, setClean] = useState<string[]>([]);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  // hover talk
  const [said, setSaid] = useState(-1);
  const [talking, setTalking] = useState(false);
  const [hover, setHover] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // phones: frame the right part of the belt so the cell text stays readable
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

  // one clock: belt, robot, bubbles
  useEffect(() => {
    if (calm) return;
    let raf = 0;
    let last = performance.now();
    const next = (): Feed => {
      const i = feed.current++;
      if (i < FIRST_PASS.length) return FIRST_PASS[i];
      return i % 3 === 0 ? FIRST_PASS.filter((f) => f.clean)[i % 4] : { raw: JUNK[i % JUNK.length], clean: null };
    };
    const addCell = (x: number) => {
      const f = next();
      const w = widthOf(f.raw);
      cells.current.push({ id: nextId.current++, text: f.raw, clean: f.clean, x: x - w, w, state: "belt", t0: 0, rx: 0 });
      return w;
    };
    // start with the belt loaded, the first cell just short of the robot
    if (!cells.current.length) {
      let right = rx.current + 30;
      for (let k = 0; k < 4; k++) right -= addCell(right) + GAP;
    }
    const puff = (x: number, y: number, n: number, t: number) => {
      for (let k = 0; k < n; k++)
        bubbles.current.push({ id: nextId.current++, x: x + rand(-8, 8), y: y + rand(-6, 6), r: rand(3.5, 9), vx: rand(-22, 22), vy: rand(-48, -24), born: t, life: rand(1.4, 2.6) });
    };
    const finish = (c: Cell, t: number) => {
      c.t0 = t;
      c.rx = rx.current;
      if (c.clean) {
        c.state = "polished";
        const v = c.clean;
        setClean((s) => (s.includes(v) ? s : [...s, v].sort((a, b) => CLEAN_ORDER.indexOf(a) - CLEAN_ORDER.indexOf(b))));
      } else {
        c.state = "sucked";
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock.current += dt;
      const t = clock.current;
      const list = cells.current;
      const minX = (vbXRef.current || 0) + 70;

      // belt eases to a stop while the robot is being hovered
      beltSpeed.current += ((paused.current ? 0 : SPEED) - beltSpeed.current) * (1 - Math.exp(-dt * 6));

      const newest = list.filter((c) => c.state === "belt").reduce<Cell | null>((a, c) => (!a || c.x < a.x ? c : a), null);
      if (!newest || newest.x > 10 + GAP) addCell(10);

      for (const c of list) {
        if (c.state !== "belt") continue;
        c.x += beltSpeed.current * dt;
        if (c.x + c.w > BELT_END) finish(c, t); // safety net: nothing piles up at the end
      }

      // robot: glide to the most urgent cell (furthest along), match its speed, clean it
      const cur = cleaning.current ? list.find((c) => c.id === cleaning.current!.id && c.state === "belt") : null;
      if (!cur) cleaning.current = null;
      let goal: number;
      if (paused.current) {
        goal = rx.current;
      } else if (cur) {
        goal = cur.x + cur.w / 2;
        if (t - cleaning.current!.t0 > 0.45) {
          finish(cur, t);
          cleaning.current = null;
        }
      } else {
        const target = list
          .filter((c) => c.state === "belt" && c.x + c.w / 2 > minX)
          .reduce<Cell | null>((a, c) => (!a || c.x > a.x ? c : a), null);
        if (target) {
          goal = target.x + target.w / 2;
          if (Math.abs(goal - rx.current) < 6) cleaning.current = { id: target.id, t0: t };
        } else {
          goal = rx.current + Math.sin(t * 0.7) * 4; // idle drift
          if (t - lastIdleBubble.current > 2.4) {
            lastIdleBubble.current = t;
            puff(rx.current, BELLY_Y - 10, 1, t);
          }
        }
      }
      goal = Math.min(Math.max(goal, minX - 40), MAX_X);
      // hovered: freeze on the spot, so it doesn't drift out from under the cursor
      const want = paused.current ? 0 : Math.max(-150, Math.min(150, (goal - rx.current) * 4 + (cur ? beltSpeed.current : 0)));
      rv.current = paused.current ? 0 : rv.current + (want - rv.current) * (1 - Math.exp(-dt * 7));
      rx.current = Math.min(Math.max(rx.current + rv.current * dt, minX - 40), MAX_X);

      // sucked cells turn into bubbles as they reach the robot
      for (const c of list) {
        if (c.state === "sucked" && t - c.t0 >= 0.45 && !c.burst) {
          c.burst = true;
          puff(c.rx, BELLY_Y, 5, t);
        }
      }
      cells.current = list.filter((c) => c.state === "belt" || t - c.t0 < 1.3);

      for (const b of bubbles.current) {
        const age = t - b.born;
        b.x += (b.vx + Math.sin(age * 4 + b.id) * 10) * dt;
        b.y += b.vy * dt;
        b.vx *= 0.98;
      }
      bubbles.current = bubbles.current.filter((b) => t - b.born < b.life && b.y > -20);

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
        const dx = e.clientX - (r.left + (rx.current - vbXRef.current) * s);
        const dy = e.clientY - (r.top + HEAD_Y * s);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 180) * 5;
        setLook({ x: (dx / d) * k, y: (dy / d) * k * 0.7 });
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
    let tm: ReturnType<typeof setTimeout>;
    const loop = () => {
      tm = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        loop();
      }, 2500 + Math.random() * 3000);
    };
    loop();
    return () => clearTimeout(tm);
  }, [calm]);

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current);
      clearTimeout(resumeTimer.current);
    },
    [],
  );

  const stopAndTalk = () => {
    clearTimeout(hideTimer.current);
    clearTimeout(resumeTimer.current);
    paused.current = true;
    setSaid((n) => n + 1);
    setTalking(true);
  };
  const letGo = (talkMs: number, resumeMs: number) => {
    clearTimeout(hideTimer.current);
    clearTimeout(resumeTimer.current);
    hideTimer.current = setTimeout(() => setTalking(false), talkMs);
    resumeTimer.current = setTimeout(() => (paused.current = false), resumeMs);
  };

  const t = clock.current;
  const x = calm ? 380 : rx.current;
  const bob = calm || hover ? 0 : Math.sin(t * 2.4) * 3; // still while chatting, so hover stays steady
  const tilt = calm || hover ? 0 : Math.max(-9, Math.min(9, rv.current * 0.07));
  const swing = calm ? 0 : Math.sin(t * 6) * Math.min(1, Math.abs(rv.current) / 60) * 14;
  const line = said >= 0 ? lineAt(said) : "";
  const bubbleW = line.length * 6.6 + 26;
  const bubbleX = Math.min(Math.max(x - bubbleW / 2, vbX + 4), W - 4 - bubbleW);
  const g = (n: string) => `${n}-${uid}`;

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

      {/* clean facts the robot has produced so far */}
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
        viewBox={`${vbX} 0 ${W - vbX} ${H}`}
        className="mt-2 w-full max-w-2xl overflow-visible"
        role="img"
        aria-label="A cute glossy robot floats along a conveyor belt, turning bad data like NULL and duplicates into soap bubbles and polishing good values into clean facts"
      >
        <defs>
          <radialGradient id={g("shell")} cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".55" stopColor="#fbf6ec" />
            <stop offset="1" stopColor="#e6d7bd" />
          </radialGradient>
          <radialGradient id={g("pink")} cx="35%" cy="30%" r="85%">
            <stop offset="0" stopColor="#fcd0c4" />
            <stop offset=".6" stopColor="#f49e8c" />
            <stop offset="1" stopColor="#d9634d" />
          </radialGradient>
          <linearGradient id={g("visor")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d3a40" />
            <stop offset="1" stopColor="#0b1a1e" />
          </linearGradient>
          <linearGradient id={g("gold")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9ad6cf" />
            <stop offset="1" stopColor="#1f7f7a" />
          </linearGradient>
          <radialGradient id={g("bubble")} cx="50%" cy="50%" r="50%">
            <stop offset=".55" stopColor="#ffffff" stopOpacity="0" />
            <stop offset=".78" stopColor="#9ad6cf" stopOpacity=".35" />
            <stop offset=".9" stopColor="#f8b5a4" stopOpacity=".55" />
            <stop offset="1" stopColor="#6fc0b8" stopOpacity=".7" />
          </radialGradient>
          <filter id={g("glow")} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={g("head")}>
            <circle cx="0" cy={HEAD_Y} r="27" />
          </clipPath>
          <clipPath id={g("belt")}>
            <rect x={Math.max(10, vbX)} y="-200" width={W + 400} height="600" />
          </clipPath>
        </defs>

        {/* belt */}
        <rect x="10" y={BELT_Y} width={BELT_END - 10} height="14" rx="7" className="fill-stone-600 dark:fill-stone-500" />
        {[30, 140, 250, 360, 470, 580].map((wx) => (
          <g key={wx}>
            <circle cx={wx} cy={BELT_Y + 7} r="10" className="fill-stone-400 dark:fill-stone-600" />
            <circle cx={wx} cy={BELT_Y + 7} r="3.5" className="fill-stone-100 dark:fill-stone-300" />
          </g>
        ))}

        {/* robot's soft shadow on the belt */}
        <ellipse cx={x} cy={BELT_Y - 1} rx={24 - bob} ry="4" className="fill-stone-900/20 dark:fill-black/40" />

        {/* cells */}
        <g clipPath={`url(#${g("belt")})`}>
          {calm
            ? FIRST_PASS.slice(0, 4).map((f, i) => {
                const w = widthOf(f.raw);
                const cx = 40 + FIRST_PASS.slice(0, i).reduce((a, h) => a + widthOf(h.raw) + GAP, 0);
                return <CellView key={i} x={cx} y={CELL_Y} w={w} text={f.raw} kind={f.clean ? "raw" : "bad"} />;
              })
            : cells.current.map((c) => {
                const age = t - c.t0;
                if (c.state === "belt") {
                  const active = cleaning.current?.id === c.id;
                  return <CellView key={c.id} x={c.x} y={CELL_Y} w={c.w} text={c.text} kind={c.clean ? "raw" : "bad"} glow={active} />;
                }
                if (c.state === "sucked") {
                  // drawn up into the robot's belly in a little swirl, then gone (bubbles take over)
                  const p = Math.min(age / 0.45, 1);
                  const e = p * p;
                  const cx = c.x + (c.rx - (c.x + c.w / 2)) * e + Math.sin(p * Math.PI * 2) * 8 * (1 - p);
                  const cy = CELL_Y + (BELLY_Y - CELL_Y) * e;
                  return <CellView key={c.id} x={cx} y={cy} w={c.w} text={c.text} kind="bad" rotate={p * 220} scale={1 - p} opacity={p >= 1 ? 0 : 1} />;
                }
                // polished: sparkles, turns clean, floats up and fades
                const tidy = age > 0.25;
                const up = Math.max(0, age - 0.35);
                return (
                  <g key={c.id}>
                    <CellView
                      x={c.x}
                      y={CELL_Y - up * 110}
                      w={tidy ? widthOf(c.clean!) : c.w}
                      text={tidy ? c.clean! : c.text}
                      kind={tidy ? "clean" : "raw"}
                      opacity={Math.max(0, 1 - up / 0.9)}
                    />
                    {age < 0.6 &&
                      [
                        [-6, -4],
                        [c.w + 4, 2],
                        [c.w / 2, -10],
                      ].map(([sx, sy], i) => (
                        <path
                          key={i}
                          transform={`translate(${c.x + sx} ${CELL_Y + sy}) scale(${0.6 + Math.sin((age / 0.6) * Math.PI) * 0.6})`}
                          d="M0-7l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
                          className="fill-amber-300"
                        />
                      ))}
                  </g>
                );
              })}
        </g>

        {/* soap bubbles */}
        {!calm &&
          bubbles.current.map((b) => {
            const age = t - b.born;
            const pop = Math.max(0, age - (b.life - 0.18)) / 0.18; // last moment: swell and vanish
            return (
              <g key={b.id} opacity={1 - pop}>
                <circle cx={b.x} cy={b.y} r={b.r * (1 + pop * 0.4)} fill={`url(#${g("bubble")})`} stroke="rgba(255,255,255,.55)" strokeWidth=".6" />
                <ellipse cx={b.x - b.r * 0.35} cy={b.y - b.r * 0.4} rx={b.r * 0.28} ry={b.r * 0.16} fill="#fff" opacity=".8" />
              </g>
            );
          })}

        {/* the robot: put the cursor on it (or tap) and it stops to chat */}
        <g
          transform={`translate(${x} ${bob}) rotate(${tilt} 0 ${BELLY_Y})`}
          onMouseEnter={() => {
            setHover(true);
            stopAndTalk();
          }}
          onMouseLeave={() => {
            setHover(false);
            letGo(2500, 800);
          }}
          onClick={() => {
            stopAndTalk();
            letGo(3500, 2200);
          }}
          className="cursor-pointer"
          data-cursor
        >
          {/* hit area so hover is easy to land */}
          <rect x="-36" y="26" width="72" height="112" fill="transparent" />
          {/* arms */}
          <g transform={`rotate(${12 + swing} -22 92)`}>
            <ellipse cx="-27" cy="104" rx="7.5" ry="14" fill={`url(#${g("pink")})`} />
          </g>
          <g transform={`rotate(${-12 - swing} 22 92)`}>
            <ellipse cx="27" cy="104" rx="7.5" ry="14" fill={`url(#${g("pink")})`} />
          </g>
          {/* body */}
          <ellipse cx="0" cy={BELLY_Y} rx="22" ry="25" fill={`url(#${g("shell")})`} />
          <path d="M-17 121a22 25 0 0 0 34 0q-17 8-34 0z" fill={`url(#${g("pink")})`} />
          <circle cx="0" cy={BELLY_Y - 2} r="8.5" fill={`url(#${g("pink")})`} />
          <ellipse cx="-2.5" cy={BELLY_Y - 5} rx="3" ry="2" fill="#fff" opacity=".7" />
          <ellipse cx="-9" cy={BELLY_Y - 12} rx="5" ry="8" fill="#fff" opacity=".55" />
          {/* neck */}
          <ellipse cx="0" cy="84" rx="12" ry="4" fill="#e6d7bd" />
          {/* ears */}
          {[-27, 27].map((ex) => (
            <g key={ex}>
              <circle cx={ex} cy={HEAD_Y + 2} r="8.5" fill={`url(#${g("gold")})`} />
              <circle cx={ex} cy={HEAD_Y + 2} r="6" fill={`url(#${g("shell")})`} />
              <circle cx={ex} cy={HEAD_Y + 2} r="2.6" fill={`url(#${g("gold")})`} />
            </g>
          ))}
          {/* head with pink cap */}
          <circle cx="0" cy={HEAD_Y} r="27" fill={`url(#${g("shell")})`} />
          <g clipPath={`url(#${g("head")})`}>
            <ellipse cx="0" cy={HEAD_Y - 30} rx="30" ry="14" fill={`url(#${g("pink")})`} />
          </g>
          {/* visor */}
          <rect x="-21" y={HEAD_Y - 13} width="42" height="29" rx="14.5" fill={`url(#${g("visor")})`} stroke={`url(#${g("gold")})`} strokeWidth="1.6" />
          {/* eyes: glowing blue, follow the cursor; happy arcs while chatting */}
          <g filter={`url(#${g("glow")})`}>
            {hover || talking ? (
              // cursor on it: happy ^ ^ eyes and a big glowing smile
              <g transform={`translate(${look.x * 0.5} ${look.y * 0.4})`} stroke="#8ff0e4" strokeWidth="2.6" fill="none" strokeLinecap="round">
                <path d={`M-12 ${HEAD_Y}q4.5-7 9 0M3 ${HEAD_Y}q4.5-7 9 0`} />
                <path d={`M-7 ${HEAD_Y + 6}q7 7 14 0`} />
              </g>
            ) : (
              [-7.5, 7.5].map((ox) => (
                <g key={ox} transform={`translate(${ox + look.x} ${HEAD_Y + 1 + look.y})`}>
                  <ellipse rx="4.4" ry={blink ? 0.8 : 6.4} fill="#3fd1c2" />
                  {!blink && <ellipse rx="2.4" ry="4" fill="#bff7ef" opacity=".85" />}
                </g>
              ))
            )}
          </g>
          {(hover || talking) && (
            <g fill="#f49e8c" opacity=".55">
              <ellipse cx="-17" cy={HEAD_Y + 18} rx="5" ry="2.6" />
              <ellipse cx="17" cy={HEAD_Y + 18} rx="5" ry="2.6" />
            </g>
          )}
          {/* glossy reflections */}
          <path d={`M-15 ${HEAD_Y - 8}q8-5 18-4`} stroke="#fff" strokeOpacity=".35" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="-12" cy={HEAD_Y - 18} rx="7" ry="4" fill="#fff" opacity=".7" />
        </g>

        {/* speech bubble */}
        {talking && line && (
          <motion.g key={said} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <rect x={bubbleX} y="0" width={bubbleW} height="24" rx="12" strokeWidth="2" className="fill-stone-50 stroke-coral-400 dark:fill-stone-800 dark:stroke-coral-300" />
            <text x={bubbleX + bubbleW / 2} y="16.5" textAnchor="middle" fontSize="13" className={`fill-stone-900 dark:fill-stone-50 ${fun.className}`}>
              {line}
            </text>
          </motion.g>
        )}
      </svg>
      <p className="mt-1 font-mono text-[11px] text-stone-500">put your cursor on the robot to say hi · it&apos;s cleaning your data live</p>
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
  glow = false,
}: {
  x: number;
  y: number;
  w: number;
  text: string;
  kind: "raw" | "bad" | "clean";
  rotate?: number;
  scale?: number;
  opacity?: number;
  glow?: boolean;
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
      {/* the cell the robot is working on gets a soft teal scan glow */}
      {glow && <rect x="-3" y="-3" width={w + 6} height={CELL_H + 6} rx="7" fill="#3fd1c2" opacity=".3" />}
      <rect width={w} height={CELL_H} rx="5" className={box} strokeWidth="1.2" />
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" style={{ fontFamily: MONO, whiteSpace: "pre" }} className={ink}>
        {text}
      </text>
    </g>
  );
}
