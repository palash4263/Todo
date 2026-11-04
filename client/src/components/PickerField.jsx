import { useRef } from 'react';
import { X } from 'lucide-react';

// A styled date/time field: shows formatted text, with the native picker input laid invisibly on top
// (so phones get their own wheel/calendar UI). Desktop browsers open the picker via showPicker().
export default function PickerField({ id, type, label, value, onChange, display, placeholder, icon: Icon, iconSide = 'left', invalid, clearable }) {
  const input = useRef(null);

  return (
    <div
      className={`relative flex h-11 items-center gap-2.5 rounded border bg-white px-3 text-[13px] transition-colors focus-within:border-brand ${
        invalid ? 'border-danger' : 'border-line'
      }`}
    >
      {iconSide === 'left' && <Icon aria-hidden className="size-3.5 shrink-0 text-ink" />}
      <span className={`flex-1 truncate ${value ? 'text-ink' : 'text-ink/80'}`}>{value ? display : placeholder}</span>
      {iconSide === 'right' && <Icon aria-hidden className="size-4 shrink-0 text-ink" />}
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
          className="relative z-10 -mr-1 grid size-6 place-items-center rounded-full text-muted hover:bg-line hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
