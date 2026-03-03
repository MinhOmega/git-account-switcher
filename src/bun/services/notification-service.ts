// Port of notification logic from GitAccountSwitcherApp.swift

import { Utils } from "electrobun/bun";
import type { GitAccountPublic } from "../../shared/types";

export function showSwitchNotification(account: GitAccountPublic): void {
  Utils.showNotification({
    title: "Git Account Switched",
    subtitle: `Now using: ${account.displayName}`,
    body: `GitHub: @${account.githubUsername}\nEmail: ${account.gitUserEmail}`,
  });
}
