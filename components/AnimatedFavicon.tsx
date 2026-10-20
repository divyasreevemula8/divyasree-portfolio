"use client";

import { useEffect } from "react";

// Animated tab icon: the little robot from the hero blinks and glances around while you're on the
// page, and now and then the tab title cracks a beach joke. Switch to another tab and it smiles and
// waves, and the title says something to bring you back.
// Browsers don't animate favicons on their own, so we redraw a 64×64 canvas a few times a second
// and point the page's <link rel="icon"> tags at it. The static app/icon1.svg / icon2.png stay as
// the fallback (Safari, search results, no-JS).

// While you're on the page, the tab title now and then cracks a joke about the work for a few seconds.
const QUIPS = [
  "Her pipelines don't break. Mostly.",
  "Cut batch runs by 25%. Kept the coffee",
  "0 pipeline failures. The robot is proud",
  "5 GenAI agents, 0 of them sleep",
  "SELECT * FROM good_ideas",
  "Turns messy data into tidy tables",
  "Fluent in SQL, SSIS and sarcasm",
  "Removed 60% of the boring work",
  "4+ years of saying 'it's the data'",
  "Will dedupe your donors for snacks",
];
// Leave the tab and the robot waves, with one of these to bring you back.
const AWAY = ["Come back! The tide misses you", "Sea you soon?", "Don't leave me on the shore", "Psst… your data's drying out", "I tidied 3 NULLs while you were gone"];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

const C = {
  cap: "#c7a982",
  eye: "#7fc4e6",
  smile: "#a8dcf0",
  blush: "rgba(233,184,168,.85)",
  light: { bg: "#f4ece0", head: "#fffaf2", rim: "#e0d3bc", visor: "#16252e" },
  dark: { bg: "#16252e", head: "#fffaf2", rim: "", visor: "#0f1c24" },
};

function draw(g: CanvasRenderingContext2D, now: number, dark: boolean, away: boolean, frame: number) {
  const p = dark ? C.dark : C.light;
  g.clearRect(0, 0, 64, 64);

  g.fillStyle = p.bg;
  g.beginPath();
  g.roundRect(0, 0, 64, 64, 16);
  g.fill();
  if (dark) {
    g.fillStyle = "#f4ece0";
    for (const [x, y, r] of [
      [10, 11, 1.3],
      [55, 14, 1],
      [52, 56, 1.1],
    ]) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }

  const bob = away ? 0 : Math.sin(now / 320) * 1.2;
  const cx = away ? 30 : 32;
  const cy = 35 + bob;
  const r = away ? 20 : 22;

  // head
  g.fillStyle = p.head;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  if (p.rim) {
    g.strokeStyle = p.rim;
    g.lineWidth = 1.5;
    g.stroke();
  }
  // sandy cap
  g.fillStyle = C.cap;
  g.beginPath();
  g.ellipse(cx, cy - 6, r - 2, r * 0.72, 0, Math.PI, Math.PI * 2);
  g.closePath();
  g.fill();
  // visor
  g.fillStyle = p.visor;
  g.beginPath();
  g.roundRect(cx - 15, cy - 7, 30, 19, 9.5);
  g.fill();

  g.lineCap = "round";
  if (away) {
    // happy closed eyes, a smile, and a waving arm (alternates each tick)
    g.strokeStyle = C.smile;
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(cx - 10, cy + 3);
    g.quadraticCurveTo(cx - 6.5, cy - 2, cx - 3, cy + 3);
    g.moveTo(cx + 3, cy + 3);
    g.quadraticCurveTo(cx + 6.5, cy - 2, cx + 10, cy + 3);
    g.stroke();
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(cx - 3.5, cy + 7);
    g.quadraticCurveTo(cx, cy + 9.5, cx + 3.5, cy + 7);
    g.stroke();
    const a = frame % 2 ? -0.5 : 0.25;
    g.save();
    g.translate(cx + 17, cy + 2);
    g.rotate(a);
    g.strokeStyle = C.cap;
    g.fillStyle = C.cap;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(7, -14);
    g.stroke();
    g.beginPath();
    g.arc(8, -16, 4, 0, Math.PI * 2);
    g.fill();
    g.restore();
  } else {
    // sparkly eyes that blink every ~3 s and glance around, and a tiny smile
    const blink = now % 3200 < 140;
    const phase = (now % 6000) / 6000;
    const glance = phase < 0.25 ? 0 : phase < 0.5 ? -2.5 : phase < 0.75 ? 2.5 : 0;
    for (const ox of [-6, 6]) {
      g.fillStyle = C.eye;
      g.beginPath();
      g.ellipse(cx + ox + glance, cy + 2, 3.4, blink ? 0.6 : 4.6, 0, 0, Math.PI * 2);
      g.fill();
      if (!blink) {
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(cx + ox + glance - 1, cy + 0.4, 1.2, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.strokeStyle = C.smile;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(cx - 2.5, cy + 8);
    g.quadraticCurveTo(cx, cy + 10, cx + 2.5, cy + 8);
    g.stroke();
  }
  // rosy cheeks
  g.fillStyle = C.blush;
  for (const ox of [-16, 16]) {
    g.beginPath();
    g.ellipse(cx + ox, cy + 11, 3.5, 2, 0, 0, Math.PI * 2);
    g.fill();
  }
}

export function AnimatedFavicon() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const g = canvas.getContext("2d");
    if (!g || typeof g.roundRect !== "function") return; // very old browser: keep the static icon

    // Next can add icon tags after hydration, so look them up on every frame and remember each
    // tag's own static href/type the first time we touch it (restored on unmount).
    const icons = () => Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'));
    const original = new Map<HTMLLinkElement, [string, string]>();
    const darkMq = window.matchMedia("(prefers-color-scheme: dark)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let homeTitle = document.title;
    let shown = "";
    let timer = 0;
    let quipTimer = 0;
    let quipBack = 0;

    const paint = () => {
      const away = document.visibilityState === "hidden";
      draw(g, performance.now(), darkMq.matches, away, frame++);
      const url = canvas.toDataURL("image/png");
      for (const l of icons()) {
        if (!original.has(l)) original.set(l, [l.href, l.type]);
        l.type = "image/png";
        l.href = url;
      }
    };
    const start = () => {
      window.clearInterval(timer);
      paint();
      if (!still) timer = window.setInterval(paint, document.visibilityState === "hidden" ? 600 : 125);
    };
    // swap the tab title for a moment, remembering the real one
    const setTitle = (t: string) => {
      if (!shown) homeTitle = document.title;
      shown = t;
      document.title = t;
    };
    const restoreTitle = () => {
      if (shown && document.title === shown) document.title = homeTitle;
      shown = "";
    };
    // first joke ~15 s in, then every ~30-45 s: shown for 5 s, never the same one twice in a row
    let lastQuip = "";
    const scheduleQuip = (delay = 30000 + Math.random() * 15000) => {
      window.clearTimeout(quipTimer);
      quipTimer = window.setTimeout(
        () => {
          if (document.visibilityState === "visible") {
            let q = pick(QUIPS);
            while (q === lastQuip) q = pick(QUIPS);
            lastQuip = q;
            setTitle(q);
            quipBack = window.setTimeout(restoreTitle, 5000);
          }
          scheduleQuip();
        },
        delay,
      );
    };
    const onVisibility = () => {
      window.clearTimeout(quipBack);
      if (document.visibilityState === "hidden") setTitle(pick(AWAY));
      else restoreTitle();
      start();
    };

    start();
    scheduleQuip(15000);
    document.addEventListener("visibilitychange", onVisibility);
    darkMq.addEventListener("change", paint);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(quipTimer);
      window.clearTimeout(quipBack);
      document.removeEventListener("visibilitychange", onVisibility);
      darkMq.removeEventListener("change", paint);
      restoreTitle();
      original.forEach(([href, type], l) => {
        l.href = href;
        l.type = type;
      });
    };
  }, []);

  return null;
}
