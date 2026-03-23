interface DelayConfigProps {
  value: number; // delay in seconds
  onChange: (value: number) => void;
}

const MIN_DELAY = 1;
const MAX_DELAY = 60;

export function DelayConfig({ value, onChange }: DelayConfigProps) {
  const clamp = (v: number) => Math.max(MIN_DELAY, Math.min(MAX_DELAY, v));

  return (
    <div className="space-y-3">
      <label
        htmlFor="delay-slider"
        className="block text-sm font-medium text-zinc-300"
      >
        Delay Between Messages
      </label>

      <div className="flex items-center gap-4">
        <input
          id="delay-slider"
          type="range"
          min={MIN_DELAY}
          max={MAX_DELAY}
          step={1}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="flex-1 h-2 rounded-full appearance-none bg-zinc-700 accent-emerald-500 cursor-pointer"
          aria-label="Message delay in seconds"
        />

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={MIN_DELAY}
            max={MAX_DELAY}
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(clamp(n));
            }}
            className="w-16 px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
            aria-label="Delay seconds"
          />
          <span className="text-sm text-zinc-500">sec</span>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Wait {value} {value === 1 ? "second" : "seconds"} between sending each
        message. Longer delays reduce the risk of being flagged.
      </p>
    </div>
  );
}
