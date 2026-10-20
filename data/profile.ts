// Single source of truth for all site content. Edit here, not in components.

export const profile = {
  name: "Divyasree Vemula",
  title: "Data & AI Engineer",
  location: "Winnipeg, MB, Canada",
  email: "vemuladivya212@gmail.com",
  linkedin: "https://www.linkedin.com/in/dsv8",
  github: "https://github.com/divyasreevemula8",
  // the live site's address (used for search engines and link previews)
  siteUrl: "https://divyasreevemula8.github.io/divyasree-portfolio/",
  // ✏️ paste the code from Google Search Console's "HTML tag" verification here (just the content="…" value)
  googleVerification: "",
  promises: ["pipelines built", "messy data cleaned", "AI agents shipped"],
  // drop your photo at public/me.jpg (square works best); a doodle placeholder shows until it exists
  photo: "/me.jpg",
  summary:
    "Data & AI Engineer with 4+ years designing cloud ETL/ELT pipelines, enterprise data integrations and agentic AI systems.",
  about: [
    "I cover the full data lifecycle: ingesting data from enterprise systems, modelling and validating it, and delivering it to analytics and applications.",
    "Recently I've been pairing that foundation with applied AI: natural-language querying agents, LLM workflows with function calling, and voice synthesis.",
  ],
};

// About section = the result of `SELECT * FROM divyasree;`. Rows with an empty value are hidden.
export const aboutFacts: { col: string; type: string; value: string }[] = [
  { col: "name", type: "varchar", value: "Divyasree Vemula" },
  { col: "role", type: "varchar", value: "Data & AI Engineer" },
  { col: "based_in", type: "varchar", value: "Winnipeg, MB 🇨🇦" },
  { col: "years_in_data", type: "int", value: "4+" },
  { col: "go_to_stack", type: "text[]", value: "ADF · SSIS · SQL · Python · Gemini" },
  { col: "superpower", type: "varchar", value: "messy data → clean, trusted tables" },
  { col: "degree", type: "varchar", value: "B.E. Electronics & Communication (KITS, India)" },
  { col: "pg_diploma", type: "varchar", value: "Data Analytics (St. Clair College)" },
  { col: "learning_now", type: "varchar", value: "Data Science (WorldQuant University)" },
  // ✏️ edit me: fill these in and they appear on the site
  { col: "fuel", type: "varchar", value: "" }, // e.g. "chai ☕"
  { col: "hobby", type: "varchar", value: "" },
  { col: "fun_fact", type: "varchar", value: "" },
];

export const stats = [
  { value: 4, suffix: "+", label: "years in data" },
  { value: 25, suffix: "%", label: "faster batch runs" },
  { value: 60, suffix: "%", label: "less manual ops" },
];

// Put your resume in /public and set the file name here. A PDF is best (export from Word: File → Save As → PDF).
// Served at <site>/<basePath>/<file>; see components/Resume.ts for how the URL is built.
export const resumeFile = "Divyasree_Vemula_Resume.docx";

export type FlowNode = { label: string; sub: string; desc: string };
export type Viz = {
  title: string;
  nodes: FlowNode[];
  codeLabel: string;
  code: string; // illustrative snippet, shown under an "illustrative" label
  metric?: { value: string; label: string };
};

export type Role = {
  title: string;
  company: string;
  place: string;
  period: string;
  story: string; // one short line (≤12 words): what you did
  impact: Impact[]; // the results, rendered as animated stats
  tools: string[];
  viz?: Viz;
};

// value: number -> counts up on scroll. kind "down"/"up" also draws an animated before→after bar.
// value: string -> shown as-is with a drawn underline (for wins that aren't percentages).
export type Impact = { value: number | string; suffix?: string; kind?: "down" | "up"; label: string };

export const experience: Role[] = [
  {
    title: "Data Analyst & AI Generalist",
    company: "Interact Health PRO",
    place: "Winnipeg, MB (Remote)",
    period: "May 2025 – Sep 2025",
    story: "Automated 5 GenAI pipelines and shipped domain-specific AI agents.",
    impact: [
      { value: 60, suffix: "%", kind: "down", label: "manual ops overhead" },
      { value: 25, suffix: "%", kind: "up", label: "user engagement" },
      { value: 30, suffix: "%", kind: "down", label: "stakeholder time-to-insight" },
    ],
    tools: ["Make.com", "Airtable", "LLM APIs", "JSON Schema", "Python"],
    viz: {
      title: "Ingestion & curation automation",
      nodes: [
        { label: "Airtable", sub: "intake", desc: "New records and form submissions land in Airtable and trigger the scenario." },
        { label: "Make.com", sub: "orchestrate", desc: "Scenario routes, cleans and enriches each record, then calls the LLM API." },
        { label: "LLM API", sub: "generate", desc: "Domain agent returns output constrained to a structured JSON schema." },
        { label: "Validate", sub: "schema + eval", desc: "Output is checked against the schema and a prompt-evaluation set before use." },
        { label: "Report", sub: "monitor", desc: "Automated reports track AI workflow accuracy and pipeline performance." },
      ],
      codeLabel: "agent_output.schema.json",
      code: `{
  "type": "object",
  "required": ["summary", "risk_flag", "next_step"],
  "properties": {
    "summary":   { "type": "string", "maxLength": 280 },
    "risk_flag": { "enum": ["none", "review", "urgent"] },
    "next_step": { "type": "string" }
  }
}`,
    },
  },
  {
    title: "Integration & Data Analyst",
    company: "Parian Logistics Inc.",
    place: "Winnipeg, MB (Hybrid)",
    period: "Oct 2024 – Apr 2025",
    story: "Kept logistics data flowing: Db2 → SSIS → ADLS → Cognos.",
    impact: [
      { value: "0", label: "pipeline run failures after tuning" },
      { value: "E2E", label: "data lineage documented for audits" },
    ],
    tools: ["SSIS", "IBM Db2", "ADLS Gen2", "Cognos", "SQL"],
    viz: {
      title: "Integration & lineage",
      nodes: [
        { label: "IBM Db2", sub: "source views", desc: "Optimized views expose clean, joined logistics data to downstream jobs." },
        { label: "SSIS", sub: "scheduled ETL", desc: "Tuned packages move data on schedule with error handling and no data loss." },
        { label: "ADLS Gen2", sub: "staging", desc: "Structured extracts are staged in the data lake for enterprise analytics." },
        { label: "Cognos", sub: "reporting", desc: "Self-serve dashboards for warehouse operations, with validated query performance." },
        { label: "Lineage", sub: "audit trail", desc: "Source-to-report lineage documented for audits and compliance." },
      ],
      codeLabel: "vw_shipment_status.sql",
      code: `CREATE VIEW vw_shipment_status AS
SELECT s.shipment_id,
       s.status,
       w.warehouse_name,
       DATEDIFF(HOUR, s.picked_at, s.shipped_at) AS dwell_hours
FROM   shipments s
JOIN   warehouses w ON w.id = s.warehouse_id
WHERE  s.shipped_at IS NOT NULL;`,
    },
  },
  {
    title: "Volunteer Data Engineer",
    company: "Volunteer Engagement",
    place: "Remote",
    period: "Sep 2023 – Sep 2024",
    story: "Automated donor pipelines and self-serve reports for a non-profit.",
    impact: [
      { value: "0", label: "manual extracts needed by leadership" },
      { value: "Team", label: "wide adoption of hygiene standards" },
    ],
    tools: ["Azure Data Factory", "SQL", "Power BI"],
    viz: {
      title: "Donor data pipeline",
      nodes: [
        { label: "Donor files", sub: "raw", desc: "Donation exports arrive in inconsistent formats from several sources." },
        { label: "ADF", sub: "ingest", desc: "Azure Data Factory automates ingestion on a schedule." },
        { label: "Clean", sub: "hygiene", desc: "Standard hygiene rules dedupe and normalize records." },
        { label: "Report", sub: "visual", desc: "Reproducible reports show donor engagement trends to leadership." },
      ],
      codeLabel: "dedupe_donors.sql",
      code: `WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY LOWER(email) ORDER BY updated_at DESC) AS rn
  FROM stg_donors
)
SELECT * FROM ranked WHERE rn = 1;`,
    },
  },
  {
    title: "Data Engineer",
    company: "Flight Centre Travel Group",
    place: "Toronto, ON (Remote)",
    period: "Jan 2023 – Aug 2023",
    story: "Moved Salesforce CRM data into Azure and sped up SSIS.",
    impact: [
      { value: 25, suffix: "%", kind: "down", label: "batch run time" },
      { value: "CRM→BI", label: "centralized Salesforce reporting" },
    ],
    tools: ["Azure Data Factory", "Blob Storage", "SSIS", "T-SQL", "Azure DevOps"],
    viz: {
      title: "Azure Data Factory pipeline",
      nodes: [
        { label: "Salesforce CRM", sub: "source", desc: "Transactional CRM data is the source system." },
        { label: "ADF Copy", sub: "ingest", desc: "An ADF pipeline copies CRM transactions on a trigger, with retries and run logging." },
        { label: "Blob Storage", sub: "staging", desc: "Raw extracts land in Azure Blob Storage as the central staging layer." },
        { label: "SSIS + SQL", sub: "transform", desc: "High-throughput SSIS workflows transform data; queries profiled and tuned on large datasets." },
        { label: "BI Reports", sub: "serve", desc: "Centralized business intelligence reporting reads the curated output." },
      ],
      codeLabel: "pipeline.json",
      code: `{
  "name": "pl_salesforce_to_blob",
  "activities": [{
    "name": "CopyOpportunities",
    "type": "Copy",
    "source": { "type": "SalesforceSource" },
    "sink":   { "type": "DelimitedTextSink" },
    "policy": { "retry": 3, "timeout": "0.02:00:00" }
  }]
}`,
    },
  },
  {
    title: "System & Database Engineer",
    company: "Shanta Software Solutions Pvt. Ltd.",
    place: "Hyderabad, India",
    period: "Mar 2019 – May 2020",
    story: "Designed schemas, integrated databases, tuned slow queries.",
    impact: [
      { value: "ER", label: "schemas & architecture authored" },
      { value: "Index", label: "tuning cleared query bottlenecks" },
    ],
    tools: ["SQL", "ER modelling", "Index tuning", "Testing"],
    viz: {
      title: "Database tuning loop",
      nodes: [
        { label: "Design", sub: "ER schema", desc: "Architecture diagrams and ER schemas authored to client specifications." },
        { label: "Integrate", sub: "implement", desc: "Enterprise software and database integrations implemented." },
        { label: "Test", sub: "unit + integration", desc: "Comprehensive unit and integration testing before release." },
        { label: "Profile", sub: "find bottleneck", desc: "Code and query profiling pinpoint slow paths." },
        { label: "Index", sub: "optimize", desc: "Index tuning removes bottlenecks, then the loop repeats." },
      ],
      codeLabel: "tune_index.sql",
      code: `-- find the slow lookup, then cover it
CREATE NONCLUSTERED INDEX ix_orders_customer_date
ON orders (customer_id, order_date)
INCLUDE (status, total);`,
    },
  },
];

export type Project = {
  name: string;
  blurb: string;
  details: string[];
  stack: string[];
  href?: string; // add a repo/demo URL to make the card a link
  scene?: "vanet" | "bandhu"; // optional animated illustration on the card
};

export const projects: Project[] = [
  {
    name: "Bandhu",
    blurb: "Universal voice persona & autonomous agent platform for voice preservation and proactive care.",
    details: [
      "Autonomous multi-agent platform deployed as containerized microservices on Google Cloud Run.",
      "Chat ingestion pipeline parses WhatsApp exports; Gemini extracts dialect (Telugu/Chittoor), phrasing and relationship context into structured PersonaProfiles.",
      "Zero-shot neural voice cloning (IndicF5) with a low-latency Google Cloud TTS fallback for real-time conversational audio.",
      "Agentic reasoning loop with Gemini function calling, session memory in Firestore and scheduled proactive check-ins.",
    ],
    stack: ["Python", "Google Gemini", "FastAPI", "IndicF5", "Firestore", "Cloud Run"],
    scene: "bandhu",
  },
  {
    name: "VANET Threat Detection",
    blurb: "Hybrid deep learning system detecting malicious spoofing in vehicular networks (capstone).",
    details: [
      "CNN-LSTM + SVM model over vehicle telemetry to flag anomalous behaviour.",
      "Achieved a higher F1-score than baseline ML models.",
    ],
    stack: ["Python", "PyTorch", "CNN-LSTM", "SVM"],
    scene: "vanet",
  },
];

export const education = [
  { title: "Data Science (in progress)", place: "WorldQuant University", period: "now" },
  { title: "Post-Graduate Diploma, Data Analytics for Business", place: "St. Clair College, Windsor ON", period: "2020 – 2022" },
  { title: "B.E., Electronics & Communication Engineering", place: "Kakatiya Institute of Technology & Science, India", period: "2015 – 2019" },
];

// LinkedIn recommendations, quoted verbatim. `highlight` must be an exact substring of `quote`;
// it gets a marker-style highlight that sweeps in. Add more by appending objects here.
export type Testimonial = { name: string; title: string; relation: string; date: string; quote: string; highlight?: string };
export const testimonials: Testimonial[] = [
  {
    name: "Todd McDermid",
    title: "Data Engineering Innovator",
    relation: "Managed Divyasree directly",
    date: "August 2023",
    quote:
      "Divya presented an exceptionally enthusiastic demeanour, willing to dive in to a very unfamiliar domain and existing data pipeline process. She attempts to solve problems on her own initiative and takes direction well, circumventing minor roadblocks independently, learning new technologies and techniques quickly. I would consider her proficient in Azure Data Factory, including ADF's Data Flows' more advanced transformations and expressions.",
    highlight: "proficient in Azure Data Factory, including ADF's Data Flows' more advanced transformations and expressions",
  },
  {
    name: "Lisandro Vargas",
    title: "Project Control Officer at CGI",
    relation: "Worked with Divyasree on the same team",
    date: "March 2026",
    quote:
      "Divyasree is eager to put into practice her education and experience, she is very respectful and a great team member to work with. Any team would benefit from working with her as she puts the extra time into her work to make sure the expectation are not just met but surpassed.",
    highlight: "the expectation are not just met but surpassed",
  },
];
export const recommendationsUrl = `${profile.linkedin}/details/recommendations/`;

export const nav = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Kind words", href: "#testimonials" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];
