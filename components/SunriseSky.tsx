"use client";

import { useEffect, useRef, useState } from "react";

// Light-mode counterpart to StarField, aiming for a real dawn rather than a cartoon sun:
// a pale-blue-to-apricot sky, a low sun with a wide atmospheric bloom sitting on the bottom edge
// (the horizon), and thin stratus wisps lit warm from below, drifting slowly. The sun climbs a
// little as you scroll down the page. Kept faint so text stays easy to read.
// Reduced motion = one still frame, redrawn only on scroll.

type Wisp = { img: HTMLCanvasElement; x: number; y: number; speed: number };
type Bird = { dx: number; dy: number; size: number; phase: number; flap: number };
type Flock = { x: number; y: number; vx: number; birds: Bird[]; glide: number; t: number };
type Plane = { x: number; y: number; vx: number; startX: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// A bird far away is just two curved wing strokes; `lift` (-1..1) is where the wings are in the flap.
function drawBird(g: CanvasRenderingContext2D, x: number, y: number, size: number, lift: number) {
  const tip = -lift * size * 0.45;
  g.lineWidth = Math.max(1, size * 0.13);
  g.beginPath();
  g.moveTo(x - size, y + tip);
  g.quadraticCurveTo(x - size * 0.45, y - size * 0.3 + tip * 0.3, x, y);
  g.quadraticCurveTo(x + size * 0.45, y - size * 0.3 + tip * 0.3, x + size, y + tip);
  g.stroke();
}

// A small jet seen from below and far off: fuselage, swept wings, tail; dir = 1 flying right.
function drawPlane(g: CanvasRenderingContext2D, x: number, y: number, dir: number) {
  g.save();
  g.translate(x, y);
  g.scale(dir, 1);
  g.fillStyle = "rgba(70,72,90,0.75)";
  g.beginPath();
  g.ellipse(0, 0, 7, 1.2, 0, 0, Math.PI * 2); // fuselage
  g.fill();
  g.beginPath(); // wings
  g.moveTo(1.5, 0);
  g.lineTo(-2.5, -5.5);
  g.lineTo(-3.8, -5.5);
  g.lineTo(-1.5, 0);
  g.lineTo(-3.8, 5.5);
  g.lineTo(-2.5, 5.5);
  g.closePath();
  g.fill();
  g.beginPath(); // tail
  g.moveTo(-5.5, 0);
  g.lineTo(-7.5, -2.4);
  g.lineTo(-8.2, -2.4);
  g.lineTo(-7, 0);
  g.lineTo(-8.2, 2.4);
  g.lineTo(-7.5, 2.4);
  g.closePath();
  g.fill();
  g.restore();
}

// One stratus wisp: a row of overlapping soft ellipses, white on top, warmer underneath.
function makeWisp(width: number, dpr: number): HTMLCanvasElement {
  const h = width * 0.22;
  const c = document.createElement("canvas");
  c.width = width * dpr;
  c.height = h * dpr;
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const puffs = 10 + Math.floor(Math.random() * 8);
  for (let i = 0; i < puffs; i++) {
    const cx = width * (0.08 + Math.random() * 0.84);
    const cy = h * (0.42 + (Math.random() - 0.5) * 0.25);
    const rx = width * (0.08 + Math.random() * 0.14);
    const ry = h * (0.12 + Math.random() * 0.12);
    const warm = Math.random() < 0.5;
    g.save();
    g.translate(cx, cy + (warm ? ry * 0.45 : 0));
    g.scale(rx / ry, 1);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, ry);
    // lit underside picks up the sunrise colour; tops stay near white
    grad.addColorStop(0, warm ? "rgba(255,206,170,0.42)" : "rgba(255,255,255,0.5)");
    grad.addColorStop(1, warm ? "rgba(255,206,170,0)" : "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, ry, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  return c;
}

export function SunriseSky() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [light, setLight] = useState(false);

  // follow the .dark class on <html> (set by next-themes)
  useEffect(() => {
    const html = document.documentElement;
    const read = () => setLight(!html.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!light) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let wisps: Wisp[] = [];
    let raf = 0;
    let last = performance.now();
    const born = performance.now();
    let flocks: Flock[] = [];
    let nextFlock = born + 3000;
    let plane: Plane | null = null;
    let nextPlane = born + 8000;

    const spawnFlock = (now: number) => {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const near = Math.random() < 0.25; // now and then a single closer bird instead of a distant flock
      const n = near ? 1 : 3 + Math.floor(Math.random() * 7);
      const size = near ? rand(13, 18) : rand(5, 9);
      const birds: Bird[] = Array.from({ length: n }, (_, i) => {
        // loose V: alternate sides, each a step back and out from the leader
        const rank = Math.ceil(i / 2);
        const side = i % 2 ? 1 : -1;
        return {
          dx: -dir * rank * size * rand(2.2, 3),
          dy: side * rank * size * rand(1.1, 1.6),
          size: size * rand(0.85, 1.1),
          phase: Math.random() * Math.PI * 2,
          flap: rand(7, 10),
        };
      });
      flocks.push({ x: dir > 0 ? -60 : w + 60, y: h * rand(0.1, 0.45), vx: dir * (near ? rand(60, 80) : rand(28, 45)), birds, glide: 0, t: now });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 640 ? 4 : 6;
      wisps = Array.from({ length: n }, (_, i) => {
        const ww = Math.min(w * 0.75, 260 + Math.random() * 260);
        return {
          img: makeWisp(ww, dpr),
          x: Math.random() * (w + ww) - ww,
          y: h * (0.22 + (i / n) * 0.62) + (Math.random() - 0.5) * 30,
          speed: 2 + Math.random() * 5, // px per second: barely moving, like real high cloud
        };
      });
    };

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const doc = document.documentElement.scrollHeight - h;
      const progress = doc > 0 ? Math.min(window.scrollY / doc, 1) : 0;
      // ease the first rise on load over ~4 s
      const rise = still ? 1 : 1 - Math.pow(1 - Math.min((now - born) / 4000, 1), 3);

      ctx.clearRect(0, 0, w, h);

      // sky: cool pale blue up top, clear in the middle, apricot toward the horizon
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "rgba(198,221,240,0.38)");
      sky.addColorStop(0.45, "rgba(250,240,228,0)");
      sky.addColorStop(0.8, `rgba(252,214,178,${0.18 + 0.12 * rise})`);
      sky.addColorStop(1, `rgba(249,180,140,${0.3 + 0.15 * rise})`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // the sun, low on the bottom edge, climbing a little with scroll
      const R = Math.max(28, Math.min(w, h) * 0.055);
      const sx = w * 0.78;
      const sy = h + R * 1.6 - rise * R * 1.9 - progress * h * 0.28;
      const bloom = ctx.createRadialGradient(sx, sy, R * 0.5, sx, sy, R * 16);
      bloom.addColorStop(0, `rgba(255,222,160,${0.5 * rise})`);
      bloom.addColorStop(0.25, `rgba(255,196,150,${0.22 * rise})`);
      bloom.addColorStop(1, "rgba(255,196,150,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);
      // a wide flat haze band along the horizon, brightest under the sun
      const haze = ctx.createRadialGradient(sx, h, 0, sx, h, w * 0.9);
      haze.addColorStop(0, `rgba(255,214,170,${0.35 * rise})`);
      haze.addColorStop(1, "rgba(255,214,170,0)");
      ctx.save();
      ctx.translate(0, h);
      ctx.scale(1, 0.18);
      ctx.translate(0, -h);
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h * 2);
      ctx.restore();
      const disk = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      disk.addColorStop(0, "rgba(255,253,244,0.95)");
      disk.addColorStop(0.7, "rgba(255,238,200,0.9)");
      disk.addColorStop(1, "rgba(255,214,160,0.6)");
      ctx.fillStyle = disk;
      ctx.beginPath();
      ctx.arc(sx, sy, R, 0, Math.PI * 2);
      ctx.fill();

      if (!still) {
        // a jet high up, trailing a contrail that fades and spreads behind it
        if (!plane && now > nextPlane) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          const x = dir > 0 ? -20 : w + 20;
          plane = { x, y: h * rand(0.07, 0.2), vx: dir * w / rand(40, 60), startX: x };
        }
        if (plane) {
          plane.x += plane.vx * dt;
          const dir = Math.sign(plane.vx);
          const len = Math.min(Math.abs(plane.x - plane.startX), w * 0.45);
          const tail = plane.x - dir * (len + 8);
          for (const [width, alpha] of [[5, 0.12], [1.6, 0.55]] as const) {
            const trail = ctx.createLinearGradient(plane.x - dir * 8, plane.y, tail, plane.y);
            trail.addColorStop(0, `rgba(255,255,255,${alpha})`);
            trail.addColorStop(1, "rgba(255,255,255,0)");
            ctx.strokeStyle = trail;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(plane.x - dir * 8, plane.y);
            ctx.lineTo(tail, plane.y);
            ctx.stroke();
          }
          drawPlane(ctx, plane.x, plane.y, dir);
          if (Math.floor(now / 600) % 2 === 0) {
            ctx.fillStyle = "rgba(230,70,60,0.9)"; // blinking nav light
            ctx.beginPath();
            ctx.arc(plane.x - dir * 2.5, plane.y + 5.5, 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
          if (plane.x < -w * 0.5 || plane.x > w * 1.5) {
            plane = null;
            nextPlane = now + rand(35000, 60000);
          }
        }
      }

      // drifting stratus wisps
      for (const p of wisps) {
        if (!still) p.x += p.speed * dt;
        const ww = p.img.width / (canvas.width / w);
        if (p.x > w) p.x = -ww;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(p.img, p.x, p.y - progress * 40, ww, p.img.height / (canvas.width / w));
        ctx.globalAlpha = 1;
      }

      if (!still) {
        if (now > nextFlock) {
          spawnFlock(now);
          nextFlock = now + rand(10000, 20000);
        }
        ctx.strokeStyle = "rgba(60,55,70,0.55)";
        ctx.lineCap = "round";
        for (const f of flocks) {
          f.x += f.vx * dt;
          // flocks flap for a while, then glide for a beat, like real birds
          const gliding = Math.sin((now - f.t) / 1700) > 0.75;
          for (const b of f.birds) {
            if (!gliding) b.phase += b.flap * dt;
            const lift = gliding ? -0.25 : Math.sin(b.phase);
            const bob = Math.sin(now / 900 + b.dx) * b.size * 0.25;
            drawBird(ctx, f.x + b.dx, f.y + b.dy + bob - progress * 30, b.size, lift);
          }
        }
        flocks = flocks.filter((f) => f.x > -w * 0.6 && f.x < w * 1.6);
      }
    };

    let frame = 0;
    const loop = (now: number) => {
      // 30 fps is plenty for clouds this slow
      if (frame++ % 2 === 0) draw(now);
      raf = requestAnimationFrame(loop);
    };
    const onScroll = () => draw(performance.now());

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
  }, [light]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none fixed inset-0 -z-30 h-full w-full ${light ? "" : "hidden"}`} />;
}
