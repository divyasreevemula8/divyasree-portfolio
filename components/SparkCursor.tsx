"use client";

import { useEffect, useRef } from "react";
import { sparks as cfg } from "@/lib/cursorConfig";

// Spark-trail cursor: little four-point stars shed from the pointer, drift, fall and fade.
// Click for a burst; hovering links/buttons makes the trail denser.
// A fixed canvas on top of everything with pointer-events: none, so nothing underneath is blocked.

type Spark = { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; rot: number; vr: number; color: string };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function star(ctx: CanvasRenderingContext2D, s: number) {
  // four-point sparkle made of concave curves
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(0, 0, s, 0);
  ctx.quadraticCurveTo(0, 0, 0, s);
  ctx.quadraticCurveTo(0, 0, -s, 0);
  ctx.quadraticCurveTo(0, 0, 0, -s);
  ctx.fill();
}

export function SparkCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1, w = 0, h = 0, raf = 0, prev = 0;
    let parts: Spark[] = [];
    let last: { x: number; y: number } | null = null;
    let hot = false;
    let dark = document.documentElement.classList.contains("dark");

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (x: number, y: number, vx: number, vy: number, sizeMul = 1) => {
      const palette = dark ? cfg.colors.dark : cfg.colors.light;
      parts.push({
        x, y, vx, vy,
        born: performance.now(),
        life: rand(cfg.life[0], cfg.life[1]),
        size: rand(cfg.size[0], cfg.size[1]) * sizeMul,
        rot: rand(0, Math.PI),
        vr: rand(-0.08, 0.08),
        color: palette[(Math.random() * palette.length) | 0],
      });
      if (parts.length > cfg.max) parts.splice(0, parts.length - cfg.max);
    };

    const tick = (now: number) => {
      const step = Math.min((now - (prev || now)) / 16.67, 3) || 1; // frame-rate independent physics
      prev = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over"; // glow on dark, crisp on light

      let alive = 0;
      for (const p of parts) {
        const t = (now - p.born) / p.life;
        if (t >= 1) continue;
        parts[alive++] = p;
        p.vy += cfg.gravity * step;
        p.vx *= 0.98 ** step;
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.rot += p.vr * step;
        const s = p.size * (1 - t * 0.6); // shrink as it ages
        ctx.globalAlpha = (1 - t) ** 1.5;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        star(ctx, s * 1.6);
        ctx.restore();
      }
      parts.length = alive;
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(tick);
      else { raf = 0; prev = 0; } // sleep when there's nothing to draw
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const { clientX: x, clientY: y } = e;
      hot = !!(e.target as Element | null)?.closest?.("a, button, [role=button], [data-cursor]");
      if (!last) { last = { x, y }; return; }
      const dx = x - last.x, dy = y - last.y;
      const d = Math.hypot(dx, dy);
      const spacing = cfg.spacing / (hot ? cfg.hoverBoost : 1);
      if (d < spacing) return;
      const n = Math.min(Math.floor(d / spacing), 6);
      for (let i = 1; i <= n; i++) {
        spawn(
          last.x + (dx * i) / n,
          last.y + (dy * i) / n,
          dx * 0.02 * cfg.drag + rand(-cfg.speed, cfg.speed),
          dy * 0.02 * cfg.drag + rand(-cfg.speed, cfg.speed) - 0.4,
        );
      }
      last = { x, y };
      start();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      for (let i = 0; i < cfg.burst; i++) {
        const a = (i / cfg.burst) * Math.PI * 2 + rand(-0.2, 0.2);
        const v = rand(1.5, 3.8);
        spawn(e.clientX, e.clientY, Math.cos(a) * v, Math.sin(a) * v - 0.6, 1.2);
      }
      start();
    };
    const onLeave = () => (last = null);

    const themeObs = new MutationObserver(() => (dark = document.documentElement.classList.contains("dark")));
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    setup();
    window.addEventListener("resize", setup);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      themeObs.disconnect();
      window.removeEventListener("resize", setup);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[100] h-full w-full" />;
}
