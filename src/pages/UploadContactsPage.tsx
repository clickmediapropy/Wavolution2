import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { parseCSV, chunk } from "@/lib/csv";
import { motion } from "framer-motion";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ImportResult {
  added: number;
  duplicates: number;
  errors: number;
}

export function UploadContactsPage() {
  const importBatch = useMutation(api.contacts.importBatch);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleImport() {
    if (!file) return;
    setError("");
    setResult(null);
    setIsImporting(true);

    try {
      const text = await file.text();
      const contacts = parseCSV(text);

      if (contacts.length === 0) {
        setError("No valid contacts found in CSV");
        setIsImporting(false);
        return;
      }

      const batches = chunk(contacts, 100);
      const totals: ImportResult = { added: 0, duplicates: 0, errors: 0 };

      for (let i = 0; i < batches.length; i++) {
        setProgress(`Importing batch ${i + 1} of ${batches.length}...`);
        const batchResult = await importBatch({ contacts: batches[i]! });
        totals.added += batchResult.added;
        totals.duplicates += batchResult.duplicates;
        totals.errors += batchResult.errors;
      }

      setResult(totals);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(`Imported ${totals.added} contacts`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      toast.error("Import failed");
    } finally {
      setIsImporting(false);
      setProgress("");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected && !selected.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      setFile(null);
      return;
    }
    setError("");
    setResult(null);
    setFile(selected ?? null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && !dropped.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      setFile(null);
      return;
    }
    setError("");
    setResult(null);
    setFile(dropped ?? null);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Upload className="w-7 h-7 text-emerald-500" />
          <h1 className="text-2xl font-bold text-zinc-100">Upload Contacts</h1>
        </div>
        <Link
          to="/contacts"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Back to Contacts"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
      </div>

      {/* Format instructions */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
        <h2 className="text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-500" />
          CSV Format
        </h2>
        <p className="text-sm text-zinc-400 mb-3">
          Your CSV file should have a header row with at least a{" "}
          <code className="px-1.5 py-0.5 bg-zinc-800 text-emerald-400 rounded text-xs font-mono">
            phone
          </code>{" "}
          column. A{" "}
          <code className="px-1.5 py-0.5 bg-zinc-800 text-emerald-400 rounded text-xs font-mono">
            name
          </code>{" "}
          column is optional.
        </p>
        <pre className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-xs font-mono text-emerald-300">
          {`name,phone\nJohn Doe,+1234567890\nJane Smith,+0987654321`}
        </pre>
      </div>

      {/* Upload area */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
        <div className="space-y-4">
          {/* Drag-drop zone */}
          <motion.div
            role="button"
            tabIndex={0}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-zinc-700 hover:border-zinc-600"
            }`}
          >
            <UploadCloud className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <p className="text-zinc-300">Drag & drop your CSV file here</p>
            <p className="text-zinc-500 text-sm mt-1">or click to browse</p>
          </motion.div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            aria-label="CSV file input"
          />

          {/* File preview card */}
          {file && (
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200 font-medium truncate">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors rounded"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-3 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {progress && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? "Importing..." : "Import Contacts"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-sm font-medium text-zinc-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Import Complete
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {result.added}
              </div>
              <div className="text-xs text-emerald-500 mt-1">Added</div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {result.duplicates}
              </div>
              <div className="text-xs text-amber-500 mt-1">Duplicates</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {result.errors}
              </div>
              <div className="text-xs text-red-500 mt-1">Errors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
