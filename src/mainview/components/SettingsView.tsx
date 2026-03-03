// Port of SettingsView, GeneralSettingsView, AccountsSettingsView, AboutView
import { useState } from "react";
import { motion } from "framer-motion";
import type {
  GitAccountPublic,
  AppSettings,
  GitConfigState,
  GitHubCLIStatus,
  Result,
} from "../../shared/types";
import { APP_NAME, APP_VERSION, GITHUB_REPO_URL } from "../../shared/constants";
import CLISetupWizard from "./CLISetupWizard";

type Tab = "general" | "accounts" | "about";

interface SettingsViewProps {
  settings: AppSettings;
  gitConfig: GitConfigState | null;
  cliStatus: GitHubCLIStatus | null;
  accounts: GitAccountPublic[];
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onBack: () => void;
  onRemoveAccount: (id: string) => Promise<Result<null>>;
  onOpenExternal: (url: string) => void;
  onCopyToClipboard: (text: string) => void;
  onRefreshCLIStatus: () => void;
  rpc: any;
}

export default function SettingsView({
  settings,
  gitConfig,
  cliStatus,
  accounts,
  onUpdateSettings,
  onBack,
  onRemoveAccount,
  onOpenExternal,
  onCopyToClipboard,
  onRefreshCLIStatus,
  rpc,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [showCLISetup, setShowCLISetup] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "accounts", label: "Accounts" },
    { id: "about", label: "About" },
  ];

  return (
    <div className="h-screen flex flex-col bg-github-dark overflow-hidden">
      {/* Header */}
      <div className="glass-header flex items-center justify-between pl-[78px] pr-4 py-2.5 border-b border-github-dark-border/50 drag-region flex-shrink-0">
        <div className="flex items-center gap-2 no-drag">
          <button
            onClick={onBack}
            className="p-1 rounded-md text-github-gray hover:text-github-gray-light hover:bg-github-dark-border/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
            </svg>
          </button>
          <h1 className="text-xs font-semibold text-github-gray-light">
            Settings
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-3 gap-1 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-github-dark-border text-github-gray-light"
                : "text-github-gray hover:text-github-gray-light"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "general" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <ToggleRow
                label="Show notifications on switch"
                description="Display a system notification when switching accounts"
                checked={settings.showNotificationOnSwitch}
                onChange={(v) => onUpdateSettings({ showNotificationOnSwitch: v })}
              />
              <ToggleRow
                label="Enable visual effects"
                description="Glass effects and spring animations"
                checked={settings.enableVisualEffects}
                onChange={(v) => onUpdateSettings({ enableVisualEffects: v })}
              />
              <ToggleRow
                label="Launch at login"
                description="Start automatically when you log in"
                checked={settings.launchAtLogin}
                onChange={(v) => onUpdateSettings({ launchAtLogin: v })}
              />
            </div>

            {/* CLI Status */}
            <div className="pt-2">
              <h3 className="text-[11px] font-medium text-github-gray uppercase tracking-wider mb-2">
                GitHub CLI
              </h3>
              <div className="p-3 rounded-lg bg-github-dark-alt border border-github-dark-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cliStatus?.isInstalled ? "bg-github-green" : "bg-github-gray-dark"}`} />
                    <span className="text-xs text-github-gray-light">
                      {cliStatus?.isInstalled
                        ? cliStatus.isLoggedIn
                          ? "Installed & Logged in"
                          : "Installed (not logged in)"
                        : "Not installed"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCLISetup(true)}
                    className="px-2 py-1 rounded text-[10px] text-github-blue bg-github-blue/10 hover:bg-github-blue/20 transition-colors"
                  >
                    Setup
                  </button>
                </div>
                {cliStatus?.authenticatedAccounts && cliStatus.authenticatedAccounts.length > 0 && (
                  <div className="text-[10px] text-github-gray">
                    Accounts: {cliStatus.authenticatedAccounts.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "accounts" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {accounts.length === 0 ? (
              <p className="text-xs text-github-gray text-center py-8">
                No accounts configured
              </p>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-github-dark-alt border border-github-dark-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                        account.isActive ? "gradient-green" : "gradient-indigo"
                      }`}
                    >
                      {account.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-github-gray-light">
                          {account.displayName}
                        </span>
                        {account.isActive && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-github-green/20 text-github-green">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-github-gray">
                        @{account.githubUsername}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveAccount(account.id)}
                    className="p-1.5 rounded-md text-github-gray hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "about" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center py-6"
          >
            <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-github-gray-light">
              {APP_NAME}
            </h2>
            <p className="text-xs text-github-gray mb-1">Version {APP_VERSION}</p>
            <p className="text-xs text-github-gray mb-4 max-w-[250px]">
              Switch between multiple GitHub accounts seamlessly. Updates Keychain, git config, and GitHub CLI.
            </p>
            <p className="text-xs text-github-gray mb-4">
              Built with Electrobun + React + Tailwind
            </p>
            <button
              onClick={() => onOpenExternal(GITHUB_REPO_URL)}
              className="px-4 py-1.5 rounded-lg text-xs text-github-blue bg-github-blue/10 hover:bg-github-blue/20 transition-colors"
            >
              View on GitHub
            </button>
          </motion.div>
        )}
      </div>

      <CLISetupWizard
        isOpen={showCLISetup}
        onClose={() => {
          setShowCLISetup(false);
          onRefreshCLIStatus();
        }}
        onCopyToClipboard={onCopyToClipboard}
        onOpenExternal={onOpenExternal}
        rpc={rpc}
      />
    </div>
  );
}

// Toggle row component
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-github-dark-alt border border-github-dark-border">
      <div>
        <div className="text-xs font-medium text-github-gray-light">
          {label}
        </div>
        <div className="text-[10px] text-github-gray">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? "bg-github-green" : "bg-github-dark-border"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
