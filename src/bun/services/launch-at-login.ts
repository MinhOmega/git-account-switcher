// Port of SMAppService launch-at-login functionality
// Uses LaunchAgent plist in ~/Library/LaunchAgents/

import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

const PLIST_NAME = "dev.gitaccountswitcher.launcher.plist";
const PLIST_DIR = join(process.env.HOME || "", "Library", "LaunchAgents");

function getPlistPath(): string {
  return join(PLIST_DIR, PLIST_NAME);
}

function getAppPath(): string {
  // In production, the app binary path
  // In dev, this won't work but that's fine
  return process.execPath;
}

export function isLaunchAtLoginEnabled(): boolean {
  return existsSync(getPlistPath());
}

export function enableLaunchAtLogin(): void {
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>dev.gitaccountswitcher.launcher</string>
  <key>ProgramArguments</key>
  <array>
    <string>${getAppPath()}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
</dict>
</plist>`;

  writeFileSync(getPlistPath(), plistContent, "utf-8");
}

export function disableLaunchAtLogin(): void {
  const path = getPlistPath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}
