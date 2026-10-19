import type { Pipeline } from "@/lib/pipeline";

// SAMPLE DATA ONLY: small, made-up rows shaped like the real work so visitors can play.
// Keyed by company name; steps line up 1:1 with that role's viz.nodes in data/profile.ts.

export const pipelines: Record<string, Pipeline> = {
  "Interact Health PRO": {
    job: "intake_ai_triage",
    rows: [
      { id: 1, member: "Ana R.", note: "Sore knee after a 10k", email: "ana@mail.io" },
      { id: 2, member: "Ben T.", note: "Can't sleep, stressed", email: "ben@mail.io" },
      { id: 3, member: "Chen L.", note: "Chest tight on stairs", email: "chen@mail.io" },
      { id: 4, member: "Dev P.", note: "Billing question", email: "" },
      { id: 5, member: "Eli K.", note: "Mild headache", email: "eli@mail.io" },
      { id: 6, member: "Fay M.", note: "Dizzy after new meds", email: "fay@mail.io" },
      { id: 7, member: "Gus O.", note: "Wants a diet plan", email: "gus@mail.io" },
      { id: 8, member: "Hana S.", note: "Back ache, desk job", email: "hana@mail.io" },
    ],
    steps: [
      { ops: [{ kind: "passthrough" }], cost: 200, log: "pull airtable intake" },
      { ops: [{ kind: "dropNulls", col: "email" }], cost: 300, log: "route via make.com", optional: "skip rows with no contact" },
      {
        ops: [
          {
            kind: "enrich",
            values: {
              "1": { risk_flag: "review" }, "2": { risk_flag: "review" }, "3": { risk_flag: "urgent" }, "4": { risk_flag: "none" },
              "5": { risk_flag: "none" }, "6": { risk_flag: "urgent" }, "7": { risk_flag: "none" }, "8": { risk_flag: "maybe?" },
            },
          },
        ],
        cost: 1400,
        log: "llm agent → json",
        breakable: true,
      },
      { ops: [{ kind: "validate", col: "risk_flag", oneOf: ["none", "review", "urgent"] }], cost: 150, log: "validate schema", optional: "enforce json schema" },
      { ops: [{ kind: "aggregate", by: "risk_flag", agg: "count", as: "members" }], cost: 120, log: "report by risk" },
    ],
  },

  "Parian Logistics Inc.": {
    job: "shipments_to_cognos",
    rows: [
      { id: "S-101", warehouse: "WPG-1", picked_at: "2025-01-06T08:00", shipped_at: "2025-01-06T20:00" },
      { id: "S-102", warehouse: "WPG-1", picked_at: "2025-01-06T09:00", shipped_at: "2025-01-07T15:00" },
      { id: "S-103", warehouse: "WPG-2", picked_at: "2025-01-06T07:30", shipped_at: "2025-01-06T11:30" },
      { id: "S-104", warehouse: "REG-1", picked_at: "2025-01-06T10:00", shipped_at: null },
      { id: "S-105", warehouse: "WPG-2", picked_at: "2025-01-07T06:00", shipped_at: "2025-01-07T14:00" },
      { id: "S-106", warehouse: "REG-1", picked_at: "2025-01-07T08:00", shipped_at: "2025-01-08T08:00" },
      { id: "S-107", warehouse: "WPG-1", picked_at: "2025-01-07T12:00", shipped_at: null },
    ],
    steps: [
      { ops: [{ kind: "passthrough" }], cost: 250, log: "read db2 vw_shipments" },
      { ops: [{ kind: "derive", col: "dwell_hours", fn: "hoursBetween", args: ["picked_at", "shipped_at"] }], cost: 900, log: "ssis dwell calc", breakable: true },
      { ops: [{ kind: "dropNulls", col: "dwell_hours" }], cost: 300, log: "stage to adls", optional: "exclude in-flight shipments" },
      { ops: [{ kind: "aggregate", by: "warehouse", agg: "avg", col: "dwell_hours", as: "avg_dwell_h" }], cost: 200, log: "cognos avg dwell" },
      {
        ops: [
          {
            kind: "replace",
            rows: [
              { id: "l1", report_field: "avg_dwell_h", source: "SHIPMENTS.PICKED_AT/SHIPPED_AT", via: "ssis dwell calc" },
              { id: "l2", report_field: "warehouse", source: "WAREHOUSES.NAME", via: "db2 view join" },
            ],
          },
        ],
        cost: 50,
        log: "write lineage",
      },
    ],
  },

  "Volunteer Engagement": {
    job: "donor_ingest",
    rows: [
      { id: 1, email: "jo@mail.com", campaign: "Spring", amount: "25" },
      { id: 2, email: "JO@mail.com", campaign: "Spring", amount: "25" },
      { id: 3, email: "sam@mail.com", campaign: "Gala", amount: "$120" },
      { id: 4, email: "lee@mail.com", campaign: "Spring", amount: "40" },
      { id: 5, email: "Sam@Mail.com", campaign: "Gala", amount: "$120" },
      { id: 6, email: "ria@mail.com", campaign: "Winter", amount: "60" },
      { id: 7, email: "max@mail.com", campaign: "Winter", amount: "15" },
      { id: 8, email: "lee@mail.com", campaign: "Spring", amount: "40" },
    ],
    steps: [
      { ops: [{ kind: "passthrough" }], cost: 200, log: "read donor files" },
      { ops: [{ kind: "cast", col: "amount", to: "number" }], cost: 400, log: "adf ingest + cast", breakable: true },
      { ops: [{ kind: "dedupe", keys: ["email", "campaign", "amount"], lower: true }], cost: 250, log: "dedupe re-uploads", optional: "dedupe (case-insensitive)" },
      { ops: [{ kind: "aggregate", by: "campaign", agg: "sum", col: "amount", as: "raised" }], cost: 120, log: "report by campaign" },
    ],
  },

  "Flight Centre Travel Group": {
    job: "salesforce_to_bi",
    rows: [
      { id: "OPP-01", account: "Maple Tours", region: "West", stage: "Closed Won", amount: "$12,400" },
      { id: "OPP-02", account: "Prairie Air", region: "Prairie", stage: "Prospecting", amount: "$3,100" },
      { id: "OPP-03", account: "Lakeside Co", region: "Central", stage: "Closed Won", amount: "8,950" },
      { id: "OPP-04", account: "Rocky Trips", region: "West", stage: "Closed Won", amount: null },
      { id: "OPP-05", account: "North Star", region: "Prairie", stage: "Closed Won", amount: "$5,600" },
      { id: "OPP-06", account: "Harbour Grp", region: "East", stage: "Closed Lost", amount: "$2,000" },
      { id: "OPP-07", account: "Bay Travel", region: "East", stage: "Closed Won", amount: "$7,250" },
      { id: "OPP-08", account: "Summit Inc", region: "West", stage: "Closed Won", amount: "$4,300" },
    ],
    steps: [
      { ops: [{ kind: "passthrough" }], cost: 300, log: "extract salesforce" },
      { ops: [{ kind: "cast", col: "amount", to: "number" }], cost: 900, log: "adf copy + cast" },
      { ops: [{ kind: "passthrough" }], cost: 300, log: "land in blob" },
      {
        ops: [{ kind: "dropNulls", col: "amount" }, { kind: "filter", col: "stage", eq: "Closed Won" }],
        cost: 1600,
        log: "ssis transform",
        tuned: { cost: 1200, label: "tuned SQL (−25%)" },
        breakable: true,
      },
      { ops: [{ kind: "aggregate", by: "region", agg: "sum", col: "amount", as: "won_$" }], cost: 200, log: "publish bi" },
    ],
  },

  "Shanta Software Solutions Pvt. Ltd.": {
    job: "orders_lookup",
    rows: [
      { id: 1, customer_id: 42, status: "paid", total: 120 },
      { id: 2, customer_id: 17, status: "shipped", total: 80 },
      { id: 3, customer_id: 42, status: "pending", total: 45 },
      { id: 4, customer_id: 8, status: "???", total: 60 },
      { id: 5, customer_id: 42, status: "shipped", total: 210 },
      { id: 6, customer_id: 23, status: "paid", total: 35 },
      { id: 7, customer_id: 17, status: "paid", total: 99 },
    ],
    steps: [
      { ops: [{ kind: "passthrough" }], cost: 100, log: "load orders schema" },
      { ops: [{ kind: "passthrough" }], cost: 200, log: "integrate client db" },
      { ops: [{ kind: "validate", col: "status", oneOf: ["paid", "shipped", "pending"] }], cost: 150, log: "integration tests", optional: "reject bad status codes" },
      { ops: [{ kind: "passthrough" }], cost: 100, log: "profile query", breakable: true },
      { ops: [{ kind: "filter", col: "customer_id", eq: 42 }], cost: 1200, log: "orders for customer 42", tuned: { cost: 40, label: "add index (scan → seek)" } },
    ],
  },
};
