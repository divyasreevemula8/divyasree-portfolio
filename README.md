# dsvportfolio

Personal portfolio: **Next.js 15 (App Router) + Tailwind CSS v4 + Framer Motion**, light/dark via `next-themes`, exported as a static site for GitHub Pages.

```
app/            layout.tsx (fonts, providers), page.tsx (homepage), globals.css (Tailwind + dark variant)
components/     Navbar, ThemeToggle, Hero, About, Experience, Projects, Contact, Footer, Reveal, Providers
data/profile.ts ALL content (from resume). Edit this file to update the site.
.github/workflows/deploy.yml   builds and publishes to GitHub Pages on push to main
```

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build & test

```bash
npm run build                       # static site in ./out
BASE_PATH=/dsvportfolio npm run build   # same, as it will be served on GitHub Pages
npx serve out
```

## Deploy

1. Push to `main`.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. The workflow publishes to `https://divyasreevemula8.github.io/dsvportfolio/`.
   (If you rename the repo to `divyasreevemula8.github.io`, delete the `BASE_PATH` line in the workflow.)

Vercel alternative: import the repo, remove `output: "export"` / `basePath` if you like, and deploy with defaults.

## Résumé link

Drop your file in `public/` (a PDF is best), then set `resumeFile` in `data/profile.ts`. The navbar and hero buttons pick it up automatically, including the GitHub Pages `/dsvportfolio` prefix.

## Experience visuals

Each role in `data/profile.ts` can have a `viz` block (flow nodes + an illustrative code snippet). The code snippets are examples, not your actual production code, and the UI labels them that way.

## Cursor effects

All tuning lives in `lib/cursorConfig.ts`.

| Effect | File | Key knobs |
| --- | --- | --- |
| Reveal / ink trail (canvas) | `components/CursorTrail.tsx` | `mode`, `brushSize`, `brushOpacity`, `halfLife`, `spacing` |
| Floating glyphs (hero) | `components/FloatingGlyphs.tsx` | `radius`, `strength`, `stiffness`, `damping` |
| Magnetic buttons | `components/Magnetic.tsx` | `strength` prop |
| Spark-trail cursor | `components/SparkCursor.tsx` | `sparks` in config: `spacing`, `life`, `size`, `gravity`, `burst`, `colors` |
| Star cursor (starfish by day, glowing star by night) | `components/StarCursor.tsx` | `star` in config: `size`, `hoverSize`, `offset`, `follow`, `roll`; add `data-cursor-label="view"` to any element for a tag |

All of them turn off on touch devices and when "reduce motion" is on. The rAF loops stop once nothing is moving.

## Theme

The beach palette lives in `app/globals.css` (`@theme`): `--color-accent*`, `sea-*` and `coral-*` scales, `seafoam`/`shell`, and a re-tinted `stone-*` scale (warm sand in light mode, deep ocean in dark mode). Keep gradients to a minimum. Change the palette there.

## Testimonials ("Kind words")

Add LinkedIn recommendations to `testimonials` in `data/profile.ts`:

```ts
{ name, title, relation, date, quote, highlight? }
```

`highlight` must be an exact phrase from `quote`; it gets a marker sweep. Keep quotes verbatim, since they're someone else's words. The carousel auto-rotates, swipes, and links to your LinkedIn recommendations page.

## Experience terminals & pipeline playgrounds

Each role card shows its real results as chips (`components/RoleDemo.tsx`) and a "play with the pipeline" button that opens an interactive playground (`components/PipelinePlayground.tsx`) with a small run log.

- Sample rows and steps live in `data/pipelines.ts`, keyed by company, one step per `viz.nodes` entry. **The data is made up**; only the final `✓` lines (from `impact` in `data/profile.ts`) are real results.
- The engine is `lib/pipeline.ts` (ops: cast, dropNulls, filter, dedupe, derive, enrich, validate, aggregate, replace).
- Step flags: `optional` adds an on/off switch, `tuned` a faster variant, and `breakable` makes it the step "💥 break it" fails twice before the retry policy recovers.

## Contact

A fake SQL editor: `INSERT INTO divyasree.inbox`. Run with an empty value → a joke not-null error; with a message → confetti, then it opens the visitor's mail app with the message pre-filled. The doodle icons are in `components/DoodleIcon.tsx`.

## About

`SELECT * FROM divyasree;`: rows come from `aboutFacts` in `data/profile.ts`. Rows with an empty value are hidden, so fill in `fuel`, `hobby` and `fun_fact` and they appear.

## Hero: shop sign, photo, toolbelt

- **Photo:** drop a square photo at `public/me.jpg` (or change `profile.photo`). Until then a doodle placeholder shows in the photo frame on the sign.
- **Sign text:** `profile.shop`, `profile.services` and the ticked `profile.promises` in `data/profile.ts`.
- **Toolbelt:** `toolbelt` in `data/profile.ts`. Each entry has an `icon` (wrench, plunger, toolbox, flashlight or robot), a `label` and the `line` shown on hover/tap.
- **Experience pipelines:** on wide screens a sticky side panel shows the pipeline for the role you're reading. On phones each card has its own. Nothing runs until the visitor clicks ▶ run.
