import { useState, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/transitions";
import type { Id } from "@convex/_generated/dataModel";

const STEPS = ["Upload", "Preview", "Import"] as const;

interface ParsedRow {
  phone: string;
  revenue?: number;
}

function parseCSVLocally(text: string): { rows: ParsedRow[]; total: number } {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], total: 0 };

  const headerLine = lines[0];
  if (!headerLine) return { rows: [], total: 0 };
  const header = headerLine.toLowerCase().split(",").map((h) => h.trim());
  const phoneIdx = header.indexOf("phone");
  const revenueIdx = header.indexOf("revenue");

  if (phoneIdx === -1) {
    throw new Error('CSV must have a "phone" column');
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());
    const phone = cols[phoneIdx]?.replace(/[+\s\-()]/g, "");
    if (!phone || phone.length < 7) continue;

    const revStr = revenueIdx !== -1 ? cols[revenueIdx] : undefined;
    const revenue = revStr !== undefined ? parseFloat(revStr) : undefined;
    rows.push({
      phone,
      revenue: revenue && !isNaN(revenue) ? revenue : undefined,
    });
  }

  return { rows, total: rows.length };
}

export function LeadImportPage() {
  const verticals = useQuery(api.verticals.list);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const parseVoluumCsv = useAction(api.leadImport.parseVoluumCsv);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [storageId, setStorageId] = useState<Id<"_storage"> | null>(null);
  const [selectedVertical, setSelectedVertical] = useState("");
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ totalLeads: number; batches: number; skippedDuplicates: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setUploading(true);

    try {
      // Parse locally for preview
      const text = await selectedFile.text();
      const parsed = parseCSVLocally(text);
      setPreview(parsed.rows.slice(0, 20));
      setTotalRows(parsed.total);

      // Upload to Convex storage
      const url = await generateUploadUrl();
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type || "text/csv" },
        body: selectedFile,
      });
      const { storageId: id } = (await response.json()) as { storageId: Id<"_storage"> };
      setStorageId(id);
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }, [generateUploadUrl]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.type === "text/csv")) {
        void handleFile(droppedFile);
      } else {
        toast.error("Please drop a CSV file");
      }
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) void handleFile(selectedFile);
    },
    [handleFile],
  );

  const handleImport = async () => {
    if (!storageId) return;
    setImporting(true);
    setStep(2);

    try {
      const res = await parseVoluumCsv({
        storageId,
        vertical: selectedVertical || undefined,
      });
      setResult(res);
      toast.success(`Import complete: ${res.totalLeads} leads processed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
      setStep(1);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setFile(null);
    setStorageId(null);
    setSelectedVertical("");
    setPreview([]);
    setTotalRows(0);
    setResult(null);
  };

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Upload className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-h2 text-zinc-100">Lead Import</h1>
            <p className="text-small text-zinc-500">Import leads from Voluum CSV exports</p>
          </div>
        </div>
      </motion.div>

      {/* Steps indicator */}
      <motion.div variants={staggerItemVariants} className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={cn("w-8 h-px", i <= step ? "bg-emerald-500" : "bg-zinc-700")} />}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                )}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn("text-sm font-medium", i <= step ? "text-zinc-200" : "text-zinc-500")}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <motion.div variants={staggerItemVariants}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-2xl p-12 text-center transition-colors",
              dragOver
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-zinc-700 hover:border-zinc-600",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-zinc-300">Uploading and parsing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileSpreadsheet className="w-12 h-12 text-zinc-600" />
                <div>
                  <p className="text-zinc-300 font-medium">Drop your CSV file here</p>
                  <p className="text-zinc-500 text-sm mt-1">Expected format: phone, revenue (optional)</p>
                </div>
                <label className="mt-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                  Browse files
                  <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Step 1: Preview */}
      {step === 1 && (
        <motion.div variants={staggerItemVariants} className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-zinc-100 font-semibold">Preview</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {file?.name} — {totalRows} leads found
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">#</th>
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Phone</th>
                    <th className="text-right py-2 px-3 text-zinc-500 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      <td className="py-2 px-3 text-zinc-600">{i + 1}</td>
                      <td className="py-2 px-3 text-zinc-300 font-mono">{row.phone}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right">
                        {row.revenue !== undefined ? `$${row.revenue.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalRows > 20 && (
              <p className="text-xs text-zinc-600 mt-2 text-center">
                Showing first 20 of {totalRows} rows
              </p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <label className="block text-sm text-zinc-400 mb-2">Default Vertical</label>
            <select
              value={selectedVertical}
              onChange={(e) => setSelectedVertical(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Auto-detect</option>
              {(verticals ?? []).map((v) => (
                <option key={v._id} value={v.slug}>{v.name}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-600 mt-1">Leave as auto-detect to infer vertical from CSV data</p>
          </div>

          <div className="flex justify-between">
            <button
              onClick={reset}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => void handleImport()}
              disabled={!storageId}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Import {totalRows} Leads
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Import */}
      {step === 2 && (
        <motion.div variants={staggerItemVariants}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            {importing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                <div>
                  <p className="text-zinc-200 font-semibold">Importing leads...</p>
                  <p className="text-zinc-500 text-sm mt-1">Processing {totalRows} rows in batches</p>
                </div>
                <div className="w-full max-w-xs bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: "5%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 8, ease: "easeOut" }}
                  />
                </div>
              </div>
            ) : result ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <div>
                  <p className="text-zinc-200 font-semibold text-lg">Import Complete</p>
                  <p className="text-zinc-500 text-sm mt-1">Your leads are being processed</p>
                </div>
                <div className="grid grid-cols-3 gap-6 mt-4">
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">{result.totalLeads}</p>
                    <p className="text-xs text-zinc-500">Leads Processed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{result.batches}</p>
                    <p className="text-xs text-zinc-500">Batches</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-400">{result.skippedDuplicates}</p>
                    <p className="text-xs text-zinc-500">Duplicates Skipped</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="mt-4 px-6 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  Import Another File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-zinc-300">Something went wrong. Please try again.</p>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
