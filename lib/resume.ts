import { resumeFile } from "@/data/profile";

// e.g. "/dsvportfolio/Divyasree_Vemula_Resume.pdf" on GitHub Pages, "/Divyasree_..." locally
export const resumeUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${resumeFile}`;
