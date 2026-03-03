import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="glass-modal w-80 rounded-xl border border-github-dark-border p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-github-gray-light mb-2">
              {title}
            </h3>
            <p className="text-sm text-github-gray mb-5">{message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-1.5 rounded-lg text-sm text-github-gray-light bg-github-dark-border/50 hover:bg-github-dark-border transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors ${
                  danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-github-green hover:bg-github-green-dark"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
