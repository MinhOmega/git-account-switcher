import { useState } from "react";
import { motion } from "framer-motion";
import type { GitAccountPublic } from "../../shared/types";

interface AccountCardProps {
  account: GitAccountPublic;
  isSwitching: boolean;
  onSwitch: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AccountCard({
  account,
  isSwitching,
  onSwitch,
  onEdit,
  onDelete,
}: AccountCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const initial = account.displayName.charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`relative rounded-xl p-4 border transition-all duration-200 ${
        account.isActive
          ? "border-github-green/50 active-glow bg-gradient-to-br from-github-green-dark/20 to-github-green/10"
          : "border-github-dark-border hover:border-github-gray-dark/60 bg-github-dark-alt/60"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
            account.isActive ? "gradient-green" : "gradient-indigo"
          }`}
        >
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-github-gray-light truncate">
              {account.displayName}
            </span>
            {account.isActive && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-github-green/20 text-github-green-light">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                ACTIVE
              </span>
            )}
          </div>
          <div className="text-xs text-github-gray truncate">
            @{account.githubUsername}
          </div>
          <div className="text-xs text-github-gray-dark truncate">
            {account.gitUserEmail}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 no-drag">
          {!account.isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); onSwitch(); }}
              disabled={isSwitching}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-github-green/20 text-github-green-light hover:bg-github-green/30 transition-colors disabled:opacity-50"
            >
              {isSwitching ? (
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                  </svg>
                  ...
                </span>
              ) : (
                "Switch"
              )}
            </button>
          )}

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded-md text-github-gray hover:text-github-gray-light hover:bg-github-dark-border/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-32 rounded-lg bg-github-dark-alt border border-github-dark-border shadow-xl py-1 animate-fade-in">
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-github-gray-light hover:bg-github-dark-border/50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
