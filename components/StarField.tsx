"use client";

import { useEffect, useRef, useState } from "react";

// Night sky behind the page, only in dark mode, aiming for a real-sky look rather than sparkles:
// lots of tiny stars in true star colours (blue-white, white, pale gold, the odd orange giant) with
// a gentle scintillation, a Milky Way band, slow parallax on scroll, and shooting stars every few
// seconds (sometimes a little burst). Reduced motion = still stars, no meteors.

type Star = { x: number; y: number; r: number; a: number; phase: number; speed: number; depth: number; rgb: string };
type Meteor = { x: number; y: number; vx: number; vy: number; len: number; t: number; dur: number };

const PARALLAX = 0.12; // stars move at ~12% of scroll speed (nearer ones a bit more)

// rough star temperatures, weighted toward white
const COLOURS = ["255,255,255", "255,255,255", "232,238,255", "214,226,255", "255,246,228", "255,226,190"];

function makeStars(w: number, h: number): Star[] {
  const count = Math.round(Math.min(420, (w * h) / 4200));
  return Array.from({ length: count }, () => {
    const m = Math.pow(Math.random(), 3); // most stars faint, a handful bright
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.35 + m * 1.15,
      a: 0.25 + m * 0.7,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 2.2,
      depth: Math.random(),
      rgb: COLOURS[Math.floor(Math.random() * COLOURS.length)],
    };
  });
}

// The Milky Way, drawn once to an offscreen canvas: a diagonal band of coloured nebula glow
// (cool ocean blues), a brighter core, thousands of dust stars bunched toward the
// centre line, and a dark dust lane splitting the band. Alphas stay low so text reads on top.
function makeMilkyWay(w: number, h: number, dpr: number) {
  const c = document.createElement("canvas");
  c.width = w * dpr;
  c.height = h * dpr;
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  g.translate(w / 2, h / 2);
  g.rotate(-0.5);
  const len = Math.hypot(w, h);
  const band = Math.max(w, h) * 0.2;
  const glow = (x: number, y: number, r: number, rgb: string, a: number) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${rgb},${a})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const hues = ["150,180,215", "170,195,225", "190,205,225", "215,215,225"]; // cool blues / blue-white
  for (let i = 0; i < 46; i++) {
    const x = (Math.random() - 0.5) * len;
    const y = (Math.random() - 0.5) * band * 0.7;
    glow(x, y, band * (0.25 + Math.random() * 0.45), hues[i % hues.length], 0.045);
  }
  glow(len * 0.12, 0, band * 0.9, "255,236,210", 0.06); // warm galactic core
  for (let i = 0; i < 2200; i++) {
    const x = (Math.random() - 0.5) * len;
    const y = (Math.random() + Math.random() + Math.random() - 1.5) * band * 0.5; // bunched toward the centre line
    const a = 0.08 + Math.random() * 0.3;
    g.fillStyle = Math.random() < 0.15 ? `rgba(220,215,255,${a})` : `rgba(240,242,255,${a})`;
    const r = Math.random() < 0.06 ? 1.1 : 0.7;
    g.fillRect(x, y, r, r);
  }
  // dark dust lane: wobbly soft strokes that eat into the glow
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 18; i++) {
    const x = (Math.random() - 0.5) * len * 0.9;
    const y = (Math.random() - 0.5) * band * 0.12;
    glow(x, y, band * (0.12 + Math.random() * 0.12), "0,0,0", 0.35);
  }
  g.globalCompositeOperation = "source-over";
  return c;
}

export function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [dark, setDark] = useState(false);

  // follow the .dark class on <html> (set by next-themes)
  useEffect(() => {
    const html = document.documentElement;
    const read = () => setDark(html.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!dark) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let milky: HTMLCanvasElement | null = null;
    let raf = 0;
    let meteors: Meteor[] = [];
    let nextMeteor = performance.now() + 1500 + Math.random() * 1500;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(w, h);
      milky = makeMilkyWay(w, h, dpr);
    };

    const spawnMeteor = (now: number) => {
      // falling down-and-across, either direction, starting anywhere in the upper 60% of the screen
      const dir = Math.random() < 0.5 ? -1 : 1;
      const angle = (0.3 + Math.random() * 0.5) * Math.PI * 0.5;
      const speed = 0.45 + Math.random() * 0.35; // px per ms
      meteors.push({
        x: w * (0.1 + Math.random() * 0.8),
        y: h * Math.random() * 0.6,
        vx: Math.cos(angle) * speed * dir,
        vy: Math.sin(angle) * speed,
        len: 120 + Math.random() * 140,
        t: now,
        dur: 900 + Math.random() * 700,
      });
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const scroll = window.scrollY;
      const t = now / 1000;

      if (milky) {
        // the band drifts with the far stars and wraps vertically
        const off = (((-scroll * PARALLAX * 0.4) % h) + h) % h;
        ctx.drawImage(milky, 0, off - h, w, h);
        ctx.drawImage(milky, 0, off, w, h);
      }

      for (const s of stars) {
        const y = (((s.y - scroll * PARALLAX * (0.4 + s.depth)) % h) + h) % h;
        // gentle scintillation: brighter stars flicker a little more, never fully off
        const flicker = still ? 1 : 1 - (0.12 + s.r * 0.12) * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        const a = s.a * flicker;
        if (s.r > 1.1) {
          const halo = ctx.createRadialGradient(s.x, y, 0, s.x, y, s.r * 4);
          halo.addColorStop(0, `rgba(${s.rgb},${a * 0.35})`);
          halo.addColorStop(1, `rgba(${s.rgb},0)`);
          ctx.fillStyle = halo;
          ctx.fillRect(s.x - s.r * 4, y - s.r * 4, s.r * 8, s.r * 8);
        }
        ctx.fillStyle = `rgba(${s.rgb},${a})`;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!still) {
        if (now > nextMeteor) {
          spawnMeteor(now);
          // now and then a little burst of 2-3, like a real shower
          if (Math.random() < 0.2) {
            const extra = 1 + Math.floor(Math.random() * 2);
            for (let k = 1; k <= extra; k++) setTimeout(() => spawnMeteor(performance.now()), k * (200 + Math.random() * 400));
          }
          nextMeteor = now + 3000 + Math.random() * 4000;
        }
        for (const m of meteors) {
          const age = now - m.t;
          const p = age / m.dur; // 0 → 1 over its life
          if (p >= 1) continue;
          const hx = m.x + m.vx * age;
          const hy = m.y + m.vy * age;
          const sp = Math.hypot(m.vx, m.vy);
          const tl = m.len * Math.min(1, p * 2.5); // trail grows in, then the whole thing fades
          const tx = hx - (m.vx / sp) * tl;
          const ty = hy - (m.vy / sp) * tl;
          const fade = Math.sin(p * Math.PI);
          // tapering trail: a wide faint stroke under a thin bright one
          for (const [width, alpha] of [[2.2, 0.35], [1, 0.95]] as const) {
            const grad = ctx.createLinearGradient(hx, hy, tx, ty);
            grad.addColorStop(0, `rgba(255,255,255,${alpha * fade})`);
            grad.addColorStop(0.35, `rgba(205,220,255,${alpha * fade * 0.4})`);
            grad.addColorStop(1, "rgba(205,220,255,0)");
            ctx.strokeStyle = grad;
            ctx.lineWidth = width;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(tx, ty);
            ctx.stroke();
          }
          const head = ctx.createRadialGradient(hx, hy, 0, hx, hy, 5);
          head.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
          head.addColorStop(1, "rgba(220,230,255,0)");
          ctx.fillStyle = head;
          ctx.fillRect(hx - 5, hy - 5, 10, 10);
        }
        meteors = meteors.filter((m) => now - m.t < m.dur);
      }
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const onScroll = () => draw(performance.now()); // still mode redraws only when parallax moves

    resize();
    window.addEventListener("resize", resize);
    if (still) {
      draw(performance.now());
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      ctx.clearRect(0, 0, w, h);
    };
  }, [dark]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none fixed inset-0 -z-30 h-full w-full ${dark ? "" : "hidden"}`} />;
}
