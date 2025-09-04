// src/App.tsx
import { useEffect, useState, useCallback } from "react";
import PrelimAnalysis from "./components/PrelimAnalysis";
import type { PrelimResponse } from "./types";
import { fetchDashboard } from "./lib/api";
import type { Filters } from "./lib/filters";

export default function App() {
  const [data, setData] = useState<PrelimResponse | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchDashboard(filters)); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const clearFilter = (key: keyof Filters) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      {/* Active filter chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(filters).map(([k,v]) => (
          <button key={k} onClick={() => clearFilter(k as keyof Filters)}
                  className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {k}: {Array.isArray(v) ? v.join(", ") : String(v)} ×
          </button>
        ))}
        {Object.keys(filters).length > 0 && (
          <button onClick={() => setFilters({})} className="px-3 py-1 rounded-full bg-gray-100">Clear all</button>
        )}
      </div>

      {/* Dashboard */}
      {loading && <div>Loading…</div>}
      {data && (
        <PrelimAnalysis
          data={data}
          onCountyClick={(county) => setFilters(prev => ({ ...prev, counties: [county] }))}
          onPetitionTypeClick={(pt) => setFilters(prev => ({ ...prev, petition_types: [pt] }))}
          onMonthClick={(ym) => setFilters(prev => ({ ...prev, month_from: ym, month_to: ym }))}
          onAbsenteeOnly={() => setFilters(prev => ({ ...prev, absentee_only: true }))}
          onValueBucket={(low?: number, high?: number) => setFilters(prev => ({ ...prev, min_value: low, max_value: high }))}
        />
      )}
    </div>
  );
}
