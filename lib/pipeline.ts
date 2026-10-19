// A tiny, honest-to-goodness pipeline engine for the Experience playgrounds.
// Each step runs a list of declarative ops over plain rows, so visitors can toggle steps
// and actually see rows get cast, deduped, filtered and aggregated.

export type Cell = string | number | null;
export type Row = { id: string | number } & Record<string, Cell>;

export type Op =
  | { kind: "passthrough" }
  | { kind: "cast"; col: string; to: "number" } // "$1,200" -> 1200, "" -> null
  | { kind: "dropNulls"; col: string }
  | { kind: "filter"; col: string; eq: Cell }
  | { kind: "dedupe"; keys: string[]; lower?: boolean }
  | { kind: "derive"; col: string; fn: "hoursBetween"; args: [string, string] }
  | { kind: "enrich"; values: Record<string, Record<string, Cell>> } // keyed by row id
  | { kind: "validate"; col: string; oneOf: Cell[] }
  | { kind: "aggregate"; by: string; agg: "sum" | "avg" | "count"; col?: string; as: string }
  | { kind: "replace"; rows: Row[] }; // e.g. a lineage map

export type Step = {
  ops: Op[];
  cost: number; // simulated ms
  log: string; // terminal label, e.g. "extract salesforce"
  optional?: string; // label for an on/off switch
  tuned?: { cost: number; label: string }; // faster variant behind a switch
  breakable?: boolean; // the step "break it" targets
};

export type Pipeline = { job: string; rows: Row[]; steps: Step[] };

export type StepResult = { input: Row[]; output: Row[]; removed: Set<Row["id"]>; cost: number; skipped: boolean };

const isNull = (v: Cell | undefined) => v === null || v === undefined || v === "";

function apply(rows: Row[], op: Op): Row[] {
  switch (op.kind) {
    case "passthrough":
      return rows;
    case "cast":
      return rows.map((r) => {
        const v = r[op.col];
        const n = typeof v === "number" ? v : isNull(v) ? null : Number(String(v).replace(/[$,\s]/g, ""));
        return { ...r, [op.col]: n === null || Number.isNaN(n) ? null : n };
      });
    case "dropNulls":
      return rows.filter((r) => !isNull(r[op.col]));
    case "filter":
      return rows.filter((r) => r[op.col] === op.eq);
    case "dedupe": {
      const seen = new Set<string>();
      return rows.filter((r) => {
        const k = op.keys.map((c) => String(r[c] ?? "")).join("|");
        const key = op.lower ? k.toLowerCase() : k;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    case "derive":
      return rows.map((r) => {
        const [a, b] = op.args.map((c) => r[c]);
        const h = isNull(a) || isNull(b) ? null : Math.round((Date.parse(String(b)) - Date.parse(String(a))) / 36e5);
        return { ...r, [op.col]: h };
      });
    case "enrich":
      return rows.map((r) => ({ ...r, ...(op.values[String(r.id)] ?? {}) }));
    case "validate":
      return rows.filter((r) => op.oneOf.includes(r[op.col]));
    case "aggregate": {
      const groups = new Map<string, number[]>();
      for (const r of rows) {
        const g = String(r[op.by]);
        const v = op.col ? Number(r[op.col]) : 1;
        if (op.col && isNull(r[op.col])) continue;
        groups.set(g, [...(groups.get(g) ?? []), v]);
      }
      return [...groups].map(([g, vs]) => {
        const sum = vs.reduce((a, b) => a + b, 0);
        const val = op.agg === "count" ? vs.length : op.agg === "sum" ? sum : sum / vs.length;
        return { id: g, [op.by]: g, [op.as]: Math.round(val * 10) / 10 };
      });
    }
    case "replace":
      return op.rows;
  }
}

/** Runs every step. `off` = indices of optional steps switched off; `tuned` = use faster variants. */
export function runPipeline(p: Pipeline, opts: { off: Set<number>; tuned: boolean }): StepResult[] {
  const out: StepResult[] = [];
  let rows = p.rows;
  p.steps.forEach((s, i) => {
    const skipped = opts.off.has(i);
    const input = rows;
    const output = skipped ? input : s.ops.reduce(apply, input);
    const kept = new Set(output.map((r) => r.id));
    // only row-preserving steps can "remove" rows; reshaping steps (aggregate/replace) just transform
    const reshapes = s.ops.some((o) => o.kind === "aggregate" || o.kind === "replace");
    const removed = new Set(reshapes ? [] : input.filter((r) => !kept.has(r.id)).map((r) => r.id));
    out.push({ input, output, removed, skipped, cost: opts.tuned && s.tuned ? s.tuned.cost : s.cost });
    rows = output;
  });
  return out;
}
