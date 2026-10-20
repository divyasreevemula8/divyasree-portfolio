// Prefix a /public file with the GitHub Pages base path (e.g. "/divyasree-portfolio/me.jpg").
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
