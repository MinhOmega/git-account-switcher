import type { RPCSchema } from "electrobun/bun";
import type {
  GitAccountPublic,
  GitAccountFormData,
  GitConfigState,
  GitHubCLIStatus,
  AppSettings,
  Result,
  KeychainCredential,
} from "./types";

export type MainViewRPC = {
  bun: RPCSchema<{
    requests: {
      // Account CRUD
      getAccounts: {
        params: Record<string, never>;
        response: GitAccountPublic[];
      };
      getActiveAccount: {
        params: Record<string, never>;
        response: GitAccountPublic | null;
      };
      addAccount: {
        params: { account: GitAccountFormData };
        response: Result<GitAccountPublic>;
      };
      updateAccount: {
        params: { account: GitAccountFormData };
        response: Result<GitAccountPublic>;
      };
      removeAccount: {
        params: { accountId: string };
        response: Result<null>;
      };
      switchToAccount: {
        params: { accountId: string };
        response: Result<null>;
      };
      getAccountForEdit: {
        params: { accountId: string };
        response: Result<GitAccountFormData>;
      };

      // Git config
      getGitConfig: {
        params: Record<string, never>;
        response: GitConfigState;
      };
      refreshGitConfig: {
        params: Record<string, never>;
        response: GitConfigState;
      };

      // GitHub CLI
      getGitHubCLIStatus: {
        params: Record<string, never>;
        response: GitHubCLIStatus;
      };
      openTerminalForCLILogin: {
        params: Record<string, never>;
        response: null;
      };
      openTerminalForCLIInstall: {
        params: Record<string, never>;
        response: null;
      };

      // Keychain / credential discovery
      discoverKeychainCredential: {
        params: Record<string, never>;
        response: Result<KeychainCredential | null>;
      };

      // Settings
      getSettings: {
        params: Record<string, never>;
        response: AppSettings;
      };
      updateSettings: {
        params: { settings: Partial<AppSettings> };
        response: AppSettings;
      };

      // Utility
      copyToClipboard: {
        params: { text: string };
        response: null;
      };
      openExternal: {
        params: { url: string };
        response: null;
      };
      quitApp: {
        params: Record<string, never>;
        response: null;
      };
    };
    messages: {
      logFromView: { msg: string };
    };
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: {
      accountsUpdated: { accounts: GitAccountPublic[] };
      activeAccountChanged: { account: GitAccountPublic | null };
      gitConfigUpdated: { config: GitConfigState };
      switchStarted: { accountId: string };
      switchCompleted: {
        accountId: string;
        success: boolean;
        error?: string;
      };
      settingsUpdated: { settings: AppSettings };
    };
  }>;
};
