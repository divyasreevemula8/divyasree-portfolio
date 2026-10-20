"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Caveat_Brush, Chewy } from "next/font/google";
import { profile } from "@/data/profile";
import { asset } from "@/lib/asset";

// The hero: a glossy little robot floats along a conveyor belt of messy cells, glides to each one
// and cleans it. Bad cells (NULL, dup, #REF!, impossible dates) get a red ✗ stamp and are tossed into
// the bin at the end of the belt; good ones get a ✓, are polished and float up into the clean facts
// under the name. A tally keeps score. Its eyes
// follow the cursor. Put the cursor on it (or tap it) and it stops, the belt pauses, and it says
// the next line: hi, how are you, then something silly.
// One rAF clock drives everything; reduced motion shows a finished, still scene.

const fun = Chewy({ weight: "400", subsets: ["latin"], display: "swap" });
// your name, brush-written by hand like the sand titles
const brush = Caveat_Brush({ weight: "400", subsets: ["latin"], display: "swap" });
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
const MAX_X = 560;
const BIN_X = 618; // the bin sits just past the end of the belt
const TOSS = 1.15; // seconds from stamp to landing in the bin

type Cell = { id: number; text: string; clean: string | null; x: number; w: number; state: "belt" | "tossed" | "polished"; t0: number; rx: number };
const widthOf = (s: string) => s.length * 7.3 + 18;

export function RobotHero() {
  const calm = useReducedMotion();
  const uid = useId().replace(/[^\w-]/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const cells = useRef<Cell[]>([]);
  const feed = useRef(0);
  const nextId = useRef(0); // survives effect re-runs, so React keys never repeat
  const clock = useRef(0);
  // robot state
  const rx = useRef(380);
  const rv = useRef(0);
  const cleaning = useRef<{ id: number; t0: number } | null>(null);
  const beltSpeed = useRef(SPEED);
  const paused = useRef(false);

  const [, setFrame] = useState(0);
  const [clean, setClean] = useState<string[]>([]);
  const [tally, setTally] = useState({ kept: 0, tossed: 0 });
  const binHit = useRef(-10); // when the last cell landed in the bin (lid wobble)
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

  // one clock: belt and robot
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
    const finish = (c: Cell, t: number) => {
      c.t0 = t;
      c.rx = rx.current;
      if (c.clean) {
        c.state = "polished";
        setTally((k) => ({ ...k, kept: k.kept + 1 }));
        const v = c.clean;
        setClean((s) => (s.includes(v) ? s : [...s, v].sort((a, b) => CLEAN_ORDER.indexOf(a) - CLEAN_ORDER.indexOf(b))));
      } else {
        c.state = "tossed";
        setTally((k) => ({ ...k, tossed: k.tossed + 1 }));
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
        }
      }
      goal = Math.min(Math.max(goal, minX - 40), MAX_X);
      // hovered: freeze on the spot, so it doesn't drift out from under the cursor
      const want = paused.current ? 0 : Math.max(-150, Math.min(150, (goal - rx.current) * 4 + (cur ? beltSpeed.current : 0)));
      rv.current = paused.current ? 0 : rv.current + (want - rv.current) * (1 - Math.exp(-dt * 7));
      rx.current = Math.min(Math.max(rx.current + rv.current * dt, minX - 40), MAX_X);

      // a tossed cell lands in the bin after TOSS seconds: wobble the lid
      for (const c of list) if (c.state === "tossed" && t - c.t0 >= TOSS && t - c.t0 < TOSS + dt * 1.5) binHit.current = t;
      cells.current = list.filter((c) => c.state === "belt" || t - c.t0 < (c.state === "tossed" ? TOSS + 0.05 : 1.3));

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
      <h1 className={`text-5xl leading-[0.95] text-stone-900 sm:text-6xl dark:text-stone-50 ${brush.className}`}>{profile.name}</h1>
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
        aria-label="A cute glossy robot floats along a conveyor belt, stamping bad data like NULL and duplicates with an X and tossing it into a bin, and polishing good values into clean facts"
      >
        <defs>
          <radialGradient id={g("shell")} cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".55" stopColor="#fbf6ec" />
            <stop offset="1" stopColor="#e6d7bd" />
          </radialGradient>
          <radialGradient id={g("pink")} cx="35%" cy="30%" r="85%">
            <stop offset="0" stopColor="#e8dac3" />
            <stop offset=".6" stopColor="#c7a982" />
            <stop offset="1" stopColor="#94744d" />
          </radialGradient>
          <linearGradient id={g("visor")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d3a40" />
            <stop offset="1" stopColor="#0b1a1e" />
          </linearGradient>
          <linearGradient id={g("gold")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8cc3da" />
            <stop offset="1" stopColor="#2d6a85" />
          </linearGradient>
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

        {/* the bin at the end of the belt: bad data goes in here */}
        <g transform={`translate(${BIN_X} ${BELT_Y + 16}) rotate(${t - binHit.current < 0.4 ? Math.sin((t - binHit.current) * 40) * 6 : 0} 0 -30)`}>
          <path d="M-15 -30h30l-3 30h-24z" className="fill-coral-300 stroke-coral-600 dark:fill-coral-800 dark:stroke-coral-400" strokeWidth="1.5" />
          <path d="M-8 -24v18M0 -24v18M8 -24v18" className="stroke-coral-600/60 dark:stroke-coral-400/60" strokeWidth="1.2" />
          <rect x="-18" y="-34" width="36" height="5" rx="2" className="fill-coral-600 dark:fill-coral-400" />
        </g>

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
                if (c.state === "tossed") {
                  // stamped ✗ on the spot (with a little shake), then lobbed in an arc into the bin
                  const stampP = Math.min(age / 0.35, 1);
                  const fly = Math.max(0, (age - 0.4) / (TOSS - 0.4));
                  const sx = c.x + (BIN_X - c.w / 2 - c.x) * fly;
                  const sy = CELL_Y - Math.sin(fly * Math.PI) * 70 + fly * 8;
                  const shake = age < 0.4 ? Math.sin(age * 60) * 2 : 0;
                  return (
                    <g key={c.id}>
                      <CellView x={sx + shake} y={sy} w={c.w} text={c.text} kind="bad" rotate={fly * 260} scale={1 - fly * 0.65} opacity={fly >= 1 ? 0 : 1} />
                      {fly < 0.3 && (
                        <text
                          x={c.x + c.w / 2}
                          y={CELL_Y + 18}
                          textAnchor="middle"
                          fontSize={26 - stampP * 6}
                          fontWeight="700"
                          opacity={stampP * (1 - fly / 0.3)}
                          className="fill-coral-700 dark:fill-coral-300"
                          transform={`rotate(-12 ${c.x + c.w / 2} ${CELL_Y + 12})`}
                        >
                          ✗
                        </text>
                      )}
                    </g>
                  );
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
                    {age < 0.45 && (
                      <text x={c.x + c.w + 6} y={CELL_Y + 16} fontSize="16" fontWeight="700" opacity={1 - age / 0.45} className="fill-sea-600 dark:fill-sea-300">
                        ✓
                      </text>
                    )}
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
                          className="fill-coral-300"
                        />
                      ))}
                  </g>
                );
              })}
        </g>


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
          {/* eyes: big sparkly ones that follow the cursor; a tiny soft smile and rosy cheeks */}
          <g filter={`url(#${g("glow")})`}>
            {[-7.5, 7.5].map((ox) => (
              <g key={ox} transform={`translate(${ox + look.x} ${HEAD_Y + look.y})`}>
                <ellipse rx="4.6" ry={blink ? 0.8 : 6} fill="#7fc4e6" />
                {!blink && (
                  <>
                    <circle cx="-1.4" cy="-2.2" r="1.7" fill="#fff" />
                    <circle cx="1.6" cy="1.8" r="0.8" fill="#fff" opacity=".85" />
                  </>
                )}
              </g>
            ))}
            <path
              d={hover || talking ? `M-4.5 ${HEAD_Y + 9}q4.5 4 9 0` : `M-3 ${HEAD_Y + 9.5}q3 2.6 6 0`}
              stroke="#a8dcf0"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              transform={`translate(${look.x * 0.5} ${look.y * 0.4})`}
            />
          </g>
          <g fill="#e9b8a8" opacity={hover || talking ? 0.85 : 0.6}>
            <ellipse cx="-18" cy={HEAD_Y + 17} rx="4.6" ry="2.6" />
            <ellipse cx="18" cy={HEAD_Y + 17} rx="4.6" ry="2.6" />
          </g>
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
      <p className="mt-1 font-mono text-[11px] text-stone-500">
        <span className="text-sea-700 dark:text-sea-300">✓ kept {tally.kept}</span> · <span className="text-coral-700 dark:text-coral-300">✗ tossed {tally.tossed}</span> · put your cursor on the robot to say hi
      </p>
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
      {glow && <rect x="-3" y="-3" width={w + 6} height={CELL_H + 6} rx="7" fill="#7fc4e6" opacity=".3" />}
      <rect width={w} height={CELL_H} rx="5" className={box} strokeWidth="1.2" />
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" style={{ fontFamily: MONO, whiteSpace: "pre" }} className={ink}>
        {text}
      </text>
    </g>
  );
}
