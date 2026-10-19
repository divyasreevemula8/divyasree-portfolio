"use client";

import { useEffect, useRef } from "react";
import { trail as cfg } from "@/lib/cursorConfig";

// Full-screen canvas behind the page content. The pointer leaves soft "stamps" that fade
// exponentially; in reveal mode those stamps act as a mask over a hidden dot-grid pattern.
//
// Why stamps instead of fading pixels: repeatedly painting a translucent clear over an 8-bit canvas
// never quite reaches zero and leaves grey ghost trails. Redrawing each live stamp with an exact
// alpha avoids that and lets the loop stop entirely once everything has faded.

type Stamp = { x: number; y: number; t: number };

function makeBrush(r: number, dpr: number) {
  const size = Math.ceil(r * 2 * dpr);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(0,0,0,1)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeFill(ctx: CanvasRenderingContext2D, dark: boolean, dpr: number): CanvasPattern | string {
  if (cfg.mode === "ink") return dark ? cfg.ink.dark : cfg.ink.light;

  // One tile of the hidden "artwork": a dot, plus a small cross every few cells for texture.
  const cell = cfg.cell * dpr;
  const tile = document.createElement("canvas");
  tile.width = tile.height = cell * 4;
  const g = tile.getContext("2d")!;
  const a = dark ? cfg.patternAlpha.dark : cfg.patternAlpha.light;
  g.fillStyle = g.strokeStyle = dark ? `rgba(143,216,210,${a})` : `rgba(31,127,122,${a})`;
  g.lineWidth = dpr;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const cx = i * cell + cell / 2;
      const cy = j * cell + cell / 2;
      if (i === 1 && j === 2) {
        const s = cfg.dot * 2.5 * dpr;
        g.beginPath();
        g.moveTo(cx - s, cy); g.lineTo(cx + s, cy);
        g.moveTo(cx, cy - s); g.lineTo(cx, cy + s);
        g.stroke();
      } else {
        g.beginPath();
        g.arc(cx, cy, cfg.dot * dpr, 0, Math.PI * 2);
        g.fill();
      }
    }
  const p = ctx.createPattern(tile, "repeat")!;
  p.setTransform(new DOMMatrix().scaleSelf(1 / dpr)); // tile was drawn at device pixels; keep it crisp
  return p;
}

export function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const r = cfg.brushSize;
    const k = Math.LN2 / cfg.halfLife;
    let dpr = 1, w = 0, h = 0;
    let brush: HTMLCanvasElement;
    let fill: CanvasPattern | string;
    let stamps: Stamp[] = [];
    let last: { x: number; y: number } | null = null;
    let raf = 0;

    const isDark = () => document.documentElement.classList.contains("dark");

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      brush = makeBrush(r, dpr);
      fill = makeFill(ctx, isDark(), dpr);
      start();
    };

    const tick = (now: number) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);

      // draw live stamps (oldest first), dropping the ones that have faded out
      let alive = 0;
      for (const s of stamps) {
        const a = cfg.brushOpacity * Math.exp(-k * (now - s.t));
        if (a < 0.004) continue;
        stamps[alive++] = s;
        ctx.globalAlpha = a;
        ctx.drawImage(brush, s.x - r, s.y - r, r * 2, r * 2);
      }
      stamps.length = alive;
      ctx.globalAlpha = 1;

      // keep only the pattern/colour where the mask is painted
      if (alive) {
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, w, h);
      }
      raf = alive ? requestAnimationFrame(tick) : 0; // idle = zero cost
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const now = performance.now();
      const { clientX: x, clientY: y } = e;
      if (!last) {
        stamps.push({ x, y, t: now });
        last = { x, y };
      } else {
        const dx = x - last.x, dy = y - last.y;
        const d = Math.hypot(dx, dy);
        if (d < cfg.spacing) return; // wait until we've moved far enough for the next stamp
        const n = Math.floor(d / cfg.spacing);
        for (let i = 1; i <= n; i++) stamps.push({ x: last.x + (dx * i) / n, y: last.y + (dy * i) / n, t: now });
        last = { x, y };
      }
      if (stamps.length > cfg.maxStamps) stamps = stamps.slice(-cfg.maxStamps);
      start();
    };
    const onLeave = () => (last = null);

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setup, 120);
    };

    // rebuild the pattern colours when the light/dark class flips
    const themeObs = new MutationObserver(() => {
      fill = makeFill(ctx, isDark(), dpr);
      start();
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    setup();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      themeObs.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // -z-20 puts it behind content (cards with solid backgrounds hide it); pointer-events-none keeps everything clickable
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-20 h-full w-full" />;
}
