import { useRef } from "react";
import { User, Phone } from "lucide-react";

interface MessageTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TOKENS = [
  { key: "{name}", label: "Name", icon: <User className="w-3.5 h-3.5" /> },
  { key: "{phone}", label: "Phone", icon: <Phone className="w-3.5 h-3.5" /> },
];

export function MessageTemplateEditor({
  value,
  onChange,
}: MessageTemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + token + value.slice(end);
    onChange(newValue);

    // Restore cursor position after token
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + token.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="message-template"
        className="block text-sm font-medium text-zinc-300"
      >
        Message Template
      </label>

      {/* Token buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Insert:</span>
        {TOKENS.map((token) => (
          <button
            key={token.key}
            type="button"
            onClick={() => insertToken(token.key)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-emerald-500 hover:text-emerald-400 transition-colors"
            aria-label={`Insert ${token.label} token`}
          >
            {token.icon}
            {token.key}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        id="message-template"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Hi {name}, this is a message for {phone}..."
        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-y font-mono text-sm"
        aria-label="Message template"
      />

      <p className="text-xs text-zinc-500">
        Use {"{name}"} and {"{phone}"} as placeholders. They&apos;ll be replaced
        with each contact&apos;s info.
      </p>
    </div>
  );
}
