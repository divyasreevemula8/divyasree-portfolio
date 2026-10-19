"use client";

import { useRef } from "react";
import { motion, useSpring } from "framer-motion";

// Pulls its child a little toward the cursor while hovered, then springs back.
// strength 0.3 = moves 30% of the distance from the element's centre to the pointer.
export function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const spring = { stiffness: 260, damping: 18, mass: 0.4 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className="inline-block"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
