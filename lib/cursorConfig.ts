// All knobs for the cursor effects live here. Values are in CSS pixels / milliseconds.

export const trail = {
  // "reveal": the brush uncovers a hidden dot-grid "data" pattern underneath the page.
  // "ink":    the brush paints a soft colour wash instead.
  mode: "reveal" as "reveal" | "ink",

  brushSize: 80, // brush radius. Bigger = wider reveal.
  brushOpacity: 0.22, // peak alpha of each stamp. Overlapping stamps add up, so this sets how fast strokes build.
  halfLife: 380, // ms for a stamp to fade to half strength. ~200 = quick wisp, ~1500 = lingering trail.
  spacing: 8, // px between stamps along the path. Lower = smoother but more work.
  maxStamps: 450, // hard cap on live stamps, which bounds the per-frame cost.
  maxDpr: 1.5, // caps canvas resolution on retina screens; the brush is soft, so higher is wasted work.

  // reveal-mode pattern
  cell: 14, // dot grid spacing
  dot: 1.3, // dot radius
  patternAlpha: { light: 0.55, dark: 0.6 }, // overall strength of the revealed pattern

  // ink-mode colours
  ink: { light: "rgba(31,127,122,0.16)", dark: "rgba(143,216,210,0.16)" },
};

export const sparks = {
  spacing: 14, // px of pointer travel per spark. Lower = denser trail.
  life: [450, 850] as [number, number], // ms range each spark lives
  size: [2, 4.5] as [number, number], // px range of spark radius
  speed: 0.9, // random scatter speed (px/frame)
  drag: 0.35, // how much of the pointer's own motion sparks inherit (0 = none, 1 = all)
  gravity: 0.045, // px/frame² pull downward; 0 = float in place
  burst: 18, // sparks fired on click
  hoverBoost: 2, // spark multiplier while over links/buttons
  max: 260, // hard cap on live sparks
  colors: {
    light: ["#1f7f7a", "#6fc0b8", "#ec7f69", "#f8b5a4"],
    dark: ["#8fd8d2", "#f49e8c", "#f6e3c6", "#ffffff"],
  },
};

export const star = {
  size: 26, // px at rest
  hoverSize: 44, // px over links/buttons (and when showing a label)
  offset: 14, // px the star sits below-right of the pointer, so it never hides what you point at
  follow: { stiffness: 300, damping: 26, mass: 0.6 }, // lag behind the pointer; lower stiffness = floatier
  roll: 0.6, // degrees of spin per px of horizontal travel (the "rolling starfish")
};

