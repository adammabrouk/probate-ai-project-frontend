import { useEffect, useRef, useState } from "react";
import PrelimAnalysis from "./components/PrelimAnalysis";
import type { PrelimResponse } from "./types";
import { fetchDashboard, uploadFile } from "./lib/api";

export default function App() {
  const [data, setData] = useState<PrelimResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchDashboard(); // optionally pass filters here
      setData(res);
    } catch (e:any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onUploadClick = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      await uploadFile(file);
      await load(); // refresh dashboard after ingest
    } catch (e:any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input so same file can be chosen again
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Probate Preliminary Analysis</h1>
          <p className="text-sm text-gray-500">Live charts powered by FastAPI + Peewee</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onUploadClick}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload CSV/XLSX"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </header>

      {error && <div className="text-red-600">{error}</div>}
      {loading && <div className="text-gray-600">Loading dashboard…</div>}
      {data && <PrelimAnalysis data={data} />}
    </div>
  );
}
