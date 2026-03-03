# Git Account Switcher

A native macOS desktop app to switch between multiple GitHub accounts with a single click. Updates your macOS Keychain credentials, global git config (`user.name`/`user.email`), and GitHub CLI sessions simultaneously.

Built with [Electrobun](https://github.com/blackboardsh/electrobun) (TypeScript + Bun + native macOS webview).

## Features

- **Instant Account Switching** - Switch between GitHub accounts in one click with atomic, transactional updates
- **Keychain Integration** - Reads and writes macOS Keychain credentials via `git credential-osxkeychain`
- **Git Config Management** - Automatically updates `~/.gitconfig` with the correct `user.name` and `user.email`
- **GitHub CLI Support** - Detects and switches `gh` CLI sessions (`gh auth switch`)
- **System Tray** - Quick-access tray menu for switching without opening the main window
- **Credential Discovery** - Auto-detects existing GitHub credentials from your Keychain on first launch
- **Encrypted Storage** - Account data stored in AES-256-GCM encrypted JSON files
- **Rollback on Failure** - If any step of the switch fails, all changes are rolled back to the previous state
- **System Notifications** - Optional notifications when switching accounts
- **Launch at Login** - Optional LaunchAgent for auto-start
- **Beautiful UI** - GitHub-inspired dark theme with glass effects and spring animations

## Screenshots

> *Coming soon*

## Prerequisites

- **macOS** (required - uses native Keychain and system webview)
- **Bun** v1.0+ ([install](https://bun.sh))
- **Git** (pre-installed on macOS)
- **GitHub CLI** (optional, for CLI session switching) - `brew install gh`

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development

```bash
# Build and run the app
bun run start

# Run with Vite HMR (hot module replacement)
# Terminal 1: Start Vite dev server
bun run hmr

# Terminal 2: Build and launch Electrobun
bun run dev
```

### Production Build

```bash
bun run build
```

The built `.app` bundle will be in `build/`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Electrobun](https://electrobun.dev) v1 |
| Runtime | [Bun](https://bun.sh) |
| Frontend | React 18 + Tailwind CSS 3 + Vite |
| Animations | Framer Motion (spring physics) |
| Language | TypeScript |
| Storage | Encrypted JSON (AES-256-GCM) |
| IPC | Electrobun typed RPC |

## Architecture

```
git-account-switcher/
├── electrobun.config.ts          # Electrobun build config
├── src/
│   ├── shared/                   # Shared types between Bun and webview
│   │   ├── types.ts              # Data models (GitAccount, AppSettings, etc.)
│   │   ├── rpc-types.ts          # Typed RPC schema (bun <-> webview)
│   │   ├── validation.ts         # Input validation (email, username, PAT)
│   │   └── constants.ts          # App constants and config
│   ├── bun/                      # Main process (Bun runtime)
│   │   ├── index.ts              # Entry point: windows, tray, menus, RPC handlers
│   │   └── services/
│   │       ├── account-store.ts      # Account CRUD + encrypted persistence
│   │       ├── keychain-service.ts   # macOS Keychain read/write/delete
│   │       ├── git-config-service.ts # git config get/set operations
│   │       ├── github-cli-service.ts # gh CLI detection and switching
│   │       ├── notification-service.ts
│   │       ├── launch-at-login.ts    # LaunchAgent plist management
│   │       └── process-runner.ts     # Sandboxed Bun.spawn() wrapper
│   └── mainview/                 # Webview (React)
│       ├── index.html
│       ├── index.css             # Tailwind + glass effects
│       ├── main.tsx              # Entry point
│       ├── App.tsx               # Root component with view routing
│       ├── hooks/
│       │   ├── useAccounts.ts    # Account state management via RPC
│       │   ├── useSettings.ts    # Settings state via RPC
│       │   └── useRPC.ts         # Electroview RPC initialization
│       └── components/
│           ├── MainWindow.tsx        # Account list with header/footer
│           ├── AccountCard.tsx       # Account card with switch/edit/delete
│           ├── EmptyState.tsx        # No accounts placeholder
│           ├── AddEditAccountModal.tsx # Account form with validation
│           ├── TokenHelpModal.tsx     # PAT creation instructions
│           ├── ConfirmDialog.tsx      # Delete confirmation
│           ├── SettingsView.tsx       # Tabbed settings (General/Accounts/About)
│           ├── WelcomeWizard.tsx      # First-launch onboarding
│           ├── CLISetupWizard.tsx     # GitHub CLI setup wizard
│           └── StepIndicator.tsx      # Wizard progress dots
```

## How It Works

### Account Switching (Transactional)

When you switch accounts, the app performs these steps atomically:

1. **Snapshot** current state (Keychain credential + git config)
2. **Update Keychain** - Erase old credential, store new one via `git credential-osxkeychain`
3. **Update git config** - Set `user.name` and `user.email` globally
4. **Clear credential cache** - Run `git credential-cache exit`
5. **Switch GitHub CLI** - Run `gh auth switch --user <username>` (if installed)
6. **Notify** - Show system notification (if enabled)

If any step fails, all previous steps are **rolled back** to the snapshot.

### Security

- Passwords/tokens are stored in the macOS Keychain (not in plain text)
- Account metadata is encrypted with AES-256-GCM
- All subprocess calls use a **sanitized environment** (restricted `PATH`, `GIT_TERMINAL_PROMPT=0`, `GIT_CONFIG_NOSYSTEM=1`)
- PAT tokens are validated against GitHub's format before saving
- Token input fields use `type="password"` and values are cleared from memory after use

### RPC Communication

The app uses Electrobun's typed RPC system for communication between the Bun main process and the React webview:

- **Bun-side handlers** (webview calls these): Account CRUD, switching, settings, git config, CLI status
- **Webview-side messages** (Bun pushes these): Account updates, config changes, switch events

## Configuration

Account data is stored at:
```
~/Library/Application Support/GitAccountSwitcher/
├── accounts.json    # Encrypted account data
└── settings.json    # App settings
```

LaunchAgent (if enabled):
```
~/Library/LaunchAgents/dev.gitaccountswitcher.launcher.plist
```

## Migrated From

This project was migrated from a native Swift/SwiftUI macOS app (~5,100 lines) to Electrobun, preserving the same functionality, UI, and behavior. The original Swift app used:

- `MenuBarExtra` -> Electrobun `Tray`
- `Security.framework` -> `git credential-osxkeychain`
- `SMAppService` -> LaunchAgent plist
- SwiftUI animations -> Framer Motion spring physics
- `@Published`/`@StateObject` -> React state + RPC push messages

## License

MIT

## Author

[MinhOmega](https://github.com/MinhOmega)
