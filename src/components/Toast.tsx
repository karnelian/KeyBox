import { create } from "zustand";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, type?: ToastItem["type"]) => void;
  remove: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = "info") => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function ToastContainer() {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) return null;

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-gray-200 dark:bg-gray-700",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${colors[toast.type]} text-gray-900 dark:text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => remove(toast.id)}
            className="text-gray-900/60 dark:text-white/60 hover:text-gray-900 dark:hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
