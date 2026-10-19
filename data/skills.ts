import {
  siPython, siPandas, siNumpy, siApachespark, siFastapi, siPydantic, siPostgresql, siDocker, siGit,
  siGooglegemini, siGooglecloud, siFirebase, siAirtable, siMake, siJira, siPytorch, siDbeaver, siOpenai,
} from "simple-icons";
import { sqlServer, dataFactory, devOps, powerBi, db2, llamaIndex, azure, ibm } from "./logos";

// Logos come from Simple Icons (CC0); Microsoft, IBM and LlamaIndex marks come from ./logos.
// SSIS, ADLS Gen2 and Cognos have no logo of their own, so they wear their parent's mark.
export type Skill = {
  name: string;
  group: Group;
  icon?: { path: string; hex: string; viewBox?: string; evenodd?: boolean };
  art?: { body: string; viewBox: string; hex: string };
  mono?: { text: string; hex: string };
};
export type Group = "Data & Cloud" | "AI" | "Databases" | "BI" | "Code & Tools";
export const groups: Group[] = ["Data & Cloud", "AI", "Databases", "BI", "Code & Tools"];

const si = (s: { path: string; hex: string }) => ({ path: s.path, hex: s.hex });

export const skills: Skill[] = [
  { name: "Azure Data Factory", group: "Data & Cloud", art: { ...dataFactory, hex: "0078D4" } },
  { name: "ADLS Gen2", group: "Data & Cloud", art: { ...azure, hex: "0078D4" } },
  { name: "SSIS", group: "Data & Cloud", art: { ...sqlServer, hex: "CC2927" } },
  { name: "Azure DevOps", group: "Data & Cloud", art: { ...devOps, hex: "0078D4" } },
  { name: "PySpark", group: "Data & Cloud", icon: si(siApachespark) },
  { name: "Google Cloud Run", group: "Data & Cloud", icon: si(siGooglecloud) },
  { name: "Docker", group: "Data & Cloud", icon: si(siDocker) },

  { name: "Gemini", group: "AI", icon: si(siGooglegemini) },
  { name: "Azure OpenAI", group: "AI", icon: si(siOpenai) },
  { name: "LlamaIndex", group: "AI", icon: { ...llamaIndex, hex: "8B5CF6" } },
  { name: "RAG / Text-to-SQL", group: "AI", mono: { text: "RAG", hex: "0D9488" } },
  { name: "PyTorch", group: "AI", icon: si(siPytorch) },

  { name: "SQL Server", group: "Databases", art: { ...sqlServer, hex: "CC2927" } },
  { name: "IBM Db2", group: "Databases", icon: { ...db2, hex: "0F62FE" } },
  { name: "PostgreSQL", group: "Databases", icon: si(siPostgresql) },
  { name: "Firestore", group: "Databases", icon: si(siFirebase) },
  { name: "DBeaver", group: "Databases", icon: si(siDbeaver) },

  { name: "Power BI", group: "BI", art: { ...powerBi, hex: "E8B100" } },
  { name: "IBM Cognos", group: "BI", icon: { ...ibm, hex: "0F62FE" } },

  { name: "Python", group: "Code & Tools", icon: si(siPython) },
  { name: "Pandas", group: "Code & Tools", icon: si(siPandas) },
  { name: "NumPy", group: "Code & Tools", icon: si(siNumpy) },
  { name: "FastAPI", group: "Code & Tools", icon: si(siFastapi) },
  { name: "Pydantic", group: "Code & Tools", icon: si(siPydantic) },
  { name: "Git", group: "Code & Tools", icon: si(siGit) },
  { name: "Airtable", group: "Code & Tools", icon: si(siAirtable) },
  { name: "Make.com", group: "Code & Tools", icon: si(siMake) },
  { name: "Jira", group: "Code & Tools", icon: si(siJira) },
];
