// src/lib/api.ts
import type { AnalyzeResponse, PrelimResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || ""; // keep proxy-friendly base

export async function analyzeFile(file: File, maxRecords = 200): Promise<AnalyzeResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const url = `${API_BASE}/api/analyze?max_records=${maxRecords}`;
  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Analyze failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function uploadFile(file: File): Promise<void> {
  const fd = new FormData();
  fd.append("file", file);
  const url = `${API_BASE}/api/upload`;
  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Ingest failed (${res.status}): ${await res.text()}`);
}

// ---------------- NEW: live dashboard fetch ----------------

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
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach(x => sp.append(k, String(x)));
    else sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function getJSON<T>(path: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch(`${API_BASE}/api/charts/${path}${qs(params)}`);
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
    getJSON<KPIsResp>("kpis", params),
    getJSON<PropClassResp>("property-class-mix", params),
    getJSON<CountyCountResp>("count-by-county", params),
    getJSON<CountyAvgValObj | CountyAvgValObj[]>("average-value-by-county", params),
    getJSON<DaysSinceResp>("binned-days-since-petition", params),
    getJSON<DaysDeathResp>("binned-days-petition-to-death", params),
    getJSON<PetitionTypesResp>("petition-types", params),
    getJSON<PartiesResp>("get-parties", params),
  ]);

  // Your /average-value-by-county currently returns an array with one object; normalize:
  const avgObj = Array.isArray(avgValRaw) ? avgValRaw[0] : avgValRaw;
  const valueByCounty = (avgObj?.averageValueByCounty ?? []).map(d => ({
    county: d.county,           // rename only
    median_value: d.average_value, // we’ll treat avg as “median_value” until you add real median
  }));

  return {
    kpis: kpis.kpis,
    charts: {
      // You don’t yet return “absentee vs local”; we’ll map count → absentee, local = 0 so charts still render.
      absenteeByCounty: countByCounty.countByCounty.map(d => ({ county: d.county, absentee: d.count, local: 0 })),
      daysSincePetitionHist: daysSince.daysSincePetitionHist.map(d => ({ bucket: d.bin, count: d.count })),
      daysDeathToPetitionHist: daysDeath.daysDeathToPetitionHist.map(d => ({ bucket: d.bin, count: d.count })),
      valueByCounty,
      petitionTypes: petitionTypes.petitionTypes,
      propertyClassMix: propertyClassMix.propertyClassMix,
      holdingsTopParties: parties.parties.map(p => ({ party: p.party, holdings: p.count })),
      // Not provided yet by backend — leave empty; UI will guard-render
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
    shortlist: [], // hook up your shortlist endpoint later if desired
  };
}
