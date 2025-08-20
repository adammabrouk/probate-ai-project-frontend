import { useMemo, useState } from "react";
import type { PrelimResponse, RecordRow } from "../types";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceArea, ReferenceLine, Brush, PieChart, Pie, Cell,
} from "recharts";

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

const KPIBar = ({ items }: { items: PrelimResponse["kpis"] }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {items.map((k) => (
      <div key={k.label} className="rounded-2xl border border-gray-200 shadow-sm p-4 bg-white">
        <div className="text-xs text-gray-500">{k.label}</div>
        <div className="text-3xl font-bold mt-1">{k.value}</div>
        {k.hint && <div className="text-[11px] text-gray-500">{k.hint}</div>}
      </div>
    ))}
  </div>
);

// ---------- filter (drill-down) state ----------
type Filters = {
  county?: string;
  month?: string;          // YYYY-MM
  petitionType?: string;
  tier?: "high" | "med" | "low";
};

const FilterChips = ({ f, onClear, onRemove }: {
  f: Filters; onClear: () => void; onRemove: (key: keyof Filters) => void;
}) => {
  const chips: Array<[keyof Filters, string]> = [];
  if (f.county) chips.push(["county", `County: ${f.county}`]);
  if (f.month) chips.push(["month", `Month: ${f.month}`]);
  if (f.petitionType) chips.push(["petitionType", `Type: ${f.petitionType}`]);
  if (f.tier) chips.push(["tier", `Tier: ${f.tier}`]);
  if (!chips.length) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map(([k, label]) => (
        <span key={k} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">
          {label}
          <button onClick={() => onRemove(k)} className="hover:text-indigo-900">×</button>
        </span>
      ))}
      <button onClick={onClear} className="text-xs text-gray-600 underline">Clear all</button>
    </div>
  );
};

// ---------- helpers to filter shortlist on the client (mocked data) ----------
function applyFilters(rows: RecordRow[], f: Filters): RecordRow[] {
  return rows.filter(r => {
    if (f.county && r.county !== f.county) return false;
    if (f.month && r.petition_date?.slice(0, 7) !== f.month) return false;
    if (f.petitionType && r.petition_type !== f.petitionType) return false;
    if (f.tier && r.tier !== f.tier) return false;
    return true;
  });
}

// ---------- main component ----------
export default function PrelimAnalysis({ data }: { data: PrelimResponse }) {
  const { charts: c, thresholds: t } = data;
  const [tab, setTab] = useState<"overview" | "counties" | "timing" | "value">("overview");
  const [filters, setFilters] = useState<Filters>({});
  const clearAll = () => setFilters({});
  const removeKey = (k: keyof Filters) => setFilters({ ...filters, [k]: undefined });

  // Filtered shortlist (drill-down target)
  const shortlist = useMemo(() => applyFilters(data.shortlist, filters), [data.shortlist, filters]);

  // Derived lines for stacked/threshold visuals
  const absenteeStackOverTime = useMemo(() => {
    // synthesize absentee vs local trend from absenteeRateTrend and filingsByMonth
    const byMonth = new Map(c.filingsByMonth.map(d => [d.month, d.count]));
    return c.absenteeRateTrend.map(d => {
      const total = byMonth.get(d.month) ?? 0;
      const abs = Math.round(total * d.rate);
      return { month: d.month, absentee: abs, local: Math.max(0, total - abs) };
    });
  }, [c.absenteeRateTrend, c.filingsByMonth]);

  // ---------- page ----------
  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Probate Preliminary Analysis</h1>
        <p className="text-sm text-gray-500">Guided drill-downs • stacked area focus • buy-box overlays</p>
      </div>

      <KPIBar items={data.kpis} />

      {/* filters breadcrumb */}
      <FilterChips f={filters} onClear={clearAll} onRemove={removeKey} />

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
                onClick={(e: any) => e?.activeLabel && setFilters(f => ({ ...f, month: e.activeLabel }))}
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

          <Card title="Absentee vs Local Over Time (stacked area)" subtitle="Target absentee rate line">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={absenteeStackOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {t && (
                  <ReferenceLine
                    y={(c.filingsByMonth[0]?.count ?? 100) * t.absenteeRateTarget}
                    stroke={PALETTE.warn} strokeDasharray="4 4" label="Target"
                  />
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
          <Card title="Absentee vs Local by County (stacked bar)" subtitle="Click a county to filter the shortlist">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={c.absenteeByCounty}
                onClick={(e: any) => e?.activeLabel && setFilters(f => ({ ...f, county: e.activeLabel }))}
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
              <BarChart data={c.valueByCounty}>
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
          <Card title="Days Since Petition (buckets)" subtitle="Shaded band shows ideal 30–180 days">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={c.daysSincePetitionHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                {t && (
                  <ReferenceArea x1="31–60" x2="181–365" fill={PALETTE.accent} fillOpacity={0.1} label="Ideal window" />
                )}
                <Bar dataKey="count" fill={PALETTE.med} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Death → Petition Delay (days)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={c.daysDeathToPetitionHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={PALETTE.purple} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Filings by Month">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={c.filingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={PALETTE.high} strokeWidth={3} dot />
                <Brush height={20} travellerWidth={10} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Petition Types (click to filter)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={c.petitionTypes}
                onClick={(e: any) => e?.activeLabel && setFilters(f => ({ ...f, petitionType: e.activeLabel }))}
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
          <Card title="Property Value Distribution (buy-box)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={c.valueHist}>
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
                <Pie data={c.propertyClassMix} dataKey="count" nameKey="property_class" innerRadius={55} outerRadius={95} label>
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

      {/* -------- Shortlist (always visible) -------- */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Shortlist (reflects filters)</h3>
        <Shortlist rows={shortlist} />
      </div>
    </div>
  );
}

// minimalist shortlist table
function Shortlist({ rows }: { rows: RecordRow[] }) {
  return (
    <div className="overflow-auto border rounded-2xl bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {["Score","Tier","County","Case","Owner","Address","City","Value","Petition Date","Absentee","Parcel","qPublic","Why"].map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
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
              <td className="px-3 py-2">{r.absentee_flag ? "Yes" : "No"}</td>
              <td className="px-3 py-2">{r.parcel_number ?? ""}</td>
              <td className="px-3 py-2">{r.qpublic_report_url ? <a className="text-indigo-600 underline" href={r.qpublic_report_url} target="_blank">Link</a> : ""}</td>
              <td className="px-3 py-2 max-w-[360px]">{r.rationale ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
