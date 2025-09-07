// src/lib/api.ts
import type { AnalyzeResponse, PrelimResponse, RecordRow } from "../types";

const RAW = (import.meta.env.VITE_API_BASE || "").trim();
const API_BASE = RAW.replace(/\/$/, "");
const makeUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : `/api${path}`);

function qs(params?: Record<string, string | number | boolean | (string | number)[] | undefined>) {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v)) v.forEach(x => sp.append(k, String(x)));
    else sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function getJSON<T>(path: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch(makeUrl(path) + qs(params));
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// ---------- File APIs (unchanged) ----------
export async function analyzeFile(file: File, maxRecords = 200): Promise<AnalyzeResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(makeUrl(`/analyze?max_records=${maxRecords}`), { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Analyze failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function uploadFile(file: File): Promise<void> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(makeUrl(`/upload`), { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Ingest failed (${res.status}): ${await res.text()}`);
}

// ---------- Dashboard fetch (uses your new endpoints) ----------

type KPIsResp = { kpis: { label: string; value: string | number }[] };
type PropClassResp = { propertyClassMix: { property_class: string; count: number }[] };
type CountyAvgValObj = { averageValueByCounty: { county: string; average_value: number }[] };
type DaysSinceResp = { daysSincePetitionHist: { bin: string; count: number }[] };
type DaysDeathResp = { daysDeathToPetitionHist: { bin: string; count: number }[] };
type PetitionTypesResp = { petitionTypes: { petition_type: string; count: number }[] };
type PartiesResp = { parties: { party: string; count: number }[] };
type ValueHistResp = { valueHist: { bucket: string; count: number }[] };
type FilingsByMonthResp = { filingsByMonth: { month: string; count: number }[] };
type FilingsTieredResp = { filingsByMonthTiered: { month: string; high: number; med: number; low: number }[] };
type AbsRateResp = { absenteeRateTrend: { month: string; rate: number }[] };
type AbsByCountyResp = { absenteeByCounty: { county: string; absentee: number; local: number }[] };
type ShortlistResp = { shortlist: RecordRow[] };

// Separate function to fetch only KPIs and basic dashboard data (no charts)
export async function fetchKPIsAndThresholds(params?: Record<string, any>): Promise<{ kpis: { label: string; value: string | number }[]; thresholds: { absenteeRateTarget: number; buyboxValueMin: number; buyboxValueMax: number } }> {
  const kpis = await getJSON<KPIsResp>("/charts/kpis", params);
  
  return {
    kpis: kpis.kpis,
    thresholds: {
      absenteeRateTarget: 0.6,
      buyboxValueMin: 150000,
      buyboxValueMax: 450000,
    },
  };
}

// Separate function to fetch only charts data
export async function fetchChartsData(params?: Record<string, any>): Promise<PrelimResponse['charts']> {
  const [
    propertyClassMix,
    avgValRaw,
    daysSince,
    daysDeath,
    petitionTypes,
    parties,
    valueHist,
    filingsByMonth,
    filingsTiered,
    absRate,
    absByCounty,
  ] = await Promise.all([
    getJSON<PropClassResp>("/charts/property-class-mix", params),
    getJSON<CountyAvgValObj | CountyAvgValObj[]>("/charts/average-value-by-county", params),
    getJSON<DaysSinceResp>("/charts/binned-days-since-petition", params),
    getJSON<DaysDeathResp>("/charts/binned-days-petition-to-death", params),
    getJSON<PetitionTypesResp>("/charts/petition-types", params),
    getJSON<PartiesResp>("/charts/get-parties", params),
    getJSON<ValueHistResp>("/charts/value-hist", params),
    getJSON<FilingsByMonthResp>("/charts/filings-by-month", params),
    // If you haven't implemented this yet, you can remove this call or keep it and guard-render in UI
    // getJSON<FilingsTieredResp>("/charts/filings-by-month-tiered", params),
    Promise.resolve({ filingsByMonthTiered: [] } as FilingsTieredResp),
    getJSON<AbsRateResp>("/charts/absentee-rate-trend", params),
    getJSON<AbsByCountyResp>("/charts/absentee-by-county", params),
  ]);

  // average-value-by-county: your backend sometimes returns `[ { averageValueByCounty: [...] } ]`
  const avgObj = Array.isArray(avgValRaw) ? avgValRaw[0] : avgValRaw;
  const valueByCounty = (avgObj?.averageValueByCounty ?? []).map(d => ({
    county: d.county,
    median_value: d.average_value, // naming for chart; value is avg for now
  }));

  return {
    absenteeByCounty: absByCounty.absenteeByCounty,
    daysSincePetitionHist: daysSince.daysSincePetitionHist.map(d => ({ bucket: d.bin, count: d.count })),
    daysDeathToPetitionHist: daysDeath.daysDeathToPetitionHist.map(d => ({ bucket: d.bin, count: d.count })),
    valueByCounty,
    valueHist: valueHist.valueHist,
    filingsByMonth: filingsByMonth.filingsByMonth,
    filingsByMonthTiered: filingsTiered.filingsByMonthTiered,
    absenteeRateTrend: absRate.absenteeRateTrend,
    petitionTypes: petitionTypes.petitionTypes,
    propertyClassMix: propertyClassMix.propertyClassMix,
    holdingsTopParties: parties.parties.map(p => ({ party: p.party, holdings: p.count })),
  };
}

export async function fetchDashboard(params?: Record<string, any>): Promise<PrelimResponse> {
  const [
    kpis,
    propertyClassMix,
    avgValRaw,
    daysSince,
    daysDeath,
    petitionTypes,
    parties,
    valueHist,
    filingsByMonth,
    filingsTiered,
    absRate,
    absByCounty,
    shortlist,
  ] = await Promise.all([
    getJSON<KPIsResp>("/charts/kpis", params),
    getJSON<PropClassResp>("/charts/property-class-mix", params),
    getJSON<CountyAvgValObj | CountyAvgValObj[]>("/charts/average-value-by-county", params),
    getJSON<DaysSinceResp>("/charts/binned-days-since-petition", params),
    getJSON<DaysDeathResp>("/charts/binned-days-petition-to-death", params),
    getJSON<PetitionTypesResp>("/charts/petition-types", params),
    getJSON<PartiesResp>("/charts/get-parties", params),
    getJSON<ValueHistResp>("/charts/value-hist", params),
    getJSON<FilingsByMonthResp>("/charts/filings-by-month", params),
    // If you haven’t implemented this yet, you can remove this call or keep it and guard-render in UI
    // getJSON<FilingsTieredResp>("/charts/filings-by-month-tiered", params),
    Promise.resolve({ filingsByMonthTiered: [] } as FilingsTieredResp),
    getJSON<AbsRateResp>("/charts/absentee-rate-trend", params),
    getJSON<AbsByCountyResp>("/charts/absentee-by-county", params),
    getJSON<ShortlistResp>("/shortlist", params),
  ]);

  // average-value-by-county: your backend sometimes returns `[ { averageValueByCounty: [...] } ]`
  const avgObj = Array.isArray(avgValRaw) ? avgValRaw[0] : avgValRaw;
  const valueByCounty = (avgObj?.averageValueByCounty ?? []).map(d => ({
    county: d.county,
    median_value: d.average_value, // naming for chart; value is avg for now
  }));

  

  return {
    kpis: kpis.kpis, // contains your new "Absentee %" KPI

    charts: {
      absenteeByCounty: absByCounty.absenteeByCounty,
      daysSincePetitionHist: daysSince.daysSincePetitionHist.map(d => ({ bucket: d.bin, count: d.count })),
      daysDeathToPetitionHist: daysDeath.daysDeathToPetitionHist.map(d => ({ bucket: d.bin, count: d.count })),
      valueByCounty,
      valueHist: valueHist.valueHist,
      filingsByMonth: filingsByMonth.filingsByMonth,
      filingsByMonthTiered: filingsTiered.filingsByMonthTiered,
      absenteeRateTrend: absRate.absenteeRateTrend,
      petitionTypes: petitionTypes.petitionTypes,
      propertyClassMix: propertyClassMix.propertyClassMix,
      holdingsTopParties: parties.parties.map(p => ({ party: p.party, holdings: p.count })),
    },

    thresholds: {
      absenteeRateTarget: 0.6,
      buyboxValueMin: 150000,
      buyboxValueMax: 450000,
    },

    shortlist: shortlist.shortlist || [],
  };
}

export type ShortlistMeta = {
  total: number; page: number; page_size: number; total_pages: number;
  has_next: boolean; has_prev: boolean;
};

export async function fetchShortlist(params: Record<string, any>, page = 1, pageSize = 25): Promise<{ shortlist: RecordRow[]; meta: ShortlistMeta }> {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v)) v.forEach(x => sp.append(k, String(x)));
    else sp.append(k, String(v));
  });
  sp.set("page", String(page));
  sp.set("page_size", String(pageSize));
  const res = await fetch(makeUrl(`/shortlist?${sp.toString()}`));
  if (!res.ok) throw new Error(`shortlist failed (${res.status}): ${await res.text()}`);
  return res.json();
}
