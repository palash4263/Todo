import { useRef } from 'react';
import { X } from 'lucide-react';

// Figma's 15×13 calendar glyph
export function CalendarIcon() {
  return (
    <svg aria-hidden width="15" height="13" viewBox="0 0 15 13" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="14" height="12" rx="1.5" />
      <path d="M0.5 3.5h14" />
      <g fill="currentColor" stroke="none">
        {[3.5, 6, 8.5, 11].flatMap((x) => [6, 8.5].map((y) => <rect key={`${x}-${y}`} x={x - 0.6} y={y - 0.6} width="1.2" height="1.2" />))}
      </g>
    </svg>
  );
}

// A styled date/time field: shows formatted text, with the native picker input laid invisibly on top
// (so phones get their own wheel/calendar UI). Desktop browsers open the picker via showPicker().
export default function PickerField({ id, type, label, value, onChange, display, placeholder, icon, trailingIcon, invalid, clearable, className = '' }) {
  const input = useRef(null);

  return (
    <div className={`relative flex h-10 items-center border bg-white text-sm text-ink transition-colors focus-within:border-brand ${invalid ? 'border-danger' : 'border-line'} ${className}`}>
      {icon}
      <span className="flex-1 truncate">{value ? display : placeholder}</span>
      {trailingIcon}
      <input
        ref={input}
        id={id}
        type={type}
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={() => {
          try {
            input.current?.showPicker();
          } catch {
            /* not supported: the browser's own behaviour still applies */
          }
        }}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
      {clearable && value && (
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()}`}
          onClick={() => onChange('')}
          className="relative z-10 mr-1.5 grid size-6 place-items-center rounded-full text-label hover:bg-line hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
