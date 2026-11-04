import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const show = useCallback((message, { action, tone = 'default', duration = 4000 } = {}) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, action, tone });
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[116px] z-50">
        {toast && (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto absolute left-1/2 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-toast items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
              toast.tone === 'error' ? 'bg-danger' : 'bg-ink'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="font-semibold text-brand-100 hover:text-white"
                onClick={() => {
                  toast.action.onClick();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
