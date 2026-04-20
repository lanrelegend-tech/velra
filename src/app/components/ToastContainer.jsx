

"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {typeof window !== "undefined" &&
        createPortal(
          <div className="fixed top-5 right-5 flex flex-col gap-3 z-[9999]">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                onClick={() => removeToast(toast.id)}
                className={`px-4 py-3 rounded shadow text-white cursor-pointer transition
                  ${toast.type === "error" ? "bg-red-500" : "bg-black"}`}
              >
                {toast.message}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}