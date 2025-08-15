import type { AnalyzeResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || ""; // leave "" when using Vite proxy

export async function analyzeFile(file: File, maxRecords = 200): Promise<AnalyzeResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const url = `${API_BASE}/api/analyze?max_records=${maxRecords}`;
  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Analyze failed (${res.status}): ${txt}`);
  }
  return res.json();
}
