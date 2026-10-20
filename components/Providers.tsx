"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { SparkCursor } from "./SparkCursor";
import { StarCursor } from "./StarCursor";
import { CursorTrail } from "./CursorTrail";
import { StarField } from "./StarField";
import { SunriseSky } from "./SunriseSky";
import { AnimatedFavicon } from "./AnimatedFavicon";
import { ResumeTab } from "./ResumeTab";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // attribute="class" -> toggles .dark on <html>; persists choice in localStorage; defaults to system.
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      {/* reducedMotion="user" makes every animation respect the OS "reduce motion" setting */}
      <MotionConfig reducedMotion="user">
        <AnimatedFavicon />
        <SunriseSky />
        <StarField />
        <CursorTrail />
        {children}
        <SparkCursor />
        <StarCursor />
        <ResumeTab />
      </MotionConfig>
    </ThemeProvider>
  );
}
