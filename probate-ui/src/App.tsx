import { useState } from "react";
import Dropzone from "./components/Dropzone";
import PrelimAnalysis from "./components/PrelimAnalysis";
import { analyzeFileMock, uploadFile } from "./lib/api";
import type { PrelimResponse } from "./types";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [skipToAnalysis, setSkipToAnalysis] = useState(false); // New state for skipping
  const [data, setData] = useState<PrelimResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    setLoading(true); setError(null);
    try {
      
      const resBis = await uploadFile(file);
      const res = await analyzeFileMock(200);
      setData(res);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Probate Preliminary Analysis</h1>
      </header>
      // Add a button to skip to the analysis section
      {!data && <Dropzone onFile={onFile} disabled={loading} />}
      {loading && <div className="text-gray-600">Analyzing…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {data && <PrelimAnalysis data={data} />}
    </div>
  );
}