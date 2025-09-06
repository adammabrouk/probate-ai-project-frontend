// src/App.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import PrelimAnalysis from "./components/PrelimAnalysis";
import type { PrelimResponse, RecordRow } from "./types";
import { fetchDashboard, fetchShortlist } from "./lib/api";
import type { Filters } from "./lib/filters";

export default function App() {
  const [data, setData] = useState<PrelimResponse | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [loadingDash, setLoadingDash] = useState(false);

  // shortlist paginated
  const [shortlist, setShortlist] = useState<RecordRow[]>([]);
  const [slMeta, setSlMeta] = useState<{ total:number; page:number; page_size:number; total_pages:number; has_next:boolean; has_prev:boolean } | null>(null);
  const [loadingSL, setLoadingSL] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // load dashboard
  const loadDash = useCallback(async () => {
    setLoadingDash(true);
    try { setData(await fetchDashboard(filters)); }
    finally { setLoadingDash(false); }
  }, [filters]);

  const clearFilter = (key: keyof Filters) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  
  // load shortlist page
  const loadShortlist = useCallback(async () => {
    setLoadingSL(true);
    try {
      const { shortlist, meta } = await fetchShortlist(filters as any, page, pageSize);
      setShortlist(shortlist);
      setSlMeta(meta);
    } finally { setLoadingSL(false); }
  }, [filters, page]);

  useEffect(() => { loadDash(); }, [loadDash]);
  useEffect(() => { loadShortlist(); }, [loadShortlist]);

  // Whenever filters change, reset to page 1
  useEffect(() => { setPage(1); }, [filters]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* header omitted for brevity (Upload, etc.) */}
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
      {(loadingDash || !data) ? <div>Loading dashboard…</div> : (
        <PrelimAnalysis
          data={data}
          shortlist={shortlist}
          shortlistMeta={slMeta || undefined}
          shortlistLoading={loadingSL}
          onShortlistPageChange={setPage}
          // interactive filters:
          onCountyClick={(county) => setFilters(prev => ({ ...prev, counties: [county] }))}
          onMonthClick={(ym) => setFilters(prev => ({ ...prev, month_from: ym, month_to: ym }))}
          onPetitionTypeClick={(pt) => setFilters(prev => ({ ...prev, petition_types: [pt] }))}
          onAbsenteeOnly={() => setFilters(prev => ({ ...prev, absentee_only: true }))}
          onValueBucket={(low, high) => setFilters(prev => ({ ...prev, min_value: low, max_value: high }))}
        />
      )}
    </div>
  );
}
