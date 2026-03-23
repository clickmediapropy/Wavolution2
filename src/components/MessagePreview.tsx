import { motion } from "framer-motion";
import { CheckCheck, Phone, Video, MoreVertical } from "lucide-react";

type MessagePreviewProps = {
  message: string;
  contactName?: string;
  contactPhone?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
};

// WhatsApp-style check marks
function MessageStatus() {
  return (
    <div className="flex items-center gap-0.5 ml-1">
      <CheckCheck className="w-3 h-3 text-blue-300" />
    </div>
  );
}

// Format timestamp like WhatsApp
function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessagePreview({
  message,
  contactName,
  contactPhone,
  mediaUrl,
  mediaType,
}: MessagePreviewProps) {
  const displayName = contactName || contactPhone || "Contact";
  const initial = displayName[0]?.toUpperCase() || "C";

  return (
    <div className="bg-[#0b141a] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* WhatsApp-style chat header */}
      <div className="px-3 py-2.5 bg-[#1f2c34] border-b border-[#2a3942] flex items-center gap-3">
        {/* Back arrow (decorative) */}
        <div className="text-zinc-400 hidden sm:block">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
          {initial}
        </div>

        {/* Contact info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-zinc-100 truncate">
            {displayName}
          </h3>
          <p className="text-xs text-zinc-400">
            online
          </p>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-4 text-zinc-400">
          <Video className="w-5 h-5" />
          <Phone className="w-5 h-5" />
          <MoreVertical className="w-5 h-5" />
        </div>
      </div>

      {/* Chat background with pattern */}
      <div 
        className="relative p-4 min-h-[280px] flex flex-col justify-end"
        style={{
          backgroundColor: "#0b141a",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231f2c34' fill-opacity='0.4'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' /%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {message.trim() || mediaUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex justify-end"
          >
            {/* WhatsApp sent message bubble */}
            <div className="relative max-w-[85%] sm:max-w-[75%]">
              {/* Bubble tail */}
              <div 
                className="absolute bottom-0 right-[-6px] w-3 h-3"
                style={{
                  background: "linear-gradient(135deg, #005c4b 50%, transparent 50%)",
                }}
              />
              
              <div 
                className="rounded-lg rounded-tr-sm px-3 py-2 shadow-md"
                style={{ backgroundColor: "#005c4b" }}
              >
                {/* Media preview */}
                {mediaUrl && (
                  <div className="mb-2 -mx-1 -mt-1">
                    {mediaType === "image" ? (
                      <img 
                        src={mediaUrl} 
                        alt="Media" 
                        className="rounded-lg max-h-40 object-cover"
                      />
                    ) : (
                      <div className="bg-black/30 rounded-lg h-32 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message text */}
                {message.trim() && (
                  <p className="text-sm text-zinc-100 whitespace-pre-wrap break-words leading-relaxed">
                    {message}
                  </p>
                )}
                
                {/* Timestamp and status */}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-zinc-400">
                    {formatTime()}
                  </span>
                  <MessageStatus />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-3 p-6 rounded-2xl bg-zinc-800/50">
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">
                Your message preview will appear here
              </p>
              <p className="text-xs text-zinc-600">
                Type a message to see how it will look
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chat input bar (decorative) */}
      <div className="px-3 py-2 bg-[#1f2c34] border-t border-[#2a3942] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 h-10 bg-[#2a3942] rounded-full flex items-center px-4">
          <span className="text-sm text-zinc-500">Type a message</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Compact variant for smaller spaces
export function MessagePreviewCompact({ message }: { message: string }) {
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl rounded-tl-sm p-3">
      <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
        {message || "Your message will appear here..."}
      </p>
      <div className="flex items-center justify-end gap-1 mt-1">
        <span className="text-[10px] text-zinc-500">{formatTime()}</span>
        <CheckCheck className="w-3 h-3 text-emerald-400" />
      </div>
    </div>
  );
}
