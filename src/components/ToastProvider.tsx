"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
  (message: string, type: ToastType = "info") => {
    const id = Date.now();

    // Sirf ek toast rakho
    setToasts([{ id, message, type }]);

    // 6 seconds baad toast remove
    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((t) => t.id !== id)
      );
    }, 6000);
  },
  []
);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto px-5 py-3.5 rounded-xl border flex items-center gap-3 min-w-[300px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] transform transition-all animate-slide-up bg-black/90 backdrop-blur-md"
            style={{
              borderColor:
                t.type === "success"
                  ? "rgba(250,210,147,0.4)"
                  : t.type === "error"
                  ? "rgba(239,68,68,0.4)"
                  : "rgba(255,255,255,0.15)",
            }}
          >
            {t.type === "success" && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(250,210,147,0.15), rgba(206,164,107,0.05))",
                  border: "1px solid rgba(250,210,147,0.3)",
                  color: "#FAD293",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {t.type === "error" && (
              <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            {t.type === "info" && (
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            <p className="text-sm text-white/90 font-medium">{t.message}</p>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes slide-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
