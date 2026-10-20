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
          {/* a little drawn cup with rising steam */}
          <span className="relative ml-0.5 inline-block align-[-2px] leading-none" role="img" aria-label="coffee">
            <span aria-hidden className="steam absolute -top-2 left-[30%] h-2 w-px rounded-full bg-stone-400" />
            <span aria-hidden className="steam absolute -top-2 left-[55%] h-2 w-px rounded-full bg-stone-400 [animation-delay:-0.9s]" />
            <svg aria-hidden viewBox="0 0 18 16" className="h-4 w-[18px] text-stone-500">
              <path d="M2.5 5.5h10.2l-.9 6.4c-.2 1.4-1.3 2.3-2.7 2.3H6.1c-1.4 0-2.5-.9-2.7-2.3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M12.6 7.2h1.3c1.2 0 1.9.9 1.6 2-.3 1-1.2 1.6-2.3 1.6h-.9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
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
