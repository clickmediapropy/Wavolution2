import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { parseCSV, chunk } from "@/lib/csv";

interface ImportResult {
  added: number;
  duplicates: number;
  errors: number;
}

export function UploadContactsPage() {
  const importBatch = useMutation(api.contacts.importBatch);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Upload className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Upload Contacts</h1>
        </div>
        <Link
          to="/contacts"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Back to Contacts"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
      </div>

      {/* Format instructions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          CSV Format
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Your CSV file should have a header row with at least a{" "}
          <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
            phone
          </code>{" "}
          column. A{" "}
          <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
            name
          </code>{" "}
          column is optional.
        </p>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-700">
          {`name,phone\nJohn Doe,+1234567890\nJane Smith,+0987654321`}
        </pre>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="csv-file"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              CSV File
            </label>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {progress && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? "Importing..." : "Import Contacts"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Import Complete
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">
                {result.added}
              </div>
              <div className="text-xs text-green-600 mt-1">Added</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {result.duplicates}
              </div>
              <div className="text-xs text-yellow-600 mt-1">Duplicates</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">
                {result.errors}
              </div>
              <div className="text-xs text-red-600 mt-1">Errors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
