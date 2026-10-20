"use client";

import { useEffect } from "react";

// Animated tab icon: the little robot from the hero blinks and glances around while you're on the
// page. Switch to another tab and it smiles and waves, and the tab title asks you to come back.
// Browsers don't animate favicons on their own, so we redraw a 64×64 canvas a few times a second
// and point the page's <link rel="icon"> tags at it. The static app/icon1.svg / icon2.png stay as
// the fallback (Safari, search results, no-JS).

const AWAY_TITLE = "Come back! 👋";
const C = {
  coral: "#f49e8c",
  visor: "#172a33",
  eye: "#c4b5fd",
  light: { bg: "#fbf6ec", head: "#fffaf2", rim: "#e6d7bd" },
  dark: { bg: "#172a33", head: "#fbf6ec", rim: "" },
};

function draw(g: CanvasRenderingContext2D, now: number, dark: boolean, away: boolean, frame: number) {
  const p = dark ? C.dark : C.light;
  g.clearRect(0, 0, 64, 64);

  // background tile
  g.fillStyle = p.bg;
  g.beginPath();
  g.roundRect(0, 0, 64, 64, 16);
  g.fill();
  if (dark) {
    g.fillStyle = "#fbf6ec";
    for (const [x, y, r] of [
      [10, 11, 1.3],
      [55, 16, 1],
      [52, 55, 1.1],
    ]) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }

  const bob = away ? 0 : Math.sin(now / 320) * 1.2;
  const cx = away ? 30 : 32;
  const cy = 34 + bob;
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
  // coral cap
  g.fillStyle = C.coral;
  g.beginPath();
  g.ellipse(cx, cy - 6, r - 2, r * 0.72, 0, Math.PI, Math.PI * 2);
  g.closePath();
  g.fill();
  // visor
  g.fillStyle = C.visor;
  g.beginPath();
  g.roundRect(cx - 15, cy - 7, 30, 18, 9);
  g.fill();

  g.strokeStyle = C.eye;
  g.fillStyle = C.eye;
  g.lineCap = "round";
  if (away) {
    // happy ^ ^ eyes and a smile
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(cx - 10, cy + 3);
    g.quadraticCurveTo(cx - 6.5, cy - 2, cx - 3, cy + 3);
    g.moveTo(cx + 3, cy + 3);
    g.quadraticCurveTo(cx + 6.5, cy - 2, cx + 10, cy + 3);
    g.stroke();
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(cx - 4, cy + 6);
    g.quadraticCurveTo(cx, cy + 9, cx + 4, cy + 6);
    g.stroke();
    // waving arm (alternates each frame; background tabs only tick about once a second)
    const a = frame % 2 ? -0.5 : 0.25;
    g.save();
    g.translate(cx + 17, cy + 2);
    g.rotate(a);
    g.strokeStyle = C.coral;
    g.fillStyle = C.coral;
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
    // blink about every 3.2 s; glance left/right on a slow loop
    const blink = now % 3200 < 140;
    const phase = (now % 6000) / 6000;
    const glance = phase < 0.25 ? 0 : phase < 0.5 ? -2.5 : phase < 0.75 ? 2.5 : 0;
    for (const ox of [-6, 6]) {
      g.beginPath();
      g.ellipse(cx + ox + glance, cy + 2, 3.2, blink ? 0.6 : 4.8, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  // blush
  g.fillStyle = "rgba(244,158,140,.6)";
  for (const ox of [-15, 15]) {
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
    let timer = 0;

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
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        homeTitle = document.title;
        document.title = AWAY_TITLE;
      } else if (document.title === AWAY_TITLE) {
        document.title = homeTitle;
      }
      start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    darkMq.addEventListener("change", paint);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      darkMq.removeEventListener("change", paint);
      if (document.title === AWAY_TITLE) document.title = homeTitle;
      original.forEach(([href, type], l) => {
        l.href = href;
        l.type = type;
      });
    };
  }, []);

  return null;
}
