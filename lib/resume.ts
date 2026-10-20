import { resumeFile } from "@/data/profile";

// e.g. "/divyasree-portfolio/Divyasree_Vemula_Resume.pdf" on GitHub Pages, "/Divyasree_..." locally
export const resumeUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${resumeFile}`;
