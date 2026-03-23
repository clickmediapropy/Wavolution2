import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, FileVideo, File, X, Upload } from "lucide-react";
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
    case "video":
      return <FileVideo className="w-5 h-5 text-violet-400" />;
    default:
      return <File className="w-5 h-5 text-zinc-400" />;
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Clean up thumbnail object URL
  useEffect(() => {
    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [thumbnailUrl]);

  const validateAndProcess = useCallback(
    (file: File) => {
      setError("");
      setUploaded(false);

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

      // Clean up previous thumbnail
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);

      // Create thumbnail for images
      const mediaType = getMediaType(file.type);
      if (mediaType === "image") {
        setThumbnailUrl(URL.createObjectURL(file));
      } else {
        setThumbnailUrl(null);
      }

      setSelectedFile(file);

      // Auto-upload immediately
      void uploadFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [thumbnailUrl],
  );

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError("");
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { storageId } = await res.json();
      setUploaded(true);
      onUpload({
        storageId,
        mediaType: getMediaType(file.type),
        fileName: file.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndProcess(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndProcess(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setThumbnailUrl(null);
    setSelectedFile(null);
    setError("");
    setUploaded(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="media-upload"
        className="block text-sm font-medium text-zinc-300"
      >
        Attach Media
      </label>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          isDragOver
            ? "border-emerald-500 bg-emerald-500/5"
            : "border-zinc-700 hover:border-zinc-500"
        }`}
      >
        <Upload className="w-6 h-6 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Drag & drop files here or click to browse
        </p>
        <p className="text-xs text-zinc-500">
          Images, videos, audio, documents up to 16MB
        </p>
      </div>

      <input
        ref={inputRef}
        id="media-upload"
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Attach Media"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`Thumbnail of ${selectedFile.name}`}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <MediaIcon mediaType={getMediaType(selectedFile.type)} />
          )}
          <span className="text-sm text-zinc-300 flex-1 truncate">
            {selectedFile.name}
          </span>
          <span className="text-xs text-zinc-500">
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </span>

          {isUploading && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Uploading...
            </span>
          )}

          {uploaded && (
            <span className="text-xs text-emerald-400 font-medium">
              Uploaded ✓
            </span>
          )}

          {error && !isUploading && !uploaded && (
            <button
              onClick={() => void uploadFile(selectedFile)}
              className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Retry
            </button>
          )}

          <button
            onClick={handleRemove}
            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
