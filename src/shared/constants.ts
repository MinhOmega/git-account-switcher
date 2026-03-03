export const APP_NAME = "Git Account Switcher";
export const APP_VERSION = "1.2.2";
export const APP_IDENTIFIER = "dev.gitaccountswitcher.app";

export const COLORS = {
  githubGreen: "#2ea043",
  githubGreenDark: "#238636",
  githubGreenLight: "#3fb950",
  githubBlue: "#2f81f7",
  githubDark: "#0d1117",
  githubDarkAlt: "#161b22",
  githubBorder: "#30363d",
  githubGray: "#8b949e",
  githubGrayDark: "#484f58",
  githubGrayLight: "#c9d1d9",
  githubWhite: "#f0f6fc",
} as const;

export const GITHUB_PAT_URL =
  "https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=Git+Account+Switcher";

export const GITHUB_REPO_URL =
  "https://github.com/user/git-account-switcher";

export const DEFAULT_SETTINGS = {
  showNotificationOnSwitch: true,
  enableVisualEffects: true,
  launchAtLogin: false,
  hasCompletedWelcome: false,
  hasCompletedCLISetup: false,
} as const;

export const WINDOW_CONFIG = {
  main: { width: 420, height: 520 },
  settings: { width: 500, height: 400 },
} as const;
