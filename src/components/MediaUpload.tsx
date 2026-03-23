import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { 
  Loader2, 
  FileVideo, 
  Upload, 
  Music, 
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Id } from "@convex/_generated/dataModel";

type MediaType = "image" | "video" | "document" | "audio";

function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

const MAX_FILE_SIZES: Record<MediaType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  document: 20 * 1024 * 1024, // 20MB
  audio: 20 * 1024 * 1024, // 20MB
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

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

const MEDIA_CONFIG: Record<MediaType, { icon: typeof ImageIcon; color: string; bg: string; label: string }> = {
  image: { icon: ImageIcon, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Image" },
  video: { icon: FileVideo, color: "text-violet-400", bg: "bg-violet-500/10", label: "Video" },
  audio: { icon: Music, color: "text-amber-400", bg: "bg-amber-500/10", label: "Audio" },
  document: { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", label: "Document" },
};

const FILE_TYPE_HINTS = [
  { icon: ImageIcon, label: "Images", limit: "10MB" },
  { icon: FileVideo, label: "Videos", limit: "50MB" },
  { icon: FileText, label: "Docs", limit: "20MB" },
] as const;

function MediaIcon({ mediaType }: { mediaType: MediaType }) {
  const config = MEDIA_CONFIG[mediaType];
  const Icon = config.icon;
  return (
    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
      <Icon className={`w-5 h-5 ${config.color}`} />
    </div>
  );
}

interface MediaUploadProps {
  onUpload: (data: {
    storageId: Id<"_storage">;
    mediaType: MediaType;
    fileName: string;
  }) => void;
  label?: string;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  thumbnailUrl?: string;
  error?: string;
}

export function MediaUpload({ onUpload, label = "Attach Media" }: MediaUploadProps) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Clean up thumbnail object URLs
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.thumbnailUrl) URL.revokeObjectURL(f.thumbnailUrl);
      });
    };
  }, []);

  const generateThumbnail = useCallback((file: File, mediaType: MediaType): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (mediaType === "image") {
        resolve(URL.createObjectURL(file));
      } else if (mediaType === "video") {
        const videoEl = document.createElement("video");
        videoEl.preload = "metadata";
        videoEl.muted = true;
        const videoUrl = URL.createObjectURL(file);
        videoEl.src = videoUrl;
        videoEl.currentTime = 1;
        
        videoEl.addEventListener("seeked", () => {
          const canvas = document.createElement("canvas");
          canvas.width = 120;
          canvas.height = 120;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const scale = Math.max(120 / videoEl.videoWidth, 120 / videoEl.videoHeight);
            const w = videoEl.videoWidth * scale;
            const h = videoEl.videoHeight * scale;
            ctx.drawImage(videoEl, (120 - w) / 2, (120 - h) / 2, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          }
          URL.revokeObjectURL(videoUrl);
        }, { once: true });
        
        videoEl.addEventListener("error", () => {
          URL.revokeObjectURL(videoUrl);
          resolve(undefined);
        }, { once: true });
      } else {
        resolve(undefined);
      }
    });
  }, []);

  const validateAndProcess = useCallback(
    async (fileList: FileList) => {
      setError("");
      const newFiles: UploadFile[] = [];

      for (const file of Array.from(fileList)) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError(`"${file.name}" has an unsupported file type.`);
          continue;
        }

        const mediaType = getMediaType(file.type);
        const maxSize = MAX_FILE_SIZES[mediaType];
        if (file.size > maxSize) {
          setError(`"${file.name}" is too large. Max size for ${mediaType}s is ${formatSize(maxSize)}.`);
          continue;
        }

        const thumbnailUrl = await generateThumbnail(file, mediaType);
        
        const uploadFile: UploadFile = {
          file,
          id: Math.random().toString(36).substr(2, 9),
          progress: 0,
          status: "pending",
          thumbnailUrl,
        };
        
        newFiles.push(uploadFile);
      }

      setFiles(prev => [...prev, ...newFiles]);

    },
    [generateThumbnail],
  );

  const uploadSingleFile = useCallback(async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: "uploading" } : f
    ));

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === uploadFile.id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 200);

      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": uploadFile.file.type },
        body: uploadFile.file,
      });

      clearInterval(progressInterval);

      if (!res.ok) throw new Error("Upload failed");

      const { storageId } = await res.json();
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 100, status: "completed" } 
          : f
      ));

      onUpload({
        storageId,
        mediaType: getMediaType(uploadFile.file.type),
        fileName: uploadFile.file.name,
      });
    } catch (err) {
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
          : f
      ));
    }
  }, [generateUploadUrl, onUpload]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList?.length) return;
      void validateAndProcess(fileList);
      e.target.value = "";
    },
    [validateAndProcess],
  );

  const handleDragEvent = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      switch (e.type) {
        case "drop":
          setIsDragOver(false);
          if (e.dataTransfer.files.length) void validateAndProcess(e.dataTransfer.files);
          break;
        case "dragenter":
          setIsDragOver(true);
          break;
        case "dragleave":
          setIsDragOver(false);
          break;
      }
    },
    [validateAndProcess],
  );

  const handleRemove = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.thumbnailUrl) URL.revokeObjectURL(file.thumbnailUrl);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleRetry = useCallback((uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f =>
      f.id === uploadFile.id
        ? { ...f, status: "uploading", progress: 0, error: undefined }
        : f
    ));
    void uploadSingleFile(uploadFile);
  }, [uploadSingleFile]);

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}

      {/* Drop zone */}
      <motion.div
        role="button"
        tabIndex={0}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDrop={handleDragEvent}
        onDragOver={handleDragEvent}
        onDragEnter={handleDragEvent}
        onDragLeave={handleDragEvent}
        className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
          isDragOver
            ? "border-emerald-500 bg-emerald-500/5"
            : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30"
        }`}
      >
        {/* Background animation on drag over */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-emerald-500/5"
            />
          )}
        </AnimatePresence>

        <div className="relative">
          <motion.div
            animate={isDragOver ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 0.5, repeat: isDragOver ? Infinity : 0 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isDragOver ? "bg-emerald-500/20" : "bg-zinc-800"
            }`}
          >
            <Upload className={`w-6 h-6 transition-colors ${
              isDragOver ? "text-emerald-400" : "text-zinc-500"
            }`} />
          </motion.div>
        </div>
        
        <div className="text-center">
          <p className={`text-sm font-medium transition-colors ${
            isDragOver ? "text-emerald-400" : "text-zinc-300"
          }`}>
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            or click to browse
          </p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {FILE_TYPE_HINTS.map(({ icon: Icon, label, limit }) => (
            <div key={label} className="flex items-center gap-1 px-2 py-1 bg-zinc-800/50 rounded-lg">
              <Icon className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] text-zinc-500">{label} {limit}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <input
        ref={inputRef}
        id="media-upload"
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
        aria-label={label}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* File list */}
      <AnimatePresence mode="popLayout">
        {files.map((uploadFile) => {
          const mediaType = getMediaType(uploadFile.file.type);
          const config = MEDIA_CONFIG[mediaType];
          
          return (
            <motion.div
              key={uploadFile.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group flex items-center gap-4 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-700 transition-colors"
            >
              {/* Thumbnail or icon */}
              <div className="relative flex-shrink-0">
                {uploadFile.thumbnailUrl ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden">
                    <img
                      src={uploadFile.thumbnailUrl}
                      alt={`Thumbnail of ${uploadFile.file.name}`}
                      className="w-full h-full object-cover"
                    />
                    {uploadFile.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <MediaIcon mediaType={mediaType} />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {uploadFile.file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">
                    {formatSize(uploadFile.file.size)}
                  </span>
                  <span className="text-xs text-zinc-600">•</span>
                  <span className={`text-xs ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                
                {/* Progress bar */}
                {uploadFile.status === "uploading" && (
                  <div className="mt-2">
                    <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadFile.progress}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {uploadFile.status === "completed" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-xs text-emerald-400 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Done</span>
                  </motion.div>
                )}

                {uploadFile.status === "error" && (
                  <button
                    onClick={() => handleRetry(uploadFile)}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                )}

                <button
                  onClick={() => handleRemove(uploadFile.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
