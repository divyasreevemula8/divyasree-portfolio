"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { aboutFacts } from "@/data/profile";
import { SectionLabel } from "./Reveal";
import { Terminal, type LogLine } from "./Terminal";

const QUERY = "divyasree=# SELECT * FROM divyasree;";
const facts = aboutFacts.filter((f) => f.value.trim());

// About me, as a query result: the query types itself, then rows land one at a time.
export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [typed, setTyped] = useState(0);
  const [rows, setRows] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    let c = 0;
    const t = setInterval(() => {
      setTyped(++c);
      if (c >= QUERY.length) {
        clearInterval(t);
        let r = 0;
        const rt = setInterval(() => {
          setRows(++r);
          if (r >= facts.length) clearInterval(rt);
        }, 260);
      }
    }, 35);
    return () => clearInterval(t);
  }, [inView]);

  const lines: LogLine[] = typed ? [{ text: QUERY.slice(0, typed), tone: "cmd" }] : [];

  return (
    <section id="about" className="pt-20 sm:pt-24">
      <SectionLabel>About</SectionLabel>
      <div ref={ref}>
        <Terminal title="psql · portfolio" lines={lines} bodyClass="min-h-[16rem]">
          {rows > 0 && (
            <div className="mt-3 text-[12.5px]">
              <div className="hidden grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 border-b border-stone-200 pb-1 text-stone-500 dark:border-white/10 sm:grid">
                <span>column</span>
                <span>value</span>
              </div>
              {facts.slice(0, rows).map((f, i) => (
                <motion.div
                  key={f.col}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  className="grid gap-x-4 rounded px-1 py-1 sm:grid-cols-[minmax(7rem,auto)_1fr] sm:py-0.5 transition-colors hover:bg-sea-50 dark:hover:bg-white/5"
                >
                  <span className="text-sea-700 dark:text-sea-300">
                    {f.col}
                    {hover === i && <span className="ml-1.5 text-[10px] text-stone-500">{f.type}</span>}
                  </span>
                  <span className="text-stone-800 dark:text-stone-100">{f.value}</span>
                </motion.div>
              ))}
              {rows >= facts.length && <p className="mt-2 text-stone-500">({facts.length} rows)</p>}
            </div>
          )}
        </Terminal>
      </div>
    </section>
  );
}
