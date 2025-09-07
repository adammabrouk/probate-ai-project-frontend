import { useMemo, useState, useCallback } from "react";
import type { PrelimResponse, RecordRow } from "../types";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceArea, ReferenceLine, Brush, PieChart, Pie, Cell,
} from "recharts";
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// ---------- palette & shared styles ----------
const PALETTE = {
  high: "#4F46E5",      // indigo
  med:  "#F59E0B",      // amber
  low:  "#9CA3AF",      // gray
  absentee: "#10B981",  // emerald
  local:    "#6366F1",  // indigo-500
  accent:   "#06B6D4",  // cyan
  warn:     "#EF4444",  // red
  success:  "#22C55E",  // green
  purple:   "#8B5CF6",
  pink:     "#EC4899",
};

const Card: React.FC<React.PropsWithChildren<{ title: string; subtitle?: string }>> = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-gray-200 shadow-sm p-4 bg-white">
    <div className="mb-2">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ---------- props for interactive filtering ----------
type Handlers = {
  onCountyClick?: (county: string) => void;
  onMonthClick?: (ym: string) => void;
  onPetitionTypeClick?: (pt: string) => void;
  onAbsenteeOnly?: () => void;
  onValueBucket?: (low?: number, high?: number) => void;
  onShortlistPageChange?: (page: number) => void;
  onPropertyClassClick?: (property_class: string) => void;
  onDaysSincePetitionRange?: (min?: number, max?: number) => void;
  onDeathToPetitionRange?: (min?: number, max?: number) => void;
};

export default function PrelimAnalysis({
  data,
  shortlist,
  shortlistMeta,
  shortlistLoading,
  onShortlistPageChange,
  onCountyClick,
  onMonthClick,
  onPetitionTypeClick,
  onAbsenteeOnly,
  onValueBucket,
  sort,
  onSortChange,
  onHasValue,
  filters,
  ...handlers
}: {
  data: PrelimResponse;
  shortlist: RecordRow[];
  shortlistMeta?: { total:number; page:number; page_size:number; total_pages:number; has_next:boolean; has_prev:boolean };
  shortlistLoading?: boolean;
  sort: { column: string; direction: "asc" | "desc" }[];
  onSortChange: (sort: { column: string; direction: "asc" | "desc" }[]) => void;
  onHasValue?: () => void;
  filters: any;
} & Handlers) {
  const { charts: c, thresholds: t } = data;
  const [tab, setTab] = useState<"overview" | "counties" | "timing" | "value">("overview");

  const Pager = () => {
    if (!shortlistMeta) return null;
    const { page, page_size, total_pages, total, has_prev, has_next } = shortlistMeta;
    const start = (page - 1) * page_size + 1;
    const end = Math.min(page * page_size, total);
    return (
      <div className="flex items-center justify-between py-2 text-sm">
        <div className="text-gray-600">{total ? `Showing ${start}–${end} of ${total}` : "No results"}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded border disabled:opacity-50"
            disabled={!has_prev || shortlistLoading}
            onClick={() => onShortlistPageChange?.(page - 1)}
          >Previous</button>
          <span className="px-2 py-1.5">{page} / {Math.max(1, total_pages)}</span>
          <button
            className="px-3 py-1.5 rounded border disabled:opacity-50"
            disabled={!has_next || shortlistLoading}
            onClick={() => onShortlistPageChange?.(page + 1)}
          >Next</button>
        </div>
      </div>
    );
  };

  // Synthesized stacked absentee/local per month from rate * total filings
  const absenteeStackOverTime = useMemo(() => {
    const byMonth = new Map(c.filingsByMonth.map(d => [d.month, d.count]));
    return c.absenteeRateTrend.map(d => {
      const total = byMonth.get(d.month) ?? 0;
      const abs = Math.round(total * d.rate);
      return { month: d.month, absentee: abs, local: Math.max(0, total - abs) };
    });
  }, [c.absenteeRateTrend, c.filingsByMonth]);

  // Map value histogram bucket -> numeric range for backend filters
  const bucketToRange = (bucket: string): [number | undefined, number | undefined] => {
    switch (bucket) {
      case "<100k": return [0, 100000];
      case "100–250k": return [100000, 250000];
      case "250–500k": return [250000, 500000];
      case "500k–1M": return [500000, 1000000];
      case "1M+": return [1000000, undefined];
      default: return [undefined, undefined];
    }
  };

  // Download CSV handler
  const handleDownload = useCallback(async () => {
    const params: any = { ...filters };
    // Map frontend sort keys to backend keys
    const sortKeyMap: Record<string, string> = { property_value_2025: "property_value" };
    if (sort && sort.length) params.sort = sort.map(s => `${sortKeyMap[s.column] || s.column}:${s.direction}`).join(",");
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v == null) return;
      if (Array.isArray(v)) v.forEach(x => sp.append(k, String(x)));
      else sp.append(k, String(v));
    });
    sp.set("page", "1");
    sp.set("page_size", "1000");
    const res = await fetch(`/api/shortlist?${sp.toString()}`);
    if (!res.ok) { alert("Failed to download shortlist"); return; }
    const { shortlist } = await res.json();
    const headers = [
      "score","tier","county","case_no","owner_name","property_address","city","property_value_2025","petition_date","absentee_flag","parcel_number","qpublic_report_url","rationale"
    ];
    const csv = [headers.join(",")].concat(
      shortlist.map((row: any) => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shortlist.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filters, sort]);

  // Handler for property class click
  const onPropertyClassClick = (property_class: string) => {
    handlers.onPropertyClassClick?.(property_class);
  };
  // Handler for days since petition click
  const onDaysSincePetitionClick = (bucket: string) => {
    // Parse bucket label to min/max days
    const match = bucket.match(/(\d+)[^\d]+(\d+)|>(\d+)/);
    let min, max;
    if (match) {
      if (match[1] && match[2]) {
        min = parseInt(match[1], 10);
        max = parseInt(match[2], 10);
      } else if (match[3]) {
        min = parseInt(match[3], 10);
        max = undefined;
      }
    }
    handlers.onDaysSincePetitionRange?.(min, max);
  };
  // Handler for death-petition delay click
  const onDeathToPetitionClick = (bucket: string) => {
    // Parse bucket label to min/max days
    const match = bucket.match(/(\d+)[^\d]+(\d+)|>(\d+)/);
    let min, max;
    if (match) {
      if (match[1] && match[2]) {
        min = parseInt(match[1], 10);
        max = parseInt(match[2], 10);
      } else if (match[3]) {
        min = parseInt(match[3], 10);
        max = undefined;
      }
    }
    handlers.onDeathToPetitionRange?.(min, max);
  };

  // ---------- page ----------
  return (
    <div className="space-y-6">
      {/* KPI bar */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-gray-200 shadow-sm p-4 bg-white">
            <div className="text-xs text-gray-500">{k.label}</div>
            <div className="text-3xl font-bold mt-1">{k.value}</div>
            {"hint" in k && (k as any).hint && <div className="text-[11px] text-gray-500">{(k as any).hint}</div>}
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="flex gap-2">
        {[
          ["overview","Overview"],
          ["counties","Counties"],
          ["timing","Timing"],
          ["value","Value & Class"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className={`px-3 py-1.5 rounded-full text-sm ${tab===k ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* -------- OVERVIEW (hero stacked areas) -------- */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card title="Lead Tiers Over Time (stacked area)" subtitle="Click a month to drill down">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={c.filingsByMonthTiered}
                onClick={(e: any) => e?.activeLabel && onMonthClick?.(e.activeLabel)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="low" stackId="1" stroke={PALETTE.low} fill={PALETTE.low} fillOpacity={0.35} />
                <Area type="monotone" dataKey="med" stackId="1" stroke={PALETTE.med} fill={PALETTE.med} fillOpacity={0.5} />
                <Area type="monotone" dataKey="high" stackId="1" stroke={PALETTE.high} fill={PALETTE.high} fillOpacity={0.65} />
                <Brush height={20} travellerWidth={10} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Absentee vs Local Over Time (stacked area)" subtitle="Click a month to filter; red line marks target rate">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={absenteeStackOverTime}
                onClick={(e: any) => e?.activeLabel && onMonthClick?.(e.activeLabel)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {t && (
                  <ReferenceLine
                    y={undefined /* visual only; area is stacked */}
                    label="" />
                )}
                <Area type="monotone" dataKey="local" stackId="a" stroke={PALETTE.local} fill={PALETTE.local} fillOpacity={0.45} />
                <Area type="monotone" dataKey="absentee" stackId="a" stroke={PALETTE.absentee} fill={PALETTE.absentee} fillOpacity={0.65} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Property Class Mix (donut)">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={c.propertyClassMix}
                  dataKey="count"
                  nameKey="property_class"
                  innerRadius={60}
                  outerRadius={100}
                  label
                  onClick={(_, idx) => {
                    const pc = c.propertyClassMix[idx]?.property_class;
                    if (pc) onPropertyClassClick(pc);
                  }}
                >
                  {c.propertyClassMix.map((_, i) => {
                    const palette = [PALETTE.high, PALETTE.med, PALETTE.absentee, PALETTE.purple, PALETTE.pink];
                    return <Cell key={i} fill={palette[i % palette.length]} />;
                  })}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* -------- COUNTIES (drill by county) -------- */}
      {tab === "counties" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Absentee vs Local by County (stacked bar)" subtitle="Click a county to filter">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={c.absenteeByCounty}
                onClick={(e: any) => {
                  const county = e?.activeLabel || e?.activePayload?.[0]?.payload?.county;
                  if (county) onCountyClick?.(county);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="county" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="absentee" stackId="x" fill={PALETTE.absentee} />
                <Bar dataKey="local" stackId="x" fill={PALETTE.local} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Median Value by County (buy-box band)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={c.valueByCounty}
                onClick={(e: any) => {
                  const county = e?.activeLabel || e?.activePayload?.[0]?.payload?.county;
                  if (county) onCountyClick?.(county);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="county" />
                <YAxis />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                {t && (
                  <ReferenceArea
                    y1={t.buyboxValueMin} y2={t.buyboxValueMax}
                    fill={PALETTE.success} fillOpacity={0.12}
                    label={{ value: "Buy-box", position: "insideTop" }}
                  />
                )}
                <Bar dataKey="median_value" fill={PALETTE.high} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* -------- TIMING (petition windows, delays) -------- */}
      {tab === "timing" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Days Since Petition (buckets)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={c.daysSincePetitionHist}
                onClick={(e: any) => {
                  const bucket = e?.activeLabel || e?.activePayload?.[0]?.payload?.bucket;
                  if (bucket) onDaysSincePetitionClick(bucket);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={PALETTE.med} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Death → Petition Delay (days)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={c.daysDeathToPetitionHist}
                onClick={(e: any) => {
                  const bucket = e?.activeLabel || e?.activePayload?.[0]?.payload?.bucket;
                  if (bucket) onDeathToPetitionClick(bucket);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={PALETTE.purple} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Filings by Month" subtitle="Click a month to filter">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={c.filingsByMonth}
                onClick={(e:any) => e?.activeLabel && onMonthClick?.(e.activeLabel)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={PALETTE.high} strokeWidth={3} dot />
                <Brush height={20} travellerWidth={10} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Petition Types" subtitle="Click a bar to filter">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={c.petitionTypes}
                onClick={(e:any) => {
                  const pt = e?.activeLabel || e?.activePayload?.[0]?.payload?.petition_type;
                  if (pt) onPetitionTypeClick?.(pt);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="petition_type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={PALETTE.accent} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* -------- VALUE & CLASS -------- */}
      {tab === "value" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card title="Property Value Distribution (buy-box)" subtitle="Click a bucket to filter">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={c.valueHist}
                onClick={(e:any) => {
                  const bucket = e?.activeLabel || e?.activePayload?.[0]?.payload?.bucket;
                  if (!bucket) return;
                  const [low, high] = bucketToRange(bucket);
                  onValueBucket?.(low, high);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                {t && <ReferenceArea x1="100–250k" x2="500k–1M" fill={PALETTE.success} fillOpacity={0.1} label="$150k–$450k" />}
                <Bar dataKey="count" fill={PALETTE.high} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Property Class Mix">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie 
                data={c.propertyClassMix} 
                dataKey="count" 
                nameKey="property_class" 
                innerRadius={55} 
                outerRadius={95} 
                label
                onClick={(_, idx) => {
                    const pc = c.propertyClassMix[idx]?.property_class;
                    if (pc) onPropertyClassClick(pc);
                  }}
                >
                  {c.propertyClassMix.map((_, i) => {
                    const palette = [PALETTE.high, PALETTE.med, PALETTE.absentee, PALETTE.purple, PALETTE.pink];
                    return <Cell key={i} fill={palette[i % palette.length]} />;
                  })}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Top Parties by Holdings">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={c.holdingsTopParties}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="party" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="holdings" fill={PALETTE.absentee} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* -------- Quick actions -------- */}
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          onClick={() => onAbsenteeOnly?.()}
        >
          Show Absentee Only
        </button>
        <button
          className={`px-3 py-1.5 rounded-full ${filters?.has_value ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
          onClick={onHasValue}
        >
          Show Only With Value
        </button>
      </div>

      {/* -------- Shortlist (from backend; already filtered) -------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Shortlist</h3>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm text-sm font-medium disabled:opacity-60"
              onClick={handleDownload}
              disabled={shortlistLoading}
              style={{ minWidth: 0 }}
              title="Download shortlist as CSV"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Download CSV</span>
            </button>
            <Pager />
          </div>
        </div>
        <Shortlist rows={shortlist} loading={!!shortlistLoading} sort={sort} onSortChange={onSortChange} />
        <Pager />
      </div>
    </div>
  );
}

// minimalist shortlist table
function Shortlist({ rows, loading, sort, onSortChange }: { rows: RecordRow[]; loading?: boolean; sort: { column: string; direction: "asc" | "desc" }[]; onSortChange: (sort: { column: string; direction: "asc" | "desc" }[]) => void; }) {
  // Map display header to data key
  const columns = [
    { label: "Score", key: "score" },
    { label: "Tier", key: "tier" },
    { label: "County", key: "county" },
    { label: "Case", key: "case_no" },
    { label: "Owner", key: "owner_name" },
    { label: "Address", key: "property_address" },
    { label: "City", key: "city" },
    { label: "Value", key: "property_value_2025" },
    { label: "Petition Date", key: "petition_date" },
    { label: "Absentee", key: "absentee_flag" },
    { label: "Parcel", key: "parcel_number" },
    { label: "qPublic", key: "qpublic_report_url" },
    { label: "Why", key: "rationale" },
  ];

  // Handle header click for multi-sort
  function handleSort(colKey: string) {
    const idx = sort.findIndex(s => s.column === colKey);
    let nextSort: { column: string; direction: "asc" | "desc" }[];
    if (idx === -1) {
      // Add as primary sort asc
      nextSort = [{ column: colKey, direction: "asc" }, ...sort];
    } else {
      // Toggle direction or remove
      const curr = sort[idx];
      if (curr.direction === "asc") {
        nextSort = [...sort];
        nextSort[idx] = { ...curr, direction: "desc" as const };
      } else {
        // Remove from sort
        nextSort = sort.filter((_, i) => i !== idx);
      }
    }
    onSortChange(nextSort);
  }

  // Helper to get arrow and sort order
  function sortIndicator(colKey: string) {
    const idx = sort.findIndex(s => s.column === colKey);
    if (idx === -1) return null;
    const arrow = sort[idx].direction === "asc" ? "▲" : "▼";
    return <span className="ml-1 text-xs">{arrow}{sort.length > 1 ? <sup>{idx+1}</sup> : null}</span>;
  }

  return (
    <div className="relative overflow-auto border rounded-2xl bg-white">
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-gray-600">Loading…</div>
      )}
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {columns.map(col => (
              <th key={col.key}
                  className="px-3 py-2 text-left font-semibold cursor-pointer select-none hover:bg-indigo-50"
                  onClick={() => handleSort(col.key)}>
                {col.label} {sortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              <td className="px-3 py-2 font-semibold">{r.score ?? ""}</td>
              <td className="px-3 py-2 capitalize">{r.tier ?? ""}</td>
              <td className="px-3 py-2">{r.county}</td>
              <td className="px-3 py-2">{r.case_no}</td>
              <td className="px-3 py-2">{r.owner_name}</td>
              <td className="px-3 py-2">{r.property_address}</td>
              <td className="px-3 py-2">{r.city}</td>
              <td className="px-3 py-2">{r.property_value_2025 ? `$${(r.property_value_2025).toLocaleString()}` : ""}</td>
              <td className="px-3 py-2">{r.petition_date}</td>
              <td className="px-3 py-2">{r.absentee_flag === undefined ? "" : (r.absentee_flag ? "Yes" : "No")}</td>
              <td className="px-3 py-2">{r.parcel_number ?? ""}</td>
              <td className="px-3 py-2">{r.qpublic_report_url ? <a className="text-indigo-600 underline" href={r.qpublic_report_url} target="_blank" rel="noreferrer">Link</a> : ""}</td>
              <td className="px-3 py-2 max-w-[360px]">{r.rationale ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
