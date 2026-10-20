import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { education, profile } from "@/data/profile";
import { skills } from "@/data/skills";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-jb" });

const title = `${profile.name} — ${profile.title}`;
// Search engines show ~155 characters; lead with the name so "Divyasree Vemula" searches match.
const description = `${profile.name} is a ${profile.title} in ${profile.location} with 4+ years building cloud data pipelines (Azure Data Factory, SSIS, SQL, Python) and GenAI agents.`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: title, template: `%s · ${profile.name}` },
  description,
  applicationName: profile.name,
  keywords: [
    profile.name,
    "Divyasree",
    "Vemula",
    "Data Engineer",
    "AI Engineer",
    "Data & AI Engineer",
    "Winnipeg",
    "Canada",
    "Azure Data Factory",
    "SSIS",
    "SQL",
    "Python",
    "GenAI",
    "portfolio",
  ],
  authors: [{ name: profile.name, url: profile.siteUrl }],
  creator: profile.name,
  alternates: { canonical: "./" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: {
    type: "profile",
    url: "./",
    siteName: profile.name,
    title,
    description,
    locale: "en_CA",
    firstName: "Divyasree",
    lastName: "Vemula",
    images: [{ url: "og.png", width: 1200, height: 630, alt: `${profile.name}, ${profile.title}` }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["og.png"] },
  verification: profile.googleVerification ? { google: profile.googleVerification } : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1e26" },
  ],
};

// Structured data: tells Google this site is the official page for the person "Divyasree Vemula",
// and links it to her LinkedIn and GitHub so they're understood as the same person.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${profile.siteUrl}#person`,
      name: profile.name,
      alternateName: ["Divyasree", "Divya Vemula"],
      givenName: "Divyasree",
      familyName: "Vemula",
      jobTitle: profile.title,
      description: profile.summary,
      url: profile.siteUrl,
      image: new URL("me.jpg", profile.siteUrl).href,
      email: `mailto:${profile.email}`,
      address: { "@type": "PostalAddress", addressLocality: "Winnipeg", addressRegion: "MB", addressCountry: "CA" },
      sameAs: [profile.linkedin, profile.github],
      alumniOf: education
        .filter((e) => !e.period.startsWith("now"))
        .map((e) => ({ "@type": "CollegeOrUniversity", name: e.place.split(",")[0] })),
      knowsAbout: skills.map((s) => s.name),
    },
    {
      "@type": "WebSite",
      "@id": `${profile.siteUrl}#website`,
      url: profile.siteUrl,
      name: profile.name,
      inLanguage: "en",
      author: { "@id": `${profile.siteUrl}#person` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
