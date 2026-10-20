// Static export so the site can be hosted on GitHub Pages.
// For a project page (username.github.io/divyasree-portfolio) the workflow sets BASE_PATH=/divyasree-portfolio.
const basePath = process.env.BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  // Plain <a href> to files in /public isn't auto-prefixed with basePath, so expose it to the client.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
