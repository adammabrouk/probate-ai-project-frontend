import { useState } from "react";
import Dropzone from "./components/Dropzone";
import ChartsBoard from "./components/ChartsBoard";
import DataTable from "./components/DataTable";
import { analyzeFile } from "./lib/api";
import type { AnalyzeResponse, RecordRow } from "./types";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [charts, setCharts] = useState<AnalyzeResponse["charts"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxRecords, setMaxRecords] = useState(200);

  const onFile = async (file: File) => {
    setLoading(true); setError(null);
    try {
      const res = await analyzeFile(file, maxRecords);
      setRows(res.records);
      setCharts(res.charts);
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
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Rows to analyze:</label>
          <input
            type="number"
            min={50}
            max={1000}
            value={maxRecords}
            onChange={(e) => setMaxRecords(Number(e.target.value))}
            className="w-24 border rounded-lg px-2 py-1"
            title="Caps spend — backend will only analyze up to this many rows."
          />
        </div>
      </header>

      <Dropzone onFile={onFile} disabled={loading} />

      {loading && <div className="text-gray-600">Analyzing…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {charts && <ChartsBoard charts={charts} />}
      {rows.length > 0 && <DataTable rows={rows} />}
    </div>
  );
}
