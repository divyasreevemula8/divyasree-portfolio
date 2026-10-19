import { profile } from "@/data/profile";
import { DoodleIcon, type DoodleName } from "./DoodleIcon";

const links: { label: string; href: string; icon: DoodleName }[] = [
  { label: "Email", href: `mailto:${profile.email}`, icon: "mail" },
  { label: "LinkedIn", href: profile.linkedin, icon: "linkedin" },
  { label: "GitHub", href: profile.github, icon: "code" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-stone-200 py-6 dark:border-stone-800">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 font-mono text-xs text-stone-500">
        <span className="inline-flex items-baseline gap-1">
          © {new Date().getFullYear()} {profile.name} · built with too much
          {/* emoji font + a little steam, so the coffee actually reads as coffee */}
          <span className="relative ml-0.5 inline-block font-sans text-base leading-none" role="img" aria-label="coffee">
            <span aria-hidden className="steam absolute -top-2 left-[30%] h-2 w-px rounded-full bg-stone-400" />
            <span aria-hidden className="steam absolute -top-2 left-[55%] h-2 w-px rounded-full bg-stone-400 [animation-delay:-0.9s]" />
            ☕
          </span>
        </span>
        <nav className="flex gap-5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="group link-sweep inline-flex items-center gap-1.5 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
            >
              <DoodleIcon name={l.icon} size={16} />
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
