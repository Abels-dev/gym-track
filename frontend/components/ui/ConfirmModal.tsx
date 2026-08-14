import { X } from "lucide-react";
import { useEffect } from "react";

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold tracking-tight mb-2">{title}</h2>
          <p className="text-sm opacity-70 mb-8">{description}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border border-border hover:bg-border/50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                isDestructive
                  ? "bg-tag-red-bg text-tag-red-text border border-tag-red-text/20 hover:opacity-80"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
