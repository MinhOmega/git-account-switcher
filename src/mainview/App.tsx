import { useState, useEffect } from "react";
import { initializeRPC, useRPCRequest } from "./hooks/useRPC";
import { useAccounts } from "./hooks/useAccounts";
import { useSettings } from "./hooks/useSettings";
import MainWindow from "./components/MainWindow";
import WelcomeWizard from "./components/WelcomeWizard";
import SettingsView from "./components/SettingsView";

// Initialize RPC connection
initializeRPC();

type View = "main" | "settings" | "welcome";

function App() {
  const {
    accounts,
    activeAccount,
    isLoading,
    isSwitching,
    error,
    setError,
    addAccount,
    updateAccount,
    removeAccount,
    switchToAccount,
    getAccountForEdit,
    refresh,
  } = useAccounts();

  const {
    settings,
    gitConfig,
    cliStatus,
    updateSettings,
    refreshGitConfig,
    refreshCLIStatus,
  } = useSettings();

  const rpc = useRPCRequest();

  const [currentView, setCurrentView] = useState<View>("main");

  // Show welcome wizard on first launch
  useEffect(() => {
    if (settings && !settings.hasCompletedWelcome) {
      setCurrentView("welcome");
    }
  }, [settings]);

  const handleWelcomeComplete = async () => {
    await updateSettings({ hasCompletedWelcome: true });
    setCurrentView("main");
  };

  const handleOpenExternal = async (url: string) => {
    await rpc.openExternal({ url });
  };

  const handleCopyToClipboard = async (text: string) => {
    await rpc.copyToClipboard({ text });
  };

  const handleQuit = async () => {
    await rpc.quitApp({});
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-screen bg-github-dark">
        <div className="w-6 h-6 border-2 border-github-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentView === "welcome") {
    return (
      <WelcomeWizard
        onComplete={handleWelcomeComplete}
        onAddAccount={addAccount}
        onOpenExternal={handleOpenExternal}
        rpc={rpc}
      />
    );
  }

  if (currentView === "settings") {
    return (
      <SettingsView
        settings={settings}
        gitConfig={gitConfig}
        cliStatus={cliStatus}
        accounts={accounts}
        onUpdateSettings={updateSettings}
        onBack={() => setCurrentView("main")}
        onRemoveAccount={removeAccount}
        onOpenExternal={handleOpenExternal}
        onCopyToClipboard={handleCopyToClipboard}
        onRefreshCLIStatus={refreshCLIStatus}
        rpc={rpc}
      />
    );
  }

  return (
    <MainWindow
      accounts={accounts}
      activeAccount={activeAccount}
      isSwitching={isSwitching}
      error={error}
      gitConfig={gitConfig}
      settings={settings}
      onSwitchAccount={switchToAccount}
      onAddAccount={addAccount}
      onUpdateAccount={updateAccount}
      onRemoveAccount={removeAccount}
      onGetAccountForEdit={getAccountForEdit}
      onOpenSettings={() => setCurrentView("settings")}
      onClearError={() => setError(null)}
      onRefreshGitConfig={refreshGitConfig}
      onOpenExternal={handleOpenExternal}
      onCopyToClipboard={handleCopyToClipboard}
      onQuit={handleQuit}
      cliStatus={cliStatus}
      rpc={rpc}
    />
  );
}

export default App;
