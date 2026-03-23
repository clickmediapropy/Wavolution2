type MessagePreviewProps = {
  message: string;
  contactName?: string;
};

export function MessagePreview({
  message,
  contactName,
}: MessagePreviewProps) {
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-zinc-700 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-sm font-medium">
          {(contactName ?? "C")[0]!.toUpperCase()}
        </div>
        <span className="text-sm font-medium text-zinc-300">
          {contactName || "Contact"}
        </span>
      </div>

      {/* Chat body */}
      <div className="p-4 min-h-[200px] flex flex-col justify-end bg-zinc-900/50">
        {message.trim() ? (
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-emerald-600 text-white rounded-2xl rounded-br-sm px-4 py-2 shadow-md">
              <p className="text-sm whitespace-pre-wrap break-words">
                {message}
              </p>
              <p className="text-[10px] text-emerald-200 text-right mt-1">
                now
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 text-center">
            Your message preview will appear here
          </p>
        )}
      </div>
    </div>
  );
}
