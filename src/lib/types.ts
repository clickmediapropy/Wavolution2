import type { Id } from "@convex/_generated/dataModel";

export type MediaData = {
  storageId: Id<"_storage">;
  mediaType: "image" | "video" | "document" | "audio";
  fileName: string;
};

export const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-700 text-zinc-300",
  running: "bg-emerald-500/10 text-emerald-400",
  paused: "bg-amber-500/10 text-amber-400",
  completed: "bg-blue-500/10 text-blue-400",
  stopped: "bg-red-500/10 text-red-400",
};
