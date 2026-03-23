import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, FileImage, FileVideo, File, X } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
  "audio/mpeg",
  "audio/ogg",
];

type MediaType = "image" | "video" | "document" | "audio";

function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

function MediaIcon({ mediaType }: { mediaType: MediaType }) {
  switch (mediaType) {
    case "image":
      return <FileImage className="w-5 h-5 text-blue-500" />;
    case "video":
      return <FileVideo className="w-5 h-5 text-purple-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
}

interface MediaUploadProps {
  onUpload: (data: {
    storageId: Id<"_storage">;
    mediaType: MediaType;
    fileName: string;
  }) => void;
}

export function MediaUpload({ onUpload }: MediaUploadProps) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setUploaded(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 16MB.");
      setSelectedFile(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Unsupported file type.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError("");
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { storageId } = await res.json();
      setUploaded(true);
      onUpload({
        storageId,
        mediaType: getMediaType(selectedFile.type),
        fileName: selectedFile.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError("");
    setUploaded(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="media-upload"
        className="block text-sm font-medium text-gray-700"
      >
        Attach Media
      </label>

      <input
        ref={inputRef}
        id="media-upload"
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        aria-label="Attach Media"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <MediaIcon mediaType={getMediaType(selectedFile.type)} />
          <span className="text-sm text-gray-700 flex-1 truncate">
            {selectedFile.name}
          </span>
          <span className="text-xs text-gray-400">
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </span>

          {!uploaded && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Upload"
              )}
            </button>
          )}

          {uploaded && (
            <span className="text-xs text-green-600 font-medium">
              Uploaded
            </span>
          )}

          <button
            onClick={handleRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Images, videos, audio, documents up to 16MB
      </p>
    </div>
  );
}
