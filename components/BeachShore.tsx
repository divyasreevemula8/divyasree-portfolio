"use client";

import { useEffect, useRef, useState } from "react";

// The shore under the hero: three layers of ocean waves rolling in over wet sand, plus an optional
// "play the waves" button. The sound is made live with the Web Audio API (filtered noise that swells
// and falls like surf), so there is no audio file to download. Browsers only allow sound after a
// click, so it always starts off.

// noise buffers, looped
function noise(ctx: AudioContext, brown: boolean) {
  const len = ctx.sampleRate * 6;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w * 0.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

// Two layers: a steady low rumble of distant surf, and a "wash" that swells as each wave rolls
// in, hisses as it breaks, then drains back. Waves come every 7-10 s, never quite evenly.
function makeSurf(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const rumble = noise(ctx, true);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.55;
  rumble.connect(lp).connect(rumbleGain).connect(master);

  const wash = noise(ctx, false);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.6;
  bp.frequency.value = 900;
  const washGain = ctx.createGain();
  washGain.gain.value = 0.02;
  wash.connect(bp).connect(washGain).connect(master);

  rumble.start();
  wash.start();

  // schedule waves a little ahead, forever (until the context is closed)
  let t = ctx.currentTime + 0.3;
  const schedule = () => {
    while (t < ctx.currentTime + 25) {
      const period = 7 + Math.random() * 3;
      const peak = 0.35 + Math.random() * 0.25;
      const g = washGain.gain;
      const f = bp.frequency;
      g.setValueAtTime(0.03, t);
      g.linearRampToValueAtTime(peak * 0.6, t + period * 0.35); // rolling in
      g.linearRampToValueAtTime(peak, t + period * 0.45); // the break: loudest, brightest
      g.exponentialRampToValueAtTime(0.03, t + period * 0.95); // draining back over the sand
      f.setValueAtTime(500, t);
      f.linearRampToValueAtTime(2600, t + period * 0.45);
      f.exponentialRampToValueAtTime(600, t + period * 0.95);
      t += period;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 8000);
  return { master, stop: () => window.clearInterval(timer) };
}

export function BeachShore() {
  const [on, setOn] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const stopWaves = useRef<() => void>(() => {});

  useEffect(
    () => () => {
      stopWaves.current();
      void ctx.current?.close();
    },
    [],
  );

  const toggle = async () => {
    if (!ctx.current) {
      ctx.current = new AudioContext();
      const surf = makeSurf(ctx.current);
      master.current = surf.master;
      stopWaves.current = surf.stop;
    }
    const c = ctx.current;
    if (c.state === "suspended") await c.resume();
    const g = master.current!.gain;
    g.cancelScheduledValues(c.currentTime);
    g.setTargetAtTime(on ? 0 : 0.9, c.currentTime, 0.5); // gentle fade in/out
    setOn(!on);
  };

  return (
    <div className="relative mt-10">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        className="relative z-10 mx-auto flex items-center gap-2 rounded-full border border-stone-300 bg-stone-50/80 px-3.5 py-1.5 font-mono text-xs text-stone-600 backdrop-blur transition-colors hover:border-sea-500 hover:text-sea-700 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-300 dark:hover:text-sea-300"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
          <path d="M3 7.6h3l4.2-3.4v11.6L6 12.4H3z" fill="currentColor" />
          {on ? (
            <path d="M13 7c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3M15.2 5c1.6 1.3 2.4 3 2.4 5s-.8 3.7-2.4 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d="M13.5 8l4 4m0-4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
        {on ? "pause the waves" : "play the waves"}
      </button>

      {/* shore: wet sand + three wave layers rolling at different speeds */}
      <div aria-hidden className="pointer-events-none relative left-1/2 mt-4 h-28 w-screen -translate-x-1/2 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-b from-stone-200/0 to-stone-200 dark:from-stone-900/0 dark:to-stone-900" />
        {[
          { cls: "text-sea-200/80 dark:text-sea-900/80", h: "h-24", d: "16s", rev: false },
          { cls: "text-sea-300/70 dark:text-sea-800/70", h: "h-16", d: "11s", rev: true },
          { cls: "text-sea-100/90 dark:text-sea-700/50", h: "h-10", d: "8s", rev: false },
        ].map((w, i) => (
          <svg
            key={i}
            className={`wave absolute bottom-0 w-[200%] ${w.h} ${w.cls}`}
            style={{ "--wave-d": w.d, animationDirection: w.rev ? "reverse" : "normal" } as React.CSSProperties}
            viewBox="0 0 1200 60"
            preserveAspectRatio="none"
          >
            <path fill="currentColor" d="M0 28 Q75 10 150 28 T300 28 T450 28 T600 28 T750 28 T900 28 T1050 28 T1200 28 V60 H0Z" />
            {/* foam edge */}
            <path fill="none" stroke="white" strokeOpacity=".55" strokeWidth="1.5" d="M0 28 Q75 10 150 28 T300 28 T450 28 T600 28 T750 28 T900 28 T1050 28 T1200 28" />
          </svg>
        ))}
      </div>
    </div>
  );
}
