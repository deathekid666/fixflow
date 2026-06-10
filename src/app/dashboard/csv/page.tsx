"use client";
import { useState, useRef } from "react";

type ImportType = "spareparts" | "customers";
interface RowError { row: number; data: Record<string, string>; reason: string; }
interface ImportResult { totalRows: number; imported: number; skipped: number; errors: RowError[]; }

export default function CsvPage() {
  const [type, setType] = useState<ImportType>("spareparts");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() { setFile(null); setResult(null); setError(""); if (fileRef.current) fileRef.current.value = ""; }

  async function handleImport() {
    if (!file) { setError("Please select a CSV file."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const formData = new FormData();
      formData.append("type", type); formData.append("file", file);
      const res = await fetch("/api/csv/import", { method: "POST", credentials: "include", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">CSV Import</h1><p className="text-sm text-slate-400 mt-1">Bulk import spare parts or customers</p></div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">1. Import type</p>
        <div className="flex gap-3 flex-wrap">
          {(["spareparts", "customers"] as ImportType[]).map((t) => (
            <button key={t} onClick={() => { setType(t); reset(); }}
              className={`px-5 py-2 rounded-lg border text-sm font-medium transition ${type === t ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"}`}>
              {t === "spareparts" ? "📦 Spare Parts" : "👤 Customers"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Need a template?</span>
          <button onClick={() => window.open(`/api/csv/template?type=${type}`, "_blank")} className="text-blue-400 underline hover:text-blue-300 text-sm">Download {type} template</button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">2. Upload CSV</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 cursor-pointer" />
        {file && <p className="text-xs text-slate-400">{file.name} — {(file.size / 1024).toFixed(1)} KB</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={handleImport} disabled={loading || !file} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Importing..." : "Import"}
        </button>
      </div>
      {result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">3. Results</p>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300">Total: <strong>{result.totalRows}</strong></div>
            <div className="px-4 py-2 bg-green-500/10 rounded-lg text-sm text-green-600 dark:text-green-400">✓ Imported: <strong>{result.imported}</strong></div>
            <div className="px-4 py-2 bg-red-500/10 rounded-lg text-sm text-red-600 dark:text-red-400">✗ Skipped: <strong>{result.skipped}</strong></div>
          </div>
          {result.errors.length === 0 ? <p className="text-sm text-green-600 dark:text-green-400 font-medium">✅ All rows imported successfully!</p> : (
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Errors ({result.errors.length} rows)</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"><tr><th className="px-4 py-2 text-left">Row</th><th className="px-4 py-2 text-left">Reason</th><th className="px-4 py-2 text-left">Data</th></tr></thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {result.errors.map((e, i) => (
                      <tr key={i} className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-2 text-slate-400">#{e.row}</td>
                        <td className="px-4 py-2 text-red-600 dark:text-red-400">{e.reason}</td>
                        <td className="px-4 py-2 text-slate-400 font-mono max-w-xs truncate">{Object.entries(e.data).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" | ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}