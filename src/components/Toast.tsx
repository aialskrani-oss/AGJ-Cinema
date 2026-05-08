import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

function SingleToast({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 2500);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const Icon =
    toast.type === "success" ? CheckCircle : toast.type === "error" ? XCircle : Info;
  const iconColor =
    toast.type === "success" ? "text-green-400" : toast.type === "error" ? "text-red-400" : "text-cyan-400";

  return (
    <div
      className={`flex items-center gap-3 bg-[#1e1e1e] border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 w-max max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <SingleToast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
