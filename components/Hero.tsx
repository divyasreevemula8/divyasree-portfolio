"use client";

import { motion } from "framer-motion";
import { profile } from "@/data/profile";
import { RobotHero } from "./RobotHero";

// Hero: a glossy little robot floats along a conveyor belt, bubbling away bad data and polishing good cells into clean
// facts under the name, on the page's sky (sunrise in light mode, stars in dark mode). The résumé lives in the navbar's sand bucket.
export function Hero() {
  return (
    <section id="top" className="relative pt-6 pb-14 sm:pt-10 sm:pb-16">
      <RobotHero />
      <ul className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-xs text-stone-600 sm:text-sm dark:text-stone-400">
        {profile.promises.map((p, i) => (
          <motion.li key={p} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.3 }}>
            {p} <span className="text-sea-600 dark:text-sea-300">✓</span>
            {i < profile.promises.length - 1 && <span className="ml-3 text-stone-400">·</span>}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
