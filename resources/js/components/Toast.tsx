import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastListeners: Array<(toast: ToastItem) => void> = [];

export const toast = {
  success: (message: string) => {
    const item: ToastItem = { id: Date.now(), type: 'success', message };
    toastListeners.forEach(fn => fn(item));
  },
  error: (message: string) => {
    const item: ToastItem = { id: Date.now(), type: 'error', message };
    toastListeners.forEach(fn => fn(item));
  },
  info: (message: string) => {
    const item: ToastItem = { id: Date.now(), type: 'info', message };
    toastListeners.forEach(fn => fn(item));
  },
};

const icons = {
  success: <CheckCircle size={16} color="#4ade80" />,
  error: <XCircle size={16} color="#f87171" />,
  info: <Info size={16} color="#fbbf24" />,
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (t: ToastItem) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 3500);
    };

    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter(l => l !== listener); };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="bg-none border-none cursor-pointer text-[var(--text-muted)] flex"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
