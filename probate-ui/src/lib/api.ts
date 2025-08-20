import type { AnalyzeResponse } from "../types";
import type { PrelimResponse } from "../types";
import { mockPrelimResponse } from "./mock";

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

// For now we ignore the real backend and always return the mock.
// Later: switch to real POST /api/analyze with FormData.
export async function analyzeFileMock(_file: File, _maxRecords = 200): Promise<PrelimResponse> {
  await new Promise(r => setTimeout(r, 400)); // tiny delay for UX
  return mockPrelimResponse;
}
