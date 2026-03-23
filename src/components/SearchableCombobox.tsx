import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, ChevronDown, X } from "lucide-react";
import Fuse from "fuse.js";

export type ComboboxOption = {
  value: string;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
};

type SearchableComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
};

const fuseOptions = {
  keys: ['label', 'subtitle', 'value'],
  threshold: 0.4,
  includeScore: true,
};

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Search...",
  label,
  error,
  disabled = false,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Initialize Fuse for fuzzy search
  const fuse = useMemo(() => new Fuse(options, fuseOptions), [options]);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  // Fuzzy search with Fuse.js
  const filtered = useMemo(() => {
    if (!query) return options;
    const results = fuse.search(query);
    return results.map(result => result.item);
  }, [options, query, fuse]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView?.({ block: "nearest" });
    }
  }, [activeIndex]);

  const select = useCallback(
    (opt: ComboboxOption) => {
      onChange(opt.value);
      setIsOpen(false);
      setQuery("");
      setActiveIndex(-1);
    },
    [onChange],
  );

  const clearSelection = useCallback(() => {
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          setIsOpen(true);
          setActiveIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && filtered[activeIndex]) {
            select(filtered[activeIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setQuery("");
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    },
    [isOpen, filtered, activeIndex, select, disabled],
  );

  const activeDescendant =
    isOpen && activeIndex >= 0
      ? `combobox-option-${activeIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={isOpen}
          aria-activedescendant={activeDescendant}
          aria-controls="combobox-listbox"
          aria-autocomplete="list"
          type="text"
          value={isOpen ? query : selectedOption?.label ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setQuery("");
              setActiveIndex(-1);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`
            w-full pl-9 pr-10 py-2.5 bg-zinc-800 border rounded-xl text-zinc-100 
            placeholder:text-zinc-500 outline-none transition-all
            focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-500/50 focus:border-red-500" : "border-zinc-700"}
          `}
        />
        
        {/* Clear button or dropdown arrow */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {selectedOption && !isOpen ? (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <ChevronDown className={`
              w-4 h-4 text-zinc-500 transition-transform duration-200
              ${isOpen ? "rotate-180" : ""}
            `} />
          )}
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            ref={listRef}
            id="combobox-listbox"
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full max-h-64 overflow-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/20"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No results found</p>
                <p className="text-zinc-600 text-xs mt-1">Try adjusting your search</p>
              </li>
            ) : (
              filtered.map((opt, i) => (
                <li
                  key={opt.value}
                  id={`combobox-option-${i}`}
                  role="option"
                  aria-selected={opt.value === value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(opt);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`
                    px-4 py-3 cursor-pointer transition-all border-b border-zinc-800/50 last:border-0
                    flex items-center gap-3
                    ${i === activeIndex
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-zinc-200 hover:bg-zinc-800"
                    }
                    ${opt.value === value ? "bg-emerald-500/5" : ""}
                  `}
                >
                  {opt.icon && (
                    <span className={i === activeIndex ? "text-emerald-400" : "text-zinc-500"}>
                      {opt.icon}
                    </span>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {opt.label}
                    </div>
                    {opt.subtitle && (
                      <div className={`
                        text-xs truncate
                        ${i === activeIndex ? "text-emerald-400/70" : "text-zinc-500"}
                      `}>
                        {opt.subtitle}
                      </div>
                    )}
                  </div>
                  
                  {opt.value === value && (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
