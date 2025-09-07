// src/App.tsx
import { useEffect, useState, useCallback } from "react";
import PrelimAnalysis from "./components/PrelimAnalysis";
import Dropzone from "./components/Dropzone";
import type { PrelimResponse, RecordRow } from "./types";
import { 
  fetchKPIsAndThresholds, 
  fetchShortlist,
  fetchPropertyClassMix,
  fetchAverageValueByCounty,
  fetchDaysSincePetition,
  fetchDaysDeathToPetition,
  fetchPetitionTypes,
  fetchParties,
  fetchValueHist,
  fetchFilingsByMonth,
  fetchAbsenteeRateTrend,
  fetchAbsenteeByCounty,
  uploadFile
} from "./lib/api";
import type { Filters } from "./lib/filters";
import { LoadingSpinner } from "./components/LoadingSpinner";

export default function App() {
  // KPIs and thresholds (load first for immediate feedback)
  const [kpisData, setKpisData] = useState<{ kpis: { label: string; value: string | number }[]; thresholds: { absenteeRateTarget: number; buyboxValueMin: number; buyboxValueMax: number } } | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(false);
  
  // Individual chart data states
  const [chartData, setChartData] = useState<Partial<PrelimResponse['charts']>>({});
  const [chartLoading, setChartLoading] = useState<Record<string, boolean>>({});
  
  // Filters state
  const [filters, setFilters] = useState<Filters>({});
  
  // Shortlist paginated (load separately)
  const [shortlist, setShortlist] = useState<RecordRow[]>([]);
  const [slMeta, setSlMeta] = useState<{ total:number; page:number; page_size:number; total_pages:number; has_next:boolean; has_prev:boolean } | null>(null);
  const [loadingSL, setLoadingSL] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" }[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadMsg(null);
    try {
      await uploadFile(file);
      setUploadMsg("Upload successful! Data will be available after refresh.");
      // Optionally reload data here
    } catch (e: any) {
      setUploadMsg("Upload failed: " + (e?.message || e));
    } finally {
      setUploading(false);
    }
  };

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

  // Individual chart loaders
  const loadChart = useCallback(async (chartName: string, fetchFn: Function, transform?: Function) => {
    setChartLoading(prev => ({ ...prev, [chartName]: true }));
    try {
      const data = await fetchFn(filters);
      console.log(`Chart ${chartName} data:`, data); // Debug log
      const transformedData = transform ? transform(data) : data;
      console.log(`Chart ${chartName} transformed:`, transformedData); // Debug log
      setChartData(prev => ({ 
        ...prev, 
        [chartName]: transformedData 
      }));
    } catch (error) {
      console.error(`Failed to load ${chartName}:`, error);
    } finally {
      setChartLoading(prev => ({ ...prev, [chartName]: false }));
    }
  }, [filters]);

  const loadAllCharts = useCallback(() => {
    // Load all charts independently
    loadChart('propertyClassMix', fetchPropertyClassMix, (data: any) => data.propertyClassMix);
    
    loadChart('valueByCounty', fetchAverageValueByCounty, (data: any) => {
      const avgObj = Array.isArray(data) ? data[0] : data;
      return (avgObj?.averageValueByCounty ?? []).map((d: any) => ({
        county: d.county,
        median_value: d.average_value,
      }));
    });
    
    loadChart('daysSincePetitionHist', fetchDaysSincePetition, (data: any) => 
      data.daysSincePetitionHist.map((d: any) => ({ bucket: d.bin, count: d.count }))
    );
    
    loadChart('daysDeathToPetitionHist', fetchDaysDeathToPetition, (data: any) =>
      data.daysDeathToPetitionHist.map((d: any) => ({ bucket: d.bin, count: d.count }))
    );
    
    loadChart('petitionTypes', fetchPetitionTypes, (data: any) => data.petitionTypes);
    
    loadChart('holdingsTopParties', fetchParties, (data: any) => 
      data.parties.map((p: any) => ({ party: p.party, holdings: p.count }))
    );
    
    loadChart('valueHist', fetchValueHist, (data: any) => data.valueHist);
    loadChart('filingsByMonth', fetchFilingsByMonth, (data: any) => data.filingsByMonth);
    loadChart('absenteeRateTrend', fetchAbsenteeRateTrend, (data: any) => data.absenteeRateTrend);
    loadChart('absenteeByCounty', fetchAbsenteeByCounty, (data: any) => data.absenteeByCounty);
    
    // Add mock data for filingsByMonthTiered since it's not implemented
    setChartData(prev => ({ ...prev, filingsByMonthTiered: [] }));
  }, [loadChart]);

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
  useEffect(() => { loadAllCharts(); }, [loadAllCharts]);
  useEffect(() => { loadShortlist(); }, [loadShortlist]);

  // Whenever filters or sort change, reset to page 1
  useEffect(() => { setPage(1); }, [filters, sort]);

  // Combine data for PrelimAnalysis component
  const data: PrelimResponse | null = kpisData ? {
    kpis: kpisData.kpis,
    charts: chartData as PrelimResponse['charts'],
    thresholds: kpisData.thresholds,
    shortlist: [] // shortlist is handled separately
  } : null;

  // Debug log the combined data
  console.log('Combined data for PrelimAnalysis:', data);
  console.log('Chart data state:', chartData);
  console.log('Chart loading state:', chartLoading);

  const anyChartsLoading = Object.values(chartLoading).some(loading => loading);
  const loadingCount = Object.values(chartLoading).filter(loading => loading).length;
  const totalCharts = Object.keys(chartLoading).length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Upload Button and Modal */}
      <div className="flex justify-end mb-4">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition-colors"
          onClick={() => setShowUpload(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
          Upload CSV/XLSX
        </button>
      </div>
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowUpload(false)}
              aria-label="Close upload dialog"
            >×</button>
            <h2 className="text-xl font-semibold mb-4">Upload CSV/XLSX File</h2>
            <Dropzone onFile={handleUpload} disabled={uploading} />
            {uploading && <div className="text-sm text-gray-600 mt-2">Uploading...</div>}
            {uploadMsg && <div className="text-sm mt-2" style={{ color: uploadMsg.startsWith('Upload successful') ? 'green' : 'red' }}>{uploadMsg}</div>}
          </div>
        </div>
      )}

      {/* Header with loading indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Probate Analysis Dashboard</h1>
        {(loadingKpis || anyChartsLoading || loadingSL) && (
          <div className="flex items-center text-sm text-gray-600">
            <LoadingSpinner size="sm" className="mr-2" />
            {loadingKpis ? "Loading KPIs..." : 
             anyChartsLoading ? `Loading charts (${totalCharts - loadingCount}/${totalCharts} ready)` :
             loadingSL ? "Loading shortlist..." : "Loading..."}
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
          chartLoading={chartLoading}
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
