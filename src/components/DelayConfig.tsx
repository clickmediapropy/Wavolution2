import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Zap, Activity, Timer, ChevronRight } from "lucide-react";

interface DelayConfigProps {
  value: number; // delay in seconds
  onChange: (value: number) => void;
}

const MIN_DELAY = 1;
const MAX_DELAY = 60;

const PRESETS = [
  { 
    value: 1, 
    label: "Fast", 
    description: "Quick delivery",
    icon: Zap,
    color: "amber",
    warning: "Higher risk of rate limiting"
  },
  { 
    value: 5, 
    label: "Normal", 
    description: "Balanced speed",
    icon: Activity,
    color: "emerald",
    warning: null
  },
  { 
    value: 10, 
    label: "Slow", 
    description: "Safer delivery",
    icon: Timer,
    color: "blue",
    warning: null
  },
  { 
    value: 0, 
    label: "Custom", 
    description: "Set your own",
    icon: Clock,
    color: "zinc",
    warning: null
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  amber: { 
    bg: "bg-amber-500/10", 
    text: "text-amber-400", 
    border: "border-amber-500/30",
    ring: "ring-amber-500/20"
  },
  emerald: { 
    bg: "bg-emerald-500/10", 
    text: "text-emerald-400", 
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/20"
  },
  blue: { 
    bg: "bg-blue-500/10", 
    text: "text-blue-400", 
    border: "border-blue-500/30",
    ring: "ring-blue-500/20"
  },
  zinc: { 
    bg: "bg-zinc-500/10", 
    text: "text-zinc-400", 
    border: "border-zinc-500/30",
    ring: "ring-zinc-500/20"
  },
};

export function DelayConfig({ value, onChange }: DelayConfigProps) {
  const [isCustom, setIsCustom] = useState(value !== 1 && value !== 5 && value !== 10);
  const [showTooltip, setShowTooltip] = useState(false);

  const clamp = (v: number) => Math.max(MIN_DELAY, Math.min(MAX_DELAY, v));

  const handlePresetClick = (presetValue: number) => {
    if (presetValue === 0) {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      onChange(presetValue);
    }
  };

  const selectedPreset = PRESETS.find(p => p.value === value) ?? PRESETS[3]!;
  const colors = colorClasses[selectedPreset!.color]!;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-300">
          Delay Between Messages
        </label>
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.border} ${colors.bg}`}>
            <selectedPreset.icon className={`w-4 h-4 ${colors.text}`} />
            <span className={`text-sm font-medium ${colors.text}`}>
              {value}s
            </span>
          </div>
          
          {/* Tooltip */}
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 text-zinc-300 text-xs rounded-lg whitespace-nowrap shadow-xl border border-zinc-700 z-10"
            >
              {selectedPreset.description}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((preset) => {
          const isSelected = preset.value === 0 
            ? isCustom 
            : value === preset.value;
          const presetColors = colorClasses[preset.color]!;
          const Icon = preset.icon;

          return (
            <motion.button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                ${isSelected 
                  ? `${presetColors.bg} ${presetColors.border} ring-2 ${presetColors.ring}` 
                  : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isSelected ? presetColors.text : "text-zinc-500"}`} />
              <span className={`text-xs font-medium ${isSelected ? presetColors.text : "text-zinc-400"}`}>
                {preset.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom slider */}
      <motion.div
        initial={false}
        animate={{ 
          height: isCustom ? "auto" : 0,
          opacity: isCustom ? 1 : 0,
        }}
        className="overflow-hidden"
      >
        <div className="pt-2 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              {/* Track background */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-zinc-800 rounded-full" />
              
              {/* Progress fill */}
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                style={{ width: `${((value - MIN_DELAY) / (MAX_DELAY - MIN_DELAY)) * 100}%` }}
              />
              
              {/* Slider input */}
              <input
                type="range"
                min={MIN_DELAY}
                max={MAX_DELAY}
                step={1}
                value={value}
                onChange={(e) => onChange(clamp(Number(e.target.value)))}
                className="
                  relative w-full h-2 rounded-full appearance-none cursor-pointer
                  bg-transparent
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-emerald-500
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-emerald-500/30
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-emerald-500
                  [&::-moz-range-thumb]:border-0
                "
                aria-label="Message delay in seconds"
              />
            </div>

            {/* Number input */}
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
                className="
                  w-16 px-2 py-2 bg-zinc-800 border border-zinc-700 
                  text-zinc-100 rounded-lg text-sm text-center 
                  focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 
                  outline-none transition-all
                "
                aria-label="Delay seconds"
              />
              <span className="text-sm text-zinc-500">s</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info text */}
      <div className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-xl">
        <Clock className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Messages will be sent with a <span className="text-zinc-300 font-medium">{value} second</span> delay between each.
            {value < 3 && (
              <span className="block mt-1 text-amber-400">
                <ChevronRight className="w-3 h-3 inline" />
                Fast mode may trigger rate limits. Use with caution.
              </span>
            )}
            {value >= 10 && (
              <span className="block mt-1 text-emerald-400">
                <ChevronRight className="w-3 h-3 inline" />
                Slower delivery is recommended for large campaigns.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
