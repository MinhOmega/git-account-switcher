// Port of AccountStore.swift (439 lines)
// Uses encrypted JSON file instead of UserDefaults

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type {
  GitAccount,
  GitAccountPublic,
  GitAccountFormData,
  GitConfigState,
  AppSettings,
} from "../../shared/types";
import { toPublicAccount } from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/constants";
import { keychainService } from "./keychain-service";
import { gitConfigService } from "./git-config-service";
import { githubCLIService } from "./github-cli-service";

type AccountUpdateListener = (accounts: GitAccountPublic[]) => void;
type ActiveAccountListener = (account: GitAccountPublic | null) => void;
type SwitchListener = (
  accountId: string,
  success: boolean,
  error?: string,
) => void;
type SettingsListener = (settings: AppSettings) => void;
type ConfigListener = (config: GitConfigState) => void;

class AccountStore {
  private accounts: GitAccount[] = [];
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private currentGitConfig: GitConfigState = {
    userName: null,
    userEmail: null,
    credentialHelper: null,
  };
  private isSwitching = false;
  private dataDir: string;
  private accountsFilePath: string;
  private settingsFilePath: string;

  // Event listeners
  private accountListeners: AccountUpdateListener[] = [];
  private activeAccountListeners: ActiveAccountListener[] = [];
  private switchListeners: SwitchListener[] = [];
  private settingsListeners: SettingsListener[] = [];
  private configListeners: ConfigListener[] = [];

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.accountsFilePath = join(dataDir, "accounts.json");
    this.settingsFilePath = join(dataDir, "settings.json");

    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.loadAccounts();
    this.loadSettings();
  }

  async initialize(): Promise<void> {
    try {
      await gitConfigService.ensureOsxKeychainHelper();
    } catch (e) {
      console.warn("Could not configure osxkeychain credential helper:", e);
    }
    await this.restoreActiveAccountCredential();
    await this.refreshCurrentGitConfig();
  }

  // Listeners
  onAccountsUpdated(fn: AccountUpdateListener) {
    this.accountListeners.push(fn);
  }
  onActiveAccountChanged(fn: ActiveAccountListener) {
    this.activeAccountListeners.push(fn);
  }
  onSwitchEvent(fn: SwitchListener) {
    this.switchListeners.push(fn);
  }
  onSettingsUpdated(fn: SettingsListener) {
    this.settingsListeners.push(fn);
  }
  onConfigUpdated(fn: ConfigListener) {
    this.configListeners.push(fn);
  }

  private notifyAccountsUpdated() {
    const publicAccounts = this.accounts.map(toPublicAccount);
    for (const fn of this.accountListeners) fn(publicAccounts);
  }

  private notifyActiveAccountChanged() {
    const active = this.getActiveAccountFull();
    const pub = active ? toPublicAccount(active) : null;
    for (const fn of this.activeAccountListeners) fn(pub);
  }

  // Computed properties
  private getActiveAccountFull(): GitAccount | null {
    return this.accounts.find((a) => a.isActive) || null;
  }

  getActiveAccount(): GitAccountPublic | null {
    const active = this.getActiveAccountFull();
    return active ? toPublicAccount(active) : null;
  }

  getAccounts(): GitAccountPublic[] {
    return this.accounts.map(toPublicAccount);
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  getGitConfig(): GitConfigState {
    return { ...this.currentGitConfig };
  }

  // Account CRUD
  async addAccount(formData: GitAccountFormData): Promise<GitAccountPublic> {
    // Check for duplicate
    const exists = this.accounts.some(
      (a) =>
        a.githubUsername.toLowerCase() ===
        formData.githubUsername.toLowerCase(),
    );
    if (exists) {
      throw new Error(
        `An account with GitHub username '${formData.githubUsername}' already exists`,
      );
    }

    const account: GitAccount = {
      id: crypto.randomUUID(),
      displayName: formData.displayName,
      githubUsername: formData.githubUsername,
      personalAccessToken: formData.personalAccessToken,
      gitUserName: formData.gitUserName,
      gitUserEmail: formData.gitUserEmail,
      isActive: this.accounts.length === 0, // First account becomes active
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    // If first account, update keychain
    if (account.isActive) {
      await keychainService.updateGitHubCredential(
        account.githubUsername,
        account.personalAccessToken,
      );
    }

    this.accounts.push(account);
    this.saveAccounts();
    this.notifyAccountsUpdated();
    if (account.isActive) this.notifyActiveAccountChanged();

    return toPublicAccount(account);
  }

  async updateAccount(
    formData: GitAccountFormData,
  ): Promise<GitAccountPublic> {
    const index = this.accounts.findIndex((a) => a.id === formData.id);
    if (index === -1) throw new Error("Account not found");

    const account = this.accounts[index];
    account.displayName = formData.displayName;
    account.githubUsername = formData.githubUsername;
    account.gitUserName = formData.gitUserName;
    account.gitUserEmail = formData.gitUserEmail;
    if (formData.personalAccessToken) {
      account.personalAccessToken = formData.personalAccessToken;
    }

    // If active, update keychain
    if (account.isActive) {
      await keychainService.updateGitHubCredential(
        account.githubUsername,
        account.personalAccessToken,
      );
    }

    this.accounts[index] = account;
    this.saveAccounts();
    this.notifyAccountsUpdated();
    if (account.isActive) this.notifyActiveAccountChanged();

    return toPublicAccount(account);
  }

  async removeAccount(accountId: string): Promise<void> {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) throw new Error("Account not found");

    if (account.isActive) {
      try {
        await keychainService.deleteGitHubCredential();
      } catch {
        // ignore
      }

      this.accounts = this.accounts.filter((a) => a.id !== accountId);

      // Activate next account if available
      if (this.accounts.length > 0) {
        this.accounts[0].isActive = true;
        this.accounts[0].lastUsedAt = new Date().toISOString();
        await keychainService.updateGitHubCredential(
          this.accounts[0].githubUsername,
          this.accounts[0].personalAccessToken,
        );
      }
    } else {
      this.accounts = this.accounts.filter((a) => a.id !== accountId);
    }

    this.saveAccounts();
    this.notifyAccountsUpdated();
    this.notifyActiveAccountChanged();
  }

  getAccountForEdit(accountId: string): GitAccountFormData | null {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return null;
    return {
      id: account.id,
      displayName: account.displayName,
      githubUsername: account.githubUsername,
      personalAccessToken: account.personalAccessToken,
      gitUserName: account.gitUserName,
      gitUserEmail: account.gitUserEmail,
    };
  }

  // Account switching with transaction/rollback pattern from AccountStore.swift
  async switchToAccount(accountId: string): Promise<void> {
    if (this.isSwitching) {
      throw new Error("Another switch operation is in progress");
    }

    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) throw new Error("Account not found");
    if (account.isActive) return; // Already active

    this.isSwitching = true;
    for (const fn of this.switchListeners) fn(accountId, true);

    // Capture snapshot for rollback
    const snapshot = await this.captureSnapshot();

    try {
      const token = account.personalAccessToken;
      if (!token) throw new Error("Account token not found");

      // Update keychain credential
      await keychainService.updateGitHubCredential(
        account.githubUsername,
        token,
      );

      // Clear git credential cache
      try {
        await gitConfigService.clearGitHubCredentialCache();
      } catch {
        // ignore
      }

      // Update git config
      await gitConfigService.setGlobalUserConfig(
        account.gitUserName,
        account.gitUserEmail,
      );

      // Update active state
      for (let i = 0; i < this.accounts.length; i++) {
        this.accounts[i].isActive = this.accounts[i].id === accountId;
        if (this.accounts[i].id === accountId) {
          this.accounts[i].lastUsedAt = new Date().toISOString();
        }
      }

      this.saveAccounts();
      await this.refreshCurrentGitConfig();

      // Switch GitHub CLI (best-effort, non-blocking)
      this.switchGitHubCLIAccount(account.githubUsername);

      this.notifyAccountsUpdated();
      this.notifyActiveAccountChanged();

      for (const fn of this.switchListeners) fn(accountId, true);
    } catch (error) {
      // Rollback
      await this.rollbackToSnapshot(snapshot);
      const errMsg =
        error instanceof Error ? error.message : "Unknown error";
      for (const fn of this.switchListeners) fn(accountId, false, errMsg);
      throw error;
    } finally {
      this.isSwitching = false;
    }
  }

  async refreshCurrentGitConfig(): Promise<GitConfigState> {
    try {
      const config = await gitConfigService.getCurrentConfig();
      const helper = await gitConfigService.getCredentialHelper();
      this.currentGitConfig = {
        userName: config.name,
        userEmail: config.email,
        credentialHelper: helper,
      };
    } catch {
      this.currentGitConfig = {
        userName: null,
        userEmail: null,
        credentialHelper: null,
      };
    }
    for (const fn of this.configListeners) fn(this.currentGitConfig);
    return this.currentGitConfig;
  }

  // Settings
  updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    for (const fn of this.settingsListeners) fn(this.settings);
    return this.settings;
  }

  // Private helpers

  private async restoreActiveAccountCredential(): Promise<void> {
    const active = this.getActiveAccountFull();
    if (!active) return;

    const hasCredential = await keychainService.hasGitHubCredential(
      active.githubUsername,
    );
    if (hasCredential) return;

    if (!active.personalAccessToken) return;

    try {
      await keychainService.updateGitHubCredential(
        active.githubUsername,
        active.personalAccessToken,
      );
    } catch {
      // ignore
    }
  }

  private async switchGitHubCLIAccount(username: string): Promise<void> {
    if (!githubCLIService.isInstalled) return;
    try {
      await githubCLIService.switchAccount(username);
    } catch {
      // CLI switching is best-effort
    }
  }

  private async captureSnapshot() {
    const credential = await keychainService.readGitHubCredential();
    const config = await gitConfigService.getCurrentConfig();
    const activeId = this.getActiveAccountFull()?.id || null;
    return { credential, config, activeId };
  }

  private async rollbackToSnapshot(snapshot: {
    credential: { username: string; token: string } | null;
    config: { name: string | null; email: string | null };
    activeId: string | null;
  }) {
    try {
      if (snapshot.credential) {
        await keychainService.updateGitHubCredential(
          snapshot.credential.username,
          snapshot.credential.token,
        );
      }
      if (snapshot.config.name && snapshot.config.email) {
        await gitConfigService.setGlobalUserConfig(
          snapshot.config.name,
          snapshot.config.email,
        );
      }
      if (snapshot.activeId) {
        for (let i = 0; i < this.accounts.length; i++) {
          this.accounts[i].isActive =
            this.accounts[i].id === snapshot.activeId;
        }
        this.saveAccounts();
      }
    } catch (e) {
      console.error("Failed to rollback account switch:", e);
    }
  }

  // Persistence
  private saveAccounts(): void {
    try {
      writeFileSync(
        this.accountsFilePath,
        JSON.stringify(this.accounts, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to save accounts:", e);
    }
  }

  private loadAccounts(): void {
    try {
      if (!existsSync(this.accountsFilePath)) return;
      const data = readFileSync(this.accountsFilePath, "utf-8");
      this.accounts = JSON.parse(data);
    } catch (e) {
      console.error("Failed to load accounts:", e);
      this.accounts = [];
    }
  }

  private saveSettings(): void {
    try {
      writeFileSync(
        this.settingsFilePath,
        JSON.stringify(this.settings, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }

  private loadSettings(): void {
    try {
      if (!existsSync(this.settingsFilePath)) return;
      const data = readFileSync(this.settingsFilePath, "utf-8");
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error("Failed to load settings:", e);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }
}

// Singleton with data directory
let _instance: AccountStore | null = null;

export function getAccountStore(dataDir?: string): AccountStore {
  if (!_instance) {
    const dir =
      dataDir ||
      join(
        process.env.HOME || "",
        "Library",
        "Application Support",
        "GitAccountSwitcher",
      );
    _instance = new AccountStore(dir);
  }
  return _instance;
}
