// Main process entry point - mirrors GitAccountSwitcherApp.swift
// Creates windows, tray, menus, and wires RPC handlers to services

import {
  BrowserWindow,
  BrowserView,
  Tray,
  Utils,
  ApplicationMenu,
  Updater,
} from "electrobun/bun";
import Electrobun from "electrobun/bun";
import type { MainViewRPC } from "../shared/rpc-types";
import { getAccountStore } from "./services/account-store";
import { gitConfigService } from "./services/git-config-service";
import { githubCLIService } from "./services/github-cli-service";
import { keychainService } from "./services/keychain-service";
import { showSwitchNotification } from "./services/notification-service";
import {
  isLaunchAtLoginEnabled,
  enableLaunchAtLogin,
  disableLaunchAtLogin,
} from "./services/launch-at-login";
import { WINDOW_CONFIG } from "../shared/constants";

// Initialize account store
const store = getAccountStore();

// Dev server detection for HMR
const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR.");
    }
  }
  return "views://mainview/index.html";
}

// Define RPC handlers
const rpc = BrowserView.defineRPC<MainViewRPC>({
  maxRequestTime: 15000,
  handlers: {
    requests: {
      // Account CRUD
      getAccounts: async () => store.getAccounts(),

      getActiveAccount: async () => store.getActiveAccount(),

      addAccount: async ({ account }) => {
        try {
          const result = await store.addAccount(account);
          updateTrayMenu();
          return { success: true, data: result };
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : "Failed to add account",
          };
        }
      },

      updateAccount: async ({ account }) => {
        try {
          const result = await store.updateAccount(account);
          updateTrayMenu();
          return { success: true, data: result };
        } catch (e) {
          return {
            success: false,
            error:
              e instanceof Error ? e.message : "Failed to update account",
          };
        }
      },

      removeAccount: async ({ accountId }) => {
        try {
          await store.removeAccount(accountId);
          updateTrayMenu();
          return { success: true, data: null };
        } catch (e) {
          return {
            success: false,
            error:
              e instanceof Error ? e.message : "Failed to remove account",
          };
        }
      },

      switchToAccount: async ({ accountId }) => {
        try {
          await store.switchToAccount(accountId);

          // Show notification if enabled
          const settings = store.getSettings();
          if (settings.showNotificationOnSwitch) {
            const active = store.getActiveAccount();
            if (active) showSwitchNotification(active);
          }

          updateTrayMenu();
          return { success: true, data: null };
        } catch (e) {
          return {
            success: false,
            error:
              e instanceof Error ? e.message : "Failed to switch account",
          };
        }
      },

      getAccountForEdit: async ({ accountId }) => {
        const data = store.getAccountForEdit(accountId);
        if (!data)
          return { success: false, error: "Account not found" };
        return { success: true, data };
      },

      // Git config
      getGitConfig: async () => store.getGitConfig(),

      refreshGitConfig: async () => store.refreshCurrentGitConfig(),

      // GitHub CLI
      getGitHubCLIStatus: async () => {
        const status = await githubCLIService.checkFullStatus();
        const accounts = status.isLoggedIn
          ? await githubCLIService.getAuthenticatedAccounts()
          : [];
        return {
          isInstalled: status.isInstalled,
          isLoggedIn: status.isLoggedIn,
          authenticatedAccounts: accounts,
          installCommand: githubCLIService.installCommand,
          loginCommand: githubCLIService.loginCommand,
        };
      },

      openTerminalForCLILogin: async () => {
        await githubCLIService.openTerminalForLogin();
        return null;
      },

      openTerminalForCLIInstall: async () => {
        await githubCLIService.openTerminalForInstall();
        return null;
      },

      // Credential discovery
      discoverKeychainCredential: async () => {
        try {
          const credential = await keychainService.readGitHubCredential();
          return { success: true, data: credential };
        } catch (e) {
          return {
            success: false,
            error:
              e instanceof Error
                ? e.message
                : "Failed to discover credential",
          };
        }
      },

      // Settings
      getSettings: async () => store.getSettings(),

      updateSettings: async ({ settings }) => {
        // Handle launch at login toggle
        if (settings.launchAtLogin !== undefined) {
          if (settings.launchAtLogin) {
            enableLaunchAtLogin();
          } else {
            disableLaunchAtLogin();
          }
        }
        return store.updateSettings(settings);
      },

      // Utilities
      copyToClipboard: async ({ text }) => {
        Utils.clipboardWriteText(text);
        return null;
      },

      openExternal: async ({ url }) => {
        Utils.openExternal(url);
        return null;
      },

      quitApp: async () => {
        Utils.quit();
        return null;
      },
    },
    messages: {
      logFromView: ({ msg }) => {
        console.log("[View]", msg);
      },
    },
  },
});

// Create the main window
const url = await getMainViewUrl();
const mainWindow = new BrowserWindow({
  title: "Git Account Switcher",
  url,
  frame: {
    width: WINDOW_CONFIG.main.width,
    height: WINDOW_CONFIG.main.height,
    x: 0,
    y: 0,
  },
  titleBarStyle: "hiddenInset",
  rpc,
});

// Wire store events to push RPC messages to webview
store.onAccountsUpdated((accounts) => {
  try {
    mainWindow.webview?.rpc?.send.accountsUpdated({ accounts });
  } catch { /* window might be closed */ }
});

store.onActiveAccountChanged((account) => {
  try {
    mainWindow.webview?.rpc?.send.activeAccountChanged({ account });
  } catch { /* window might be closed */ }
});

store.onConfigUpdated((config) => {
  try {
    mainWindow.webview?.rpc?.send.gitConfigUpdated({ config });
  } catch { /* window might be closed */ }
});

store.onSettingsUpdated((settings) => {
  try {
    mainWindow.webview?.rpc?.send.settingsUpdated({ settings });
  } catch { /* window might be closed */ }
});

// Create system tray
const tray = new Tray({
  title: "Git Account Switcher",
  template: true,
  width: 22,
  height: 22,
});

function updateTrayMenu() {
  const accounts = store.getAccounts();
  const activeAccount = store.getActiveAccount();

  type MenuItem =
    | { type: "divider" }
    | { type: "normal"; label: string; action?: string; checked?: boolean };

  const menuItems: MenuItem[] = [];

  // Header
  if (activeAccount) {
    menuItems.push({
      type: "normal" as const,
      label: `Active: ${activeAccount.displayName} (@${activeAccount.githubUsername})`,
      action: "active-info",
    });
  } else {
    menuItems.push({
      type: "normal" as const,
      label: "No active account",
      action: "no-active",
    });
  }

  menuItems.push({ type: "divider" as const });

  // Account list
  for (const account of accounts) {
    menuItems.push({
      type: "normal" as const,
      label: `${account.isActive ? "\u2713 " : "  "}${account.displayName}`,
      action: `switch-${account.id}`,
    });
  }

  if (accounts.length > 0) {
    menuItems.push({ type: "divider" as const });
  }

  menuItems.push({
    type: "normal" as const,
    label: "Show Window",
    action: "show-window",
  });

  menuItems.push({ type: "divider" as const });

  menuItems.push({
    type: "normal" as const,
    label: "Quit",
    action: "quit",
  });

  tray.setMenu(menuItems as any);
}

// Handle tray clicks
tray.on("tray-clicked", async (event: any) => {
  const action = event.data?.action;
  if (!action) return;

  if (action === "show-window") {
    mainWindow.focus();
  } else if (action === "quit") {
    Utils.quit();
  } else if (action.startsWith("switch-")) {
    const accountId = action.replace("switch-", "");
    try {
      await store.switchToAccount(accountId);
      const settings = store.getSettings();
      if (settings.showNotificationOnSwitch) {
        const active = store.getActiveAccount();
        if (active) showSwitchNotification(active);
      }
      updateTrayMenu();
    } catch (e) {
      console.error("Failed to switch account from tray:", e);
    }
  }
});

// Set up application menu
ApplicationMenu.setApplicationMenu([
  {
    label: "Git Account Switcher",
    submenu: [
      { role: "hide" },
      { role: "hideOthers" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
]);

// Handle quit lifecycle
Electrobun.events.on("before-quit", () => {
  console.log("Git Account Switcher shutting down...");
});

// Initialize store (async operations)
await store.initialize();

// Initial tray menu update
updateTrayMenu();

console.log("Git Account Switcher started!");
