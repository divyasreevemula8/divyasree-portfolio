"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/data/profile";
import { SectionLabel } from "./Reveal";
import { DoodleIcon, type DoodleName } from "./DoodleIcon";

type Result = { kind: "ok" | "err"; text: string } | null;

const links: { label: string; href: string; icon: DoodleName }[] = [
  { label: "email", href: `mailto:${profile.email}`, icon: "mail" },
  { label: "linkedin", href: profile.linkedin, icon: "linkedin" },
  { label: "github", href: profile.github, icon: "code" },
];

const confettiColors = ["#6fc0b8", "#f49e8c", "#9ad6cf", "#fcd0c4", "#8fd8d2", "#1f7f7a"];

// Pastel confetti that bursts from the Run button.
function Confetti({ burst }: { burst: number }) {
  // random spread fixed once per burst, so re-renders (typing) don't move pieces mid-flight
  const bits = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2, d: 60 + Math.random() * 70, spin: Math.random() * 540 })),
    [burst],
  );
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {bits.map(({ a, d, spin }, i) => {
        return (
          <motion.span
            key={`${burst}-${i}`}
            className="absolute h-2 w-1.5 rounded-[2px]"
            style={{ background: confettiColors[i % confettiColors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d + 40, opacity: 0, rotate: spin }}
            transition={{ duration: 1.1, ease: [0.2, 0.8, 0.4, 1] }}
          />
        );
      })}
    </span>
  );
}

export function Contact() {
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [burst, setBurst] = useState(0);
  const [draft, setDraft] = useState<{ mailto: string; gmail: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const run = () => {
    const text = msg.trim();
    if (!text) {
      setResult({ kind: "err", text: `ERROR:  null value in column "message" violates not-null constraint\nHINT:  type something nice between the quotes 🙂` });
      input.current?.focus();
      return;
    }
    setResult({ kind: "ok", text: "INSERT 0 1\n✓ 1 row affected 🎉  opening your mail app…" });
    setBurst((b) => b + 1);
    const subject = encodeURIComponent("Hello from your portfolio 👋");
    const body = encodeURIComponent(text);
    const mailto = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(profile.email)}&su=${subject}&body=${body}`;
    setDraft({ mailto, gmail });
    // a real <a> click is handled more reliably than assigning location.href
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = mailto;
      a.click();
    }, 900);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="contact" className="pt-20 sm:pt-24">
      <SectionLabel>Contact</SectionLabel>
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Let&apos;s <span className="text-gradient font-mono">JOIN</span> forces.
      </h2>
      <p className="mt-3 max-w-md text-stone-600 dark:text-stone-400">No ORM needed. Write one query and I&apos;ll get back to you.</p>

      {/* fake SQL editor */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-[#fffdf8] dark:border-stone-800 dark:bg-[#13262e] font-mono text-[13px] shadow-[0_16px_40px_-20px_rgba(15,30,38,.35)] dark:shadow-[0_16px_40px_-20px_rgba(15,30,38,.6)]">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2 text-[11px] text-stone-500 dark:border-white/5">
          <span>query.sql: divyasree@inbox</span>
          <span className="hidden sm:inline">Enter ↵ to run</span>
        </div>
        <div className="space-y-1 px-4 py-4 leading-relaxed">
          <p>
            <span className="text-coral-700 dark:text-coral-300">INSERT INTO</span> <span className="text-sky-700 dark:text-sky-300">divyasree.inbox</span> <span className="text-stone-500 dark:text-stone-400">(message)</span>
          </p>
          <p className="flex flex-wrap items-baseline">
            <span className="text-coral-700 dark:text-coral-300">VALUES</span>
            <span className="text-stone-500 dark:text-stone-400">&nbsp;(&apos;</span>
            <input
              ref={input}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="hi! let's talk data"
              aria-label="Your message"
              maxLength={300}
              className="w-full min-w-0 max-w-full border-b border-dashed sm:w-auto sm:[field-sizing:content] sm:min-w-[12rem] border-emerald-700/40 bg-transparent text-emerald-700 caret-sea-600 outline-none placeholder:text-emerald-700/50 focus:border-emerald-700 dark:border-emerald-300/40 dark:text-emerald-300 dark:caret-sea-300 dark:placeholder:text-emerald-300/40 dark:focus:border-emerald-300"
            />
            <span className="text-stone-500 dark:text-stone-400">&apos;);</span>
          </p>
        </div>
        <div className="flex items-center gap-3 border-t border-stone-200 px-4 py-3 dark:border-white/5">
          <span className="relative">
            <motion.button
              onClick={run}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.92 }}
              data-cursor-label="run"
              className="relative rounded-lg bg-sea-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sea-700 dark:bg-sea-500 dark:text-stone-950 dark:hover:bg-sea-400"
            >
              ▶ Run
            </motion.button>
            {burst > 0 && <Confetti key={burst} burst={burst} />}
          </span>
          <AnimatePresence mode="wait">
            {result && (
              <motion.pre
                key={result.text}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`whitespace-pre-wrap text-[12px] ${result.kind === "ok" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"}`}
              >
                {result.text}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* no mail app configured (common with webmail)? offer other ways */}
      <AnimatePresence>
        {draft && result?.kind === "ok" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-stone-500"
          >
            didn&apos;t open? →
            <a href={draft.gmail} target="_blank" rel="noopener noreferrer" className="link-sweep text-accent dark:text-accent-dark">
              open in Gmail
            </a>
            ·
            <button onClick={copyEmail} className="link-sweep text-accent dark:text-accent-dark">
              {copied ? "copied ✓" : `copy ${profile.email}`}
            </button>
          </motion.p>
        )}
      </AnimatePresence>

      {/* doodle links */}
      <div className="mt-8 flex flex-wrap items-center gap-6">
        <span className="text-sm text-stone-500">or find me here →</span>
        {links.map((l, i) => (
          <a
            key={l.label}
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-1 text-stone-600 transition-colors hover:text-accent dark:text-stone-300 dark:hover:text-accent-dark"
          >
            <DoodleIcon name={l.icon} size={34} delay={i * 0.2} />
            <span className="font-mono text-[11px]">{l.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
