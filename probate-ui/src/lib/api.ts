// src/lib/api.ts
import type { AnalyzeResponse, PrelimResponse } from "../types";

const RAW = (import.meta.env.VITE_API_BASE || "").trim();
const API_BASE = RAW.replace(/\/$/, ""); // strip trailing slash
const makeUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : `/api${path}`);

// ---------- Analyze & Upload ----------
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

// ---------- Dashboard fetch ----------
type KPIsResp = { kpis: { label:string; value: string|number }[] };
type PropClassResp = { propertyClassMix: { property_class:string; count:number }[] };
type CountyCountResp = { countByCounty: { county:string; count:number }[] };
type CountyAvgValObj = { averageValueByCounty: { county:string; average_value:number }[] };
type DaysSinceResp = { daysSincePetitionHist: { bin:string; count:number }[] };
type DaysDeathResp = { daysDeathToPetitionHist: { bin:string; count:number }[] };
type PetitionTypesResp = { petitionTypes: { petition_type:string; count:number }[] };
type PartiesResp = { parties: { party:string; count:number }[] };

function qs(params?: Record<string, string | number | boolean | (string|number)[] | undefined>) {
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
  const url = makeUrl(path) + qs(params);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function fetchDashboard(params?: Record<string, any>): Promise<PrelimResponse> {
  const [
    kpis,
    propertyClassMix,
    countByCounty,
    avgValRaw,
    daysSince,
    daysDeath,
    petitionTypes,
    parties,
  ] = await Promise.all([
    getJSON<KPIsResp>("/charts/kpis", params),
    getJSON<PropClassResp>("/charts/property-class-mix", params),
    getJSON<CountyCountResp>("/charts/count-by-county", params),
    getJSON<CountyAvgValObj | CountyAvgValObj[]>("/charts/average-value-by-county", params),
    getJSON<DaysSinceResp>("/charts/binned-days-since-petition", params),
    getJSON<DaysDeathResp>("/charts/binned-days-petition-to-death", params),
    getJSON<PetitionTypesResp>("/charts/petition-types", params),
    getJSON<PartiesResp>("/charts/get-parties", params),
  ]);

  const avgObj = Array.isArray(avgValRaw) ? avgValRaw[0] : avgValRaw;
  const valueByCounty = (avgObj?.averageValueByCounty ?? []).map(d => ({
    county: d.county,
    median_value: d.average_value,
  }));

  return {
    kpis: kpis.kpis,
    charts: {
      absenteeByCounty: countByCounty.countByCounty.map(d => ({ county: d.county, absentee: d.count, local: 0 })),
      daysSincePetitionHist: daysSince.daysSincePetitionHist.map(d => ({ bucket: d.bin, count: d.count })),
      daysDeathToPetitionHist: daysDeath.daysDeathToPetitionHist.map(d => ({ bucket: d.bin, count: d.count })),
      valueByCounty,
      petitionTypes: petitionTypes.petitionTypes,
      propertyClassMix: propertyClassMix.propertyClassMix,
      holdingsTopParties: parties.parties.map(p => ({ party: p.party, holdings: p.count })),
      valueHist: [],
      filingsByMonth: [],
      filingsByMonthTiered: [],
      absenteeRateTrend: [],
    },
    thresholds: {
      absenteeRateTarget: 0.6,
      buyboxValueMin: 150000,
      buyboxValueMax: 450000,
    },
    shortlist: [],
  };
}
