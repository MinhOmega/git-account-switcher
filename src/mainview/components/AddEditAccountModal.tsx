import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GitAccountFormData, Result, GitAccountPublic } from "../../shared/types";
import {
  isValidEmail,
  isValidGitHubUsername,
  isValidGitHubToken,
  containsControlCharacters,
} from "../../shared/validation";
import TokenHelpModal from "./TokenHelpModal";

interface AddEditAccountModalProps {
  isOpen: boolean;
  editAccountId?: string | null;
  onClose: () => void;
  onSave: (data: GitAccountFormData) => Promise<Result<GitAccountPublic>>;
  onGetAccountForEdit?: (id: string) => Promise<Result<GitAccountFormData>>;
  onOpenExternal: (url: string) => void;
}

export default function AddEditAccountModal({
  isOpen,
  editAccountId,
  onClose,
  onSave,
  onGetAccountForEdit,
  onOpenExternal,
}: AddEditAccountModalProps) {
  const isEdit = !!editAccountId;

  const [form, setForm] = useState<GitAccountFormData>({
    displayName: "",
    githubUsername: "",
    personalAccessToken: "",
    gitUserName: "",
    gitUserEmail: "",
  });
  const [originalToken, setOriginalToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  useEffect(() => {
    if (isOpen && editAccountId && onGetAccountForEdit) {
      onGetAccountForEdit(editAccountId).then((result) => {
        if (result.success) {
          setForm(result.data);
          setOriginalToken(result.data.personalAccessToken);
        }
      });
    } else if (isOpen && !editAccountId) {
      setForm({
        displayName: "",
        githubUsername: "",
        personalAccessToken: "",
        gitUserName: "",
        gitUserEmail: "",
      });
      setOriginalToken("");
    }
    setError(null);
  }, [isOpen, editAccountId]);

  const validate = (): string | null => {
    if (!form.displayName.trim()) return "Display name is required";
    if (containsControlCharacters(form.displayName))
      return "Display name contains invalid characters";
    if (!form.githubUsername.trim()) return "GitHub username is required";
    if (!isValidGitHubUsername(form.githubUsername))
      return "Invalid GitHub username format";
    if (!isEdit || form.personalAccessToken !== originalToken) {
      if (!form.personalAccessToken.trim())
        return "Personal Access Token is required";
      if (!isValidGitHubToken(form.personalAccessToken))
        return "Invalid token format (expecting ghp_... or github_pat_...)";
    }
    if (!form.gitUserName.trim()) return "Git user name is required";
    if (containsControlCharacters(form.gitUserName))
      return "Git user name contains invalid characters";
    if (!form.gitUserEmail.trim()) return "Git email is required";
    if (!isValidEmail(form.gitUserEmail)) return "Invalid email format";
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await onSave(form);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof GitAccountFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-start justify-center pt-8 bg-black/60"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="glass-modal w-[380px] max-h-[480px] rounded-xl border border-github-dark-border shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-github-dark-border/50">
                <h2 className="text-sm font-semibold text-github-gray-light">
                  {isEdit ? "Edit Account" : "Add Account"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-github-gray hover:text-github-gray-light hover:bg-github-dark-border/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Display section */}
                <div>
                  <label className="block text-[11px] font-medium text-github-gray uppercase tracking-wider mb-1.5">
                    Display
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Personal, Work"
                    value={form.displayName}
                    onChange={(e) => updateField("displayName", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-github-dark border border-github-dark-border text-sm text-github-gray-light placeholder-github-gray-dark focus:outline-none focus:border-github-blue transition-colors"
                  />
                </div>

                {/* GitHub Credentials section */}
                <div>
                  <label className="block text-[11px] font-medium text-github-gray uppercase tracking-wider mb-1.5">
                    GitHub Credentials
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="GitHub Username"
                      value={form.githubUsername}
                      onChange={(e) => updateField("githubUsername", e.target.value)}
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="w-full px-3 py-2 rounded-lg bg-github-dark border border-github-dark-border text-sm text-github-gray-light placeholder-github-gray-dark focus:outline-none focus:border-github-blue transition-colors"
                    />
                    <div className="relative">
                      <input
                        type="password"
                        placeholder={isEdit ? "Token (unchanged if empty)" : "Personal Access Token"}
                        value={form.personalAccessToken}
                        onChange={(e) => updateField("personalAccessToken", e.target.value)}
                        className="w-full px-3 py-2 pr-8 rounded-lg bg-github-dark border border-github-dark-border text-sm text-github-gray-light placeholder-github-gray-dark focus:outline-none focus:border-github-blue transition-colors"
                      />
                      <button
                        onClick={() => setShowTokenHelp(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-github-gray hover:text-github-blue transition-colors"
                        title="Token help"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.92 6.085h.001a.749.749 0 1 1-1.342-.67c.169-.339.436-.701.849-.977C6.845 4.16 7.369 4 8 4a2.756 2.756 0 0 1 1.637.525c.503.377.863.965.863 1.725 0 .448-.115.83-.329 1.15-.205.307-.47.513-.692.662-.109.072-.22.138-.313.195l-.006.004a6.24 6.24 0 0 0-.26.16.952.952 0 0 0-.276.245.75.75 0 0 1-1.248-.832c.184-.264.42-.489.692-.661.103-.067.207-.132.313-.195l.007-.004c.1-.064.183-.12.253-.174a1.31 1.31 0 0 0 .36-.416.81.81 0 0 0 .123-.434c0-.249-.112-.46-.329-.623A1.267 1.267 0 0 0 8 5.5c-.377 0-.59.1-.726.19a1.02 1.02 0 0 0-.355.395ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Git Config section */}
                <div>
                  <label className="block text-[11px] font-medium text-github-gray uppercase tracking-wider mb-1.5">
                    Git Config
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Git User Name (for commits)"
                      value={form.gitUserName}
                      onChange={(e) => updateField("gitUserName", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-github-dark border border-github-dark-border text-sm text-github-gray-light placeholder-github-gray-dark focus:outline-none focus:border-github-blue transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="Git Email (for commits)"
                      value={form.gitUserEmail}
                      onChange={(e) => updateField("gitUserEmail", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-github-dark border border-github-dark-border text-sm text-github-gray-light placeholder-github-gray-dark focus:outline-none focus:border-github-blue transition-colors"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 px-5 py-3 border-t border-github-dark-border/50">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg text-sm text-github-gray-light bg-github-dark-border/50 hover:bg-github-dark-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-github-green hover:bg-github-green-dark transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && (
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                    </svg>
                  )}
                  {isEdit ? "Save" : "Add"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TokenHelpModal
        isOpen={showTokenHelp}
        onClose={() => setShowTokenHelp(false)}
        onOpenExternal={onOpenExternal}
      />
    </>
  );
}
