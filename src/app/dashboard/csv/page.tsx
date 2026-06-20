"use client";
import { useState, useRef, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";

type Step = 1 | 2 | 3;
type ImportType = "spareparts" | "customers";

interface FieldDef { key: string; label: string; required: boolean; hint?: string; }
interface RowError { row: number; data: Record<string, string>; reason: string; }
interface ImportResult { totalRows: number; imported: number; skipped: number; errors: RowError[]; }

const FIELDS: Record<ImportType, FieldDef[]> = {
  spareparts: [
    { key: "name", label: "Name", required: true },
    { key: "unit_price", label: "Unit Price", required: true, hint: "number" },
    { key: "part_number", label: "Part Number", required: false },
    { key: "description", label: "Description", required: false },
    { key: "stock", label: "Stock", required: false, hint: "number, defaults to 0" },
  ],
  customers: [
    { key: "name", label: "Customer Name", required: true },
    { key: "phone", label: "Phone", required: true },
    { key: "email", label: "Email", required: false },
    { key: "device_brand", label: "Device Brand", required: false },
    { key: "device_model", label: "Device Model", required: false },
    { key: "fault_description", label: "Fault Description", required: false },
  ],
};

const ALIASES: Record<string, string[]> = {
  name: ["name", "customer name", "item name", "spare part name", "part name", "product name"],
  unit_price: ["unit_price", "unitprice", "unit price", "price", "cost"],
  part_number: ["part_number", "partnumber", "part number", "part no", "partno", "sku"],
  description: ["description", "desc", "notes"],
  stock: ["stock", "qty", "quantity", "stock_qty", "in stock"],
  phone: ["phone", "customer_phone", "customer phone", "mobile", "tel", "telephone", "phone number"],
  email: ["email", "customer_email", "customer email", "e-mail"],
  device_brand: ["device_brand", "devicebrand", "device brand", "brand", "make"],
  device_model: ["device_model", "devicemodel", "device model", "model"],
  fault_description: ["fault_description", "faultdescription", "fault description", "fault", "issue", "problem", "complaint"],
};

function parseCSVClient(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!clean) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(cell.trim()); cell = "";
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const lines = clean.split("\n").filter(l => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };

  const rawHeaders = parseLine(lines[0]).map(h => h.trim());
  const headersLower = rawHeaders.map(h => h.toLowerCase());

  const rows = lines.slice(1).map(line => {
    const vals = parseLine(line);
    const row: Record<string, string> = {};
    headersLower.forEach((h, i) => { row[h] = vals[i]?.trim() ?? ""; });
    return row;
  });

  return { headers: rawHeaders, rows };
}

function autoMap(headers: string[], type: ImportType): Record<string, string> {
  const headersLower = headers.map(h => h.toLowerCase());
  const mapping: Record<string, string> = {};
  for (const field of FIELDS[type]) {
    const aliases = ALIASES[field.key] ?? [field.key];
    for (const alias of aliases) {
      const idx = headersLower.indexOf(alias.toLowerCase());
      if (idx !== -1) { mapping[field.key] = headers[idx]; break; }
    }
  }
  return mapping;
}

function applyMappingClient(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): Record<string, string>[] {
  return rows.map(row => {
    const out = { ...row };
    for (const [canonicalKey, csvCol] of Object.entries(mapping)) {
      if (csvCol) out[canonicalKey] = row[csvCol.toLowerCase()] ?? "";
    }
    return out;
  });
}

function downloadErrorsCSV(errors: RowError[]) {
  if (!errors.length) return;
  const dataKeys = Object.keys(errors[0].data);
  const header = ["Row", "Reason", ...dataKeys];
  const csvRows = [
    header.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
    ...errors.map(e => [
      String(e.row),
      `"${e.reason.replace(/"/g, '""')}"`,
      ...dataKeys.map(k => `"${(e.data[k] ?? "").replace(/"/g, '""')}"`),
    ].join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "import-errors.csv"; a.click();
  URL.revokeObjectURL(url);
}

const STEP_LABELS = ["Upload", "Map Columns", "Results"];

export default function CsvPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [importType, setImportType] = useState<ImportType>("spareparts");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fields = FIELDS[importType];

  const { validCount, invalidCount } = useMemo(() => {
    if (!csvRows.length) return { validCount: 0, invalidCount: 0 };
    const mapped = applyMappingClient(csvRows, mapping);
    const requiredKeys = fields.filter(f => f.required).map(f => f.key);
    let valid = 0;
    for (const row of mapped) {
      if (requiredKeys.every(k => row[k]?.trim())) valid++;
    }
    return { validCount: valid, invalidCount: mapped.length - valid };
  }, [csvRows, mapping, fields]);

  function acceptFile(f: File) {
    if (!f.name.endsWith(".csv") && f.type !== "text/csv") {
      setFileError("Please upload a .csv file");
      return;
    }
    setFile(f);
    setFileError("");
  }

  async function goToStep2() {
    if (!file) { setFileError("Please select a CSV file"); return; }
    try {
      const text = await file.text();
      const { headers, rows } = parseCSVClient(text);
      if (!headers.length) { setFileError("CSV appears to be empty or has no headers"); return; }
      if (!rows.length) { setFileError("CSV has headers but no data rows"); return; }
      setCsvHeaders(headers);
      setCsvRows(rows);
      setMapping(autoMap(headers, importType));
      setStep(2);
    } catch {
      setFileError("Failed to read the file");
    }
  }

  async function runImport() {
    if (!file) return;
    setLoading(true);
    setFileError("");
    try {
      const fd = new FormData();
      fd.append("type", importType);
      fd.append("file", file);
      fd.append("mapping", JSON.stringify(mapping));
      const res = await fetch("/api/csv/import", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
      setStep(3);
    } catch (e: unknown) {
      setFileError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setResult(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const previewRows = csvRows.slice(0, 5);
  const mappedPreview = applyMappingClient(previewRows, mapping);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("csvImportTitle")}</h1>
        <p className="text-sm text-slate-400 mt-1">{t("csvImportSubtitle")}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          const active = step === s;
          const done = step > s;
          return (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && (
                <div className={`h-px w-6 mx-1 ${done ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
              )}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${active ? "bg-blue-600 text-white shadow-sm" : done ? "bg-blue-500/15 text-blue-500 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs leading-none
                  ${active ? "bg-white/25" : done ? "bg-blue-500/25" : "bg-slate-300/60 dark:bg-slate-600"}`}>
                  {done ? "✓" : s}
                </span>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Upload ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("whatAreYouImporting")}</p>
            <div className="flex gap-3 flex-wrap">
              {(["spareparts", "customers"] as ImportType[]).map(t => (
                <button key={t} onClick={() => setImportType(t)}
                  className={`px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-start gap-1 min-w-[130px]
                    ${importType === t
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-slate-500"}`}>
                  <span className="text-2xl">{t === "spareparts" ? "📦" : "👤"}</span>
                  <span>{t === "spareparts" ? "Spare Parts" : "Customers"}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400">{t("needTemplate")}</span>
              <button
                onClick={() => window.open(`/api/csv/template?type=${importType}`, "_blank")}
                className="text-xs text-blue-500 hover:text-blue-400 underline transition">
                {t("downloadTemplate")} {importType === "spareparts" ? "spare parts" : "customers"} template
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("uploadCsvFile")}</p>
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
                ${isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : file
                  ? "border-green-500/50 bg-green-500/5 dark:bg-green-500/5"
                  : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"}`}>
              <div className="text-4xl select-none">{file ? "✅" : "📄"}</div>
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} {t("clickToChange")}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("dropCsvHere")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("csvFilesOnly")}</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv"
              onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); }}
              className="hidden" />
            {fileError && <p className="text-red-400 text-sm">{fileError}</p>}
            <div className="flex justify-end pt-1">
              <button onClick={goToStep2} disabled={!file}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-40">
                {t("nextMapColumns")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Map Columns ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("mapColumns")}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t("mapColumnsHint")}</p>
              </div>
              <span className="text-xs text-slate-400 pt-0.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">{csvRows.length}</span> {t("rowsDetected")}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left w-1/3">{t("fieldCol")}</th>
                    <th className="px-4 py-3 text-left w-1/3">{t("csvColumn")}</th>
                    <th className="px-4 py-3 text-left">{t("sampleValue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fields.map(field => {
                    const selected = mapping[field.key] ?? "";
                    const sample = selected ? (csvRows[0]?.[selected.toLowerCase()] ?? "") : "";
                    const isMissing = field.required && !selected;
                    return (
                      <tr key={field.key} className={isMissing ? "bg-red-500/5" : ""}>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{field.label}</span>
                            {field.required && <span className="text-xs text-red-500 font-semibold">{t("requiredField")}</span>}
                            {field.hint && <span className="text-xs text-slate-400">({field.hint})</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={selected}
                            onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                              ${isMissing ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-600"}`}>
                            <option value="">{t("skipOption")}</option>
                            {csvHeaders.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 font-mono truncate max-w-[160px]">
                          {sample || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("preview")}{" "}
                <span className="text-slate-400 font-normal text-xs">({t("firstRows")} {previewRows.length} {t("ofLabel")} {csvRows.length} {t("rowsLabel")})</span>
              </p>
              <div className="flex gap-3 text-xs">
                <span className="text-green-600 dark:text-green-400 font-medium">✓ {validCount} {t("readyLabel")}</span>
                {invalidCount > 0 && (
                  <span className="text-red-500 dark:text-red-400 font-medium">✗ {invalidCount} {t("willBeSkipped")}</span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs min-w-max">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                  <tr>
                    {fields.map(f => (
                      <th key={f.key} className="px-4 py-2 text-left whitespace-nowrap font-medium">
                        {f.label}
                        {f.required && <span className="text-red-400 ml-0.5">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mappedPreview.map((row, i) => {
                    const missingKeys = fields.filter(f => f.required && !row[f.key]?.trim()).map(f => f.key);
                    return (
                      <tr key={i} className={missingKeys.length ? "bg-red-500/5" : ""}>
                        {fields.map(f => {
                          const val = row[f.key] ?? "";
                          const missing = missingKeys.includes(f.key);
                          return (
                            <td key={f.key} className={`px-4 py-2.5 font-mono ${missing ? "text-red-500 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}`}>
                              {val
                                ? val
                                : <span className={`italic ${missing ? "text-red-400" : "text-slate-300 dark:text-slate-600"}`}>
                                    {missing ? "missing" : "empty"}
                                  </span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {fileError && <p className="text-red-400 text-sm">{fileError}</p>}

          <div className="flex items-center justify-between">
            <button onClick={() => { setStep(1); setFileError(""); }}
              className="px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
              ← Back
            </button>
            <button onClick={runImport} disabled={loading || validCount === 0}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-40 flex items-center gap-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("importingLabel")}
                </>
              ) : (
                `${t("importRows")} ${validCount} ${t("rowsLabel")}${validCount !== 1 ? "" : ""}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Results ── */}
      {step === 3 && result && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{result.totalRows}</p>
                <p className="text-xs text-slate-400 mt-1">{t("totalRowsLabel")}</p>
              </div>
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.imported}</p>
                <p className="text-xs text-slate-400 mt-1">{t("importedLabel")}</p>
              </div>
              <div className={`rounded-xl p-4 text-center border ${result.skipped > 0 ? "border-red-500/30 bg-red-500/5" : "border-slate-200 dark:border-slate-700"}`}>
                <p className={`text-2xl font-bold ${result.skipped > 0 ? "text-red-500 dark:text-red-400" : "text-slate-400"}`}>
                  {result.skipped}
                </p>
                <p className="text-xs text-slate-400 mt-1">{t("skippedLabel")}</p>
              </div>
            </div>

            {result.errors.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <span className="text-2xl select-none">🎉</span>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">{t("allRowsImported")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t("errorsLabel")} <span className="text-red-500">({result.errors.length} {t("rowsSkipped")})</span>
                  </p>
                  <button onClick={() => downloadErrorsCSV(result.errors)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition flex items-center gap-1.5">
                    {t("downloadErrorReport")}
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-2.5 text-left w-12 font-medium">{t("rowCol")}</th>
                        <th className="px-4 py-2.5 text-left font-medium">{t("reasonLabel")}</th>
                        <th className="px-4 py-2.5 text-left font-medium">{t("dataLabel")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.errors.map((err, i) => (
                        <tr key={i} className="bg-white dark:bg-slate-900">
                          <td className="px-4 py-2.5 text-slate-400">#{err.row}</td>
                          <td className="px-4 py-2.5 text-red-500 dark:text-red-400">{err.reason}</td>
                          <td className="px-4 py-2.5 text-slate-400 font-mono truncate max-w-xs">
                            {Object.entries(err.data).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={reset}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
              {t("importAnotherFile")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
