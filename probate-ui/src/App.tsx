// src/App.tsx
import { useEffect, useState, useCallback } from "react";
import PrelimAnalysis from "./components/PrelimAnalysis";
import type { PrelimResponse, RecordRow } from "./types";
import { fetchKPIsAndThresholds, fetchChartsData, fetchShortlist } from "./lib/api";
import type { Filters } from "./lib/filters";
import { LoadingSpinner } from "./components/LoadingSpinner";

export default function App() {
  // KPIs and thresholds (load first for immediate feedback)
  const [kpisData, setKpisData] = useState<{ kpis: { label: string; value: string | number }[]; thresholds: { absenteeRateTarget: number; buyboxValueMin: number; buyboxValueMax: number } } | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(false);
  
  // Charts data (load separately)
  const [chartsData, setChartsData] = useState<PrelimResponse['charts'] | null>(null);
  const [loadingCharts, setLoadingCharts] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<Filters>({});
  
  // Shortlist paginated (load separately)
  const [shortlist, setShortlist] = useState<RecordRow[]>([]);
  const [slMeta, setSlMeta] = useState<{ total:number; page:number; page_size:number; total_pages:number; has_next:boolean; has_prev:boolean } | null>(null);
  const [loadingSL, setLoadingSL] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" }[]>([]);

  // Load KPIs (fastest loading, shows immediate feedback)
  const loadKpis = useCallback(async () => {
    setLoadingKpis(true);
    try { 
      setKpisData(await fetchKPIsAndThresholds(filters)); 
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    } finally { 
      setLoadingKpis(false); 
    }
  }, [filters]);

  // Load charts data (separate from KPIs for better UX)
  const loadCharts = useCallback(async () => {
    setLoadingCharts(true);
    try { 
      setChartsData(await fetchChartsData(filters)); 
    } catch (error) {
      console.error('Failed to load charts:', error);
    } finally { 
      setLoadingCharts(false); 
    }
  }, [filters]);

  // Load shortlist page (separate and paginated)
  const loadShortlist = useCallback(async () => {
    setLoadingSL(true);
    try {
      // Map frontend sort keys to backend keys
      const sortKeyMap: Record<string, string> = { property_value_2025: "property_value" };
      const sortParam = sort
        .map(s => `${sortKeyMap[s.column] || s.column}:${s.direction}`)
        .join(",");
      const { shortlist, meta } = await fetchShortlist({ ...filters, sort: sortParam }, page, pageSize);
      setShortlist(shortlist);
      setSlMeta(meta);
    } catch (error) {
      console.error('Failed to load shortlist:', error);
    } finally { 
      setLoadingSL(false); 
    }
  }, [filters, page, sort]);

  const clearFilter = (key: keyof Filters) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Add a filter for 'has_value'
  const toggleHasValue = () => {
    setFilters(prev => {
      const next = { ...prev };
      if (next.has_value) delete next.has_value;
      else next.has_value = true;
      return next;
    });
  };

  // Load data on mount and when filters change
  useEffect(() => { loadKpis(); }, [loadKpis]);
  useEffect(() => { loadCharts(); }, [loadCharts]);
  useEffect(() => { loadShortlist(); }, [loadShortlist]);

  // Whenever filters or sort change, reset to page 1
  useEffect(() => { setPage(1); }, [filters, sort]);

  // Combine data for PrelimAnalysis component
  const data: PrelimResponse | null = kpisData && chartsData ? {
    kpis: kpisData.kpis,
    charts: chartsData,
    thresholds: kpisData.thresholds,
    shortlist: [] // shortlist is handled separately
  } : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with loading indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Probate Analysis Dashboard</h1>
        {(loadingKpis || loadingCharts || loadingSL) && (
          <div className="flex items-center text-sm text-gray-600">
            <LoadingSpinner size="sm" className="mr-2" />
            Loading...
          </div>
        )}
      </div>

      {/* Active filter chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(filters).map(([k,v]) => (
          <button key={k} onClick={() => clearFilter(k as keyof Filters)}
                  className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors">
            {k}: {Array.isArray(v) ? v.join(", ") : String(v)} ×
          </button>
        ))}
        {Object.keys(filters).length > 0 && (
          <button onClick={() => setFilters({})} className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">Clear all</button>
        )}
      </div>

      {/* Dashboard */}
      {data ? (
        <PrelimAnalysis
          data={data}
          shortlist={shortlist}
          shortlistMeta={slMeta || undefined}
          shortlistLoading={loadingSL}
          chartsLoading={loadingCharts}
          onShortlistPageChange={setPage}
          sort={sort}
          onSortChange={setSort}
          filters={filters}
          // interactive filters:
          onCountyClick={(county) => setFilters(prev => ({ ...prev, counties: [county] }))}
          onMonthClick={(ym) => setFilters(prev => ({ ...prev, month_from: ym, month_to: ym }))}
          onPetitionTypeClick={(pt) => setFilters(prev => ({ ...prev, petition_types: [pt] }))}
          onAbsenteeOnly={() => setFilters(prev => ({ ...prev, absentee_only: true }))}
          onValueBucket={(low, high) => setFilters(prev => ({ ...prev, min_value: low, max_value: high }))}
          onPropertyClassClick={(property_class) => setFilters(prev => ({ ...prev, property_class }))}
          onDaysSincePetitionRange={(min, max) => setFilters(prev => ({ ...prev, days_since_petition_min: min, days_since_petition_max: max }))}
          onDeathToPetitionRange={(min, max) => setFilters(prev => ({ ...prev, days_death_to_petition_min: min, days_death_to_petition_max: max }))}
          onHasValue={toggleHasValue}
        />
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
