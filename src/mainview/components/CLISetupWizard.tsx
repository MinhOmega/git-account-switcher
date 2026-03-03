// Port of GitHubCLISetupView.swift (645 lines)
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GitHubCLIStatus } from "../../shared/types";
import StepIndicator from "./StepIndicator";

interface CLISetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyToClipboard: (text: string) => void;
  onOpenExternal: (url: string) => void;
  rpc: any;
}

type Step = 0 | 1 | 2 | 3; // welcome, install, login, complete

export default function CLISetupWizard({
  isOpen,
  onClose,
  onCopyToClipboard,
  onOpenExternal,
  rpc,
}: CLISetupWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [cliStatus, setCLIStatus] = useState<GitHubCLIStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const status = await rpc.getGitHubCLIStatus({});
      setCLIStatus(status);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) checkStatus();
  }, [isOpen]);

  const handleCopy = (text: string) => {
    onCopyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const stepContent = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-github-blue/20 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-github-blue" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.5 3.75a.25.25 0 0 1 .25-.25h8.5a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-8.5ZM3.75 2A1.75 1.75 0 0 0 2 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 12.25v-8.5A1.75 1.75 0 0 0 12.25 2h-8.5ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-github-gray-light mb-2">
              GitHub CLI Setup
            </h2>
            <p className="text-sm text-github-gray mb-6">
              The GitHub CLI (gh) enables enhanced account switching. Set it up for the best experience.
            </p>

            <div className="w-full space-y-2 mb-6">
              {[
                "Seamless CLI account switching",
                "Consistent authentication state",
                "Better integration with GitHub",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-github-dark-alt/40">
                  <svg className="w-3.5 h-3.5 text-github-blue flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                  <span className="text-xs text-github-gray-light">{benefit}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full px-4 py-2.5 rounded-lg gradient-green text-white text-sm font-medium spring-transition hover:brightness-110 active:scale-95"
            >
              Get Started
            </button>
          </div>
        );

      case 1: // Install
        return (
          <div className="flex flex-col items-center text-center">
            <h2 className="text-base font-semibold text-github-gray-light mb-1">
              Install GitHub CLI
            </h2>
            <p className="text-sm text-github-gray mb-4">
              {cliStatus?.isInstalled
                ? "GitHub CLI is already installed!"
                : "Install the GitHub CLI using Homebrew:"}
            </p>

            {cliStatus?.isInstalled ? (
              <div className="w-full p-3 rounded-lg bg-github-green/10 border border-github-green/20 text-sm text-github-green mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                Installed
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-github-dark border border-github-dark-border mb-3">
                  <code className="text-xs text-github-gray-light flex-1 font-mono">
                    brew install gh
                  </code>
                  <button
                    onClick={() => handleCopy("brew install gh")}
                    className="px-2 py-1 rounded text-[10px] text-github-blue bg-github-blue/10 hover:bg-github-blue/20 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={() => rpc.openTerminalForCLIInstall({})}
                  className="w-full px-3 py-2 rounded-lg bg-github-dark-border/50 text-sm text-github-gray-light hover:bg-github-dark-border transition-colors mb-3"
                >
                  Run in Terminal
                </button>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={async () => { await checkStatus(); setStep(cliStatus?.isInstalled ? 2 : 1); }}
                disabled={checking}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-github-gray-light bg-github-dark-border/50 hover:bg-github-dark-border transition-colors disabled:opacity-50"
              >
                {checking ? "Checking..." : "Check Again"}
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 rounded-lg gradient-green text-white text-sm font-medium spring-transition hover:brightness-110"
              >
                Next
              </button>
            </div>
          </div>
        );

      case 2: // Login
        return (
          <div className="flex flex-col items-center text-center">
            <h2 className="text-base font-semibold text-github-gray-light mb-1">
              Login to GitHub CLI
            </h2>
            <p className="text-sm text-github-gray mb-4">
              {cliStatus?.isLoggedIn
                ? "You're already logged in!"
                : "Authenticate with your GitHub accounts:"}
            </p>

            {cliStatus?.isLoggedIn ? (
              <div className="w-full p-3 rounded-lg bg-github-green/10 border border-github-green/20 text-sm text-github-green mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                Logged in
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-github-dark border border-github-dark-border mb-3">
                  <code className="text-xs text-github-gray-light flex-1 font-mono">
                    gh auth login
                  </code>
                  <button
                    onClick={() => handleCopy("gh auth login")}
                    className="px-2 py-1 rounded text-[10px] text-github-blue bg-github-blue/10 hover:bg-github-blue/20 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={() => rpc.openTerminalForCLILogin({})}
                  className="w-full px-3 py-2 rounded-lg bg-github-dark-border/50 text-sm text-github-gray-light hover:bg-github-dark-border transition-colors mb-3"
                >
                  Run in Terminal
                </button>
                <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 mb-3">
                  Run this command for each GitHub account you want to add.
                </div>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={async () => { await checkStatus(); }}
                disabled={checking}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-github-gray-light bg-github-dark-border/50 hover:bg-github-dark-border transition-colors disabled:opacity-50"
              >
                {checking ? "Checking..." : "Check Again"}
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2 rounded-lg gradient-green text-white text-sm font-medium spring-transition hover:brightness-110"
              >
                Next
              </button>
            </div>
          </div>
        );

      case 3: // Complete
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-github-green/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-github-green" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-github-gray-light mb-2">
              Setup Complete!
            </h2>
            <p className="text-sm text-github-gray mb-6">
              GitHub CLI is configured. Account switches will now also update your CLI session.
            </p>

            <div className="w-full space-y-2 mb-6">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-github-dark-alt/40">
                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${cliStatus?.isInstalled ? "text-github-green" : "text-github-gray"}`} fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                <span className="text-xs text-github-gray-light">GitHub CLI installed</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-github-dark-alt/40">
                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${cliStatus?.isLoggedIn ? "text-github-green" : "text-github-gray"}`} fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                <span className="text-xs text-github-gray-light">Authenticated</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-lg gradient-green text-white text-sm font-medium spring-transition hover:brightness-110 active:scale-95"
            >
              Done
            </button>
          </div>
        );
    }
  };

  return (
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
        className="glass-modal w-[400px] rounded-xl border border-github-dark-border shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <StepIndicator steps={4} currentStep={step} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {stepContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
