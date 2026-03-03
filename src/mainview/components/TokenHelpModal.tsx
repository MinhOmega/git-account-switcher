import { motion, AnimatePresence } from "framer-motion";
import { GITHUB_PAT_URL } from "../../shared/constants";

interface TokenHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExternal: (url: string) => void;
}

export default function TokenHelpModal({
  isOpen,
  onClose,
  onOpenExternal,
}: TokenHelpModalProps) {
  const steps = [
    "Go to GitHub Settings > Developer settings > Personal access tokens",
    'Click "Generate new token" (classic)',
    "Give it a descriptive name",
    "Select scopes: repo, read:user, user:email",
    "Click Generate token and copy it",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="glass-modal w-[360px] rounded-xl border border-github-dark-border p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-github-gray-light mb-1">
              Creating a Personal Access Token
            </h3>
            <p className="text-xs text-github-gray mb-4">
              Follow these steps to create a token on GitHub:
            </p>

            <ol className="space-y-2 mb-5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-github-dark-border flex items-center justify-center text-github-gray flex-shrink-0 text-[10px] font-medium">
                    {i + 1}
                  </span>
                  <span className="text-github-gray-light pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            <div className="px-3 py-2 rounded-lg bg-github-blue/10 border border-github-blue/20 mb-4">
              <p className="text-[11px] text-github-blue">
                Required scopes: <strong>repo</strong>, <strong>read:user</strong>, <strong>user:email</strong>
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => onOpenExternal(GITHUB_PAT_URL)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-github-blue bg-github-blue/10 hover:bg-github-blue/20 transition-colors"
              >
                Open GitHub Settings
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs text-github-gray-light bg-github-dark-border/50 hover:bg-github-dark-border transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
