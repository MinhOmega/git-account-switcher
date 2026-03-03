import { useState, useEffect, useCallback } from "react";
import type { AppSettings, GitConfigState, GitHubCLIStatus } from "../../shared/types";
import { useRPCRequest } from "./useRPC";

export function useSettings() {
  const rpc = useRPCRequest();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [gitConfig, setGitConfig] = useState<GitConfigState | null>(null);
  const [cliStatus, setCLIStatus] = useState<GitHubCLIStatus | null>(null);

  const loadSettings = useCallback(async () => {
    const s = await rpc.getSettings({});
    setSettings(s);
  }, [rpc]);

  const loadGitConfig = useCallback(async () => {
    const config = await rpc.getGitConfig({});
    setGitConfig(config);
  }, [rpc]);

  const loadCLIStatus = useCallback(async () => {
    const status = await rpc.getGitHubCLIStatus({});
    setCLIStatus(status);
  }, [rpc]);

  useEffect(() => {
    loadSettings();
    loadGitConfig();
    loadCLIStatus();
  }, [loadSettings, loadGitConfig, loadCLIStatus]);

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = await rpc.updateSettings({ settings: partial });
      setSettings(updated);
    },
    [rpc],
  );

  const refreshGitConfig = useCallback(async () => {
    const config = await rpc.refreshGitConfig({});
    setGitConfig(config);
  }, [rpc]);

  return {
    settings,
    gitConfig,
    cliStatus,
    updateSettings,
    refreshGitConfig,
    refreshCLIStatus: loadCLIStatus,
  };
}
