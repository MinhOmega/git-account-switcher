// Port of WelcomeView.swift (466 lines)
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GitAccountFormData, GitAccountPublic, Result, KeychainCredential } from "../../shared/types";
import StepIndicator from "./StepIndicator";

type WizardStep = "welcome" | "discovering" | "found" | "not-found";

interface WelcomeWizardProps {
  onComplete: () => void;
  onAddAccount: (data: GitAccountFormData) => Promise<Result<GitAccountPublic>>;
  onOpenExternal: (url: string) => void;
  rpc: any;
}

export default function WelcomeWizard({
  onComplete,
  onAddAccount,
  onOpenExternal,
  rpc,
}: WelcomeWizardProps) {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [credential, setCredential] = useState<KeychainCredential | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    setStep("discovering");
    setError(null);
    try {
      const result = await rpc.discoverKeychainCredential({});
      if (result.success && result.data) {
        setCredential(result.data);
        setStep("found");
      } else {
        setStep("not-found");
      }
    } catch {
      setStep("not-found");
    }
  };

  const handleImport = async () => {
    if (!credential) return;
    try {
      await onAddAccount({
        displayName: credential.username,
        githubUsername: credential.username,
        personalAccessToken: credential.token,
        gitUserName: credential.username,
        gitUserEmail: `${credential.username}@users.noreply.github.com`,
      });
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import");
    }
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return "****";
    return `${token.slice(0, 4)}${"*".repeat(12)}${token.slice(-4)}`;
  };

  const features = [
    { label: "Switch accounts instantly", icon: "\u26A1" },
    { label: "Secure Keychain storage", icon: "\uD83D\uDD12" },
    { label: "Auto-update git config", icon: "\u2699\uFE0F" },
    { label: "Switch notifications", icon: "\uD83D\uDD14" },
  ];

  return (
    <div className="h-screen flex flex-col bg-github-dark">
      {/* Draggable title bar - provides space for macOS traffic light buttons */}
      <div className="h-10 drag-region flex-shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center w-full max-w-sm"
            >
              <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                </svg>
              </div>

              <h1 className="text-xl font-bold text-github-gray-light mb-2">
                Welcome to Git Account Switcher
              </h1>
              <p className="text-sm text-github-gray mb-6">
                Switch between multiple GitHub accounts with a single click.
              </p>

              <div className="w-full space-y-2 mb-6">
                {features.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-github-dark-alt/60 border border-github-dark-border/30"
                  >
                    <span className="text-base">{f.icon}</span>
                    <span className="text-xs text-github-gray-light">{f.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDiscover}
                  className="flex-1 px-4 py-2.5 rounded-lg gradient-green text-white text-sm font-medium spring-transition hover:brightness-110 active:scale-95"
                >
                  Check Existing Credentials
                </button>
                <button
                  onClick={onComplete}
                  className="px-4 py-2.5 rounded-lg bg-github-dark-border/50 text-github-gray-light text-sm hover:bg-github-dark-border transition-colors"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {step === "discovering" && (
            <motion.div
              key="discovering"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-8 h-8 border-2 border-github-green border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-github-gray">
                Checking for existing GitHub credentials...
              </p>
            </motion.div>
          )}

          {step === "found" && credential && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center w-full max-w-sm"
            >
              <div className="w-12 h-12 rounded-full bg-github-green/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-github-green" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
              </div>

              <h2 className="text-lg font-semibold text-github-gray-light mb-1">
                Credential Found!
              </h2>
              <p className="text-sm text-github-gray mb-4">
                Found an existing GitHub credential in your Keychain.
              </p>

              <div className="w-full p-4 rounded-lg bg-github-dark-alt border border-github-dark-border mb-4">
                <div className="text-sm text-github-gray-light font-medium mb-1">
                  @{credential.username}
                </div>
                <div className="text-xs text-github-gray font-mono">
                  {maskToken(credential.token)}
                </div>
              </div>

              {error && (
                <div className="w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleImport}
                  className="flex-1 px-4 py-2.5 rounded-lg gradient-green text-white text-sm font-medium spring-transition hover:brightness-110 active:scale-95"
                >
                  Import & Continue
                </button>
                <button
                  onClick={onComplete}
                  className="px-4 py-2.5 rounded-lg bg-github-dark-border/50 text-github-gray-light text-sm hover:bg-github-dark-border transition-colors"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {step === "not-found" && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center w-full max-w-sm"
            >
              <div className="w-12 h-12 rounded-full bg-github-gray-dark/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-github-gray" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.92 6.085h.001a.749.749 0 1 1-1.342-.67c.169-.339.436-.701.849-.977C6.845 4.16 7.369 4 8 4a2.756 2.756 0 0 1 1.637.525c.503.377.863.965.863 1.725 0 .448-.115.83-.329 1.15-.205.307-.47.513-.692.662-.109.072-.22.138-.313.195l-.006.004a6.24 6.24 0 0 0-.26.16.952.952 0 0 0-.276.245.75.75 0 0 1-1.248-.832c.184-.264.42-.489.692-.661.103-.067.207-.132.313-.195l.007-.004c.1-.064.183-.12.253-.174a1.31 1.31 0 0 0 .36-.416.81.81 0 0 0 .123-.434c0-.249-.112-.46-.329-.623A1.267 1.267 0 0 0 8 5.5c-.377 0-.59.1-.726.19a1.02 1.02 0 0 0-.355.395ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                </svg>
              </div>

              <h2 className="text-lg font-semibold text-github-gray-light mb-1">
                No Credential Found
              </h2>
              <p className="text-sm text-github-gray mb-6">
                No existing GitHub credential was found. You can add your first account manually.
              </p>

              <button
                onClick={onComplete}
                className="w-full px-4 py-2.5 rounded-lg gradient-green text-white text-sm font-medium spring-transition hover:brightness-110 active:scale-95"
              >
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
