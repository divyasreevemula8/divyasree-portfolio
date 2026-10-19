import { useId } from "react";
import { skills, type Skill } from "@/data/skills";

// A few tool names used in experience data differ from the skills list.
const alias: Record<string, string> = { Cognos: "IBM Cognos", "T-SQL": "SQL Server", SQL: "SQL Server" };
export const findSkill = (name: string): Skill | undefined => skills.find((s) => s.name === (alias[name] ?? name));

// Very dark brand colours vanish on a dark background, so dark mode swaps them for a light tone.
export const isDarkHex = (hex: string) => {
  const n = parseInt(hex, 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 70;
};

/** Logo (Simple Icons path) or monogram tile. `brand` = always coloured; otherwise coloured on parent `.group` hover. */
export function SkillIcon({ s, size = 28, brand = false }: { s: Skill; size?: number; brand?: boolean }) {
  // gradient/mask ids inside full-colour logos must be unique per copy on the page
  const uid = useId().replace(/[^\w-]/g, "");
  if (s.art) {
    const body = s.art.body.replace(/(id="|url\(#|href="#)(SVG\w+)/g, `$1$2${uid}`);
    return (
      <svg
        viewBox={s.art.viewBox}
        width={size}
        height={size}
        aria-hidden
        className={brand ? "" : "opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 dark:opacity-100 dark:grayscale-0"}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }
  if (s.icon) {
    return (
      <svg
        viewBox={s.icon.viewBox ?? "0 0 24 24"}
        width={size}
        height={size}
        aria-hidden
        className={brand ? "fill-[var(--brand)]" : "fill-stone-400 transition-colors duration-300 group-hover:fill-[var(--brand)] dark:fill-[var(--brand)]"}
      >
        <path d={s.icon.path} fillRule={s.icon.evenodd ? "evenodd" : undefined} />
      </svg>
    );
  }
  return (
    <span
      style={{ height: size, minWidth: size, fontSize: Math.max(8, size * 0.36) }}
      className={`grid place-items-center rounded-md border px-1 font-mono font-semibold leading-none ${
        brand
          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
          : "border-stone-300 text-stone-500 transition-colors duration-300 group-hover:border-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white dark:border-stone-700"
      }`}
    >
      {s.mono!.text}
    </span>
  );
}

/** Sets the --brand CSS variable (with the dark-mode fallback) for SkillIcon children. */
export function brandVars(s: Skill) {
  const hex = (s.icon ?? s.art ?? s.mono)!.hex;
  // An inline --brand would beat the dark-mode class, so dark brands set it through classes only.
  if (isDarkHex(hex)) {
    return {
      style: { "--brand-base": `#${hex}` } as React.CSSProperties,
      className: "[--brand:var(--brand-base)] dark:[--brand:#e7e5e4]",
    };
  }
  return { style: { "--brand": `#${hex}` } as React.CSSProperties, className: "" };
}
