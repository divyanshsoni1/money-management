interface MetricFieldProps {
  label: string;
  value: string;
  helper?: string;
  highlighted?: boolean;
  prefix?: string;
  suffix?: string;
  /** If provided, the field becomes an editable input */
  onChange?: (v: string) => void;
  inputMode?: "numeric" | "decimal" | "text";
  placeholder?: string;
}

export default function MetricField({
  label,
  value,
  helper,
  highlighted = false,
  prefix,
  suffix,
  onChange,
  inputMode = "numeric",
  placeholder = "0",
}: MetricFieldProps) {
  const isEditable = typeof onChange === "function";

  const containerClasses = `
    flex items-center gap-2 rounded-lg px-3 py-3 min-h-[52px]
    ${
      highlighted
        ? "bg-amber-950/40 border border-amber-500/60 shadow-[0_0_12px_rgba(217,119,6,0.2)]"
        : "bg-[#1c1c1e] border border-white/8"
    }
  `;

  const textClasses = `text-xl sm:text-2xl font-bold truncate ${
    highlighted ? "text-amber-300" : "text-white"
  }`;

  const prefixClasses = `text-lg font-semibold shrink-0 ${
    highlighted ? "text-amber-400" : "text-gray-300"
  }`;

  const suffixClasses = `text-base font-semibold ml-auto shrink-0 ${
    highlighted ? "text-amber-400" : "text-gray-400"
  }`;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs sm:text-sm font-medium text-gray-400 tracking-wide">
        {label}
      </span>

      <div className={containerClasses}>
        {prefix && <span className={prefixClasses}>{prefix}</span>}

        {isEditable ? (
          <input
            type="text"
            inputMode={inputMode}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`
              ${textClasses}
              flex-1 min-w-0 bg-transparent border-none outline-none
              caret-amber-400 selection:bg-amber-400/30
            `}
            aria-label={label}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        ) : (
          <span className={`${textClasses} flex-1 min-w-0`}>{value}</span>
        )}

        {suffix && <span className={suffixClasses}>{suffix}</span>}
      </div>

      {helper && (
        <span className="text-xs text-gray-600 mt-0.5">{helper}</span>
      )}
    </div>
  );
}
