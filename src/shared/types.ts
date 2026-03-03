// Mirrors Swift GitAccount struct from GitAccount.swift
export interface GitAccount {
  id: string;
  displayName: string;
  githubUsername: string;
  personalAccessToken: string;
  gitUserName: string;
  gitUserEmail: string;
  isActive: boolean;
  createdAt: string; // ISO 8601
  lastUsedAt: string | null;
}

// Safe version without token for webview display
export type GitAccountPublic = Omit<GitAccount, "personalAccessToken"> & {
  hasToken: boolean;
  maskedToken: string;
};

// Form data for creating/updating accounts
export interface GitAccountFormData {
  id?: string;
  displayName: string;
  githubUsername: string;
  personalAccessToken: string;
  gitUserName: string;
  gitUserEmail: string;
}

// Current git configuration state
export interface GitConfigState {
  userName: string | null;
  userEmail: string | null;
  credentialHelper: string | null;
}

// GitHub CLI status
export interface GitHubCLIStatus {
  isInstalled: boolean;
  isLoggedIn: boolean;
  authenticatedAccounts: string[];
  installCommand: string;
  loginCommand: string;
}

// App settings
export interface AppSettings {
  showNotificationOnSwitch: boolean;
  enableVisualEffects: boolean;
  launchAtLogin: boolean;
  hasCompletedWelcome: boolean;
  hasCompletedCLISetup: boolean;
}

// Result type for RPC responses
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Discovered keychain credential
export interface KeychainCredential {
  username: string;
  token: string;
}

// Helper to create a public account from full account
export function toPublicAccount(account: GitAccount): GitAccountPublic {
  const { personalAccessToken, ...rest } = account;
  return {
    ...rest,
    hasToken: personalAccessToken.length > 0,
    maskedToken: maskToken(personalAccessToken),
  };
}

function maskToken(token: string): string {
  if (!token || token.length < 8) return "****";
  const prefix = token.slice(0, 4);
  const suffix = token.slice(-4);
  return `${prefix}${"*".repeat(Math.min(token.length - 8, 20))}${suffix}`;
}
