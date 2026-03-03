// Port of GitHubCLIService.swift (393 lines)

import { existsSync } from "fs";
import { runGhCommand, runCommand, getGhEnv } from "./process-runner";

class GitHubCLIService {
  private cachedGhPath: string | null = null;

  private getGhPath(): string | null {
    if (this.cachedGhPath) return this.cachedGhPath;

    const possiblePaths = [
      "/opt/homebrew/bin/gh",
      "/usr/local/bin/gh",
      "/usr/bin/gh",
      "/opt/local/bin/gh",
      // Nix/Linuxbrew
      `${process.env.HOME}/.nix-profile/bin/gh`,
      "/home/linuxbrew/.linuxbrew/bin/gh",
    ];

    for (const p of possiblePaths) {
      try {
        if (existsSync(p)) {
          this.cachedGhPath = p;
          return p;
        }
      } catch {
        // ignore access errors
      }
    }

    // Fallback: try `which gh` to find it on any PATH
    try {
      const result = Bun.spawnSync(["which", "gh"], {
        env: { PATH: process.env.PATH || "/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin" },
      });
      const path = new TextDecoder().decode(result.stdout).trim();
      if (path && existsSync(path)) {
        this.cachedGhPath = path;
        return path;
      }
    } catch {
      // which not available
    }

    return null;
  }

  get isInstalled(): boolean {
    return this.getGhPath() !== null;
  }

  get installCommand(): string {
    return "brew install gh";
  }

  get loginCommand(): string {
    return "gh auth login";
  }

  async isLoggedIn(): Promise<boolean> {
    const ghPath = this.getGhPath();
    if (!ghPath) return false;

    try {
      const result = await runGhCommand(ghPath, ["auth", "status"]);
      // gh auth status may output to stdout or stderr depending on version
      const output = result.stdout + "\n" + result.stderr;
      return result.exitCode === 0 || output.includes("Logged in to");
    } catch {
      return false;
    }
  }

  async checkFullStatus(): Promise<{
    isInstalled: boolean;
    isLoggedIn: boolean;
  }> {
    const installed = this.isInstalled;
    if (!installed) return { isInstalled: false, isLoggedIn: false };
    const loggedIn = await this.isLoggedIn();
    return { isInstalled: installed, isLoggedIn: loggedIn };
  }

  async getAuthenticatedAccounts(): Promise<string[]> {
    const ghPath = this.getGhPath();
    if (!ghPath) return [];

    try {
      const result = await runGhCommand(ghPath, ["auth", "status"]);
      const combined = result.stdout + "\n" + result.stderr;
      return this.parseAuthStatusUsernames(combined);
    } catch {
      return [];
    }
  }

  async switchAccount(username: string): Promise<string> {
    const ghPath = this.getGhPath();
    if (!ghPath) throw new GitHubCLIError("cliNotInstalled", "GitHub CLI (gh) is not installed");

    // Get auth status to find correct-cased username
    let authOutput: string;
    try {
      const statusResult = await runGhCommand(ghPath, ["auth", "status"]);
      authOutput = statusResult.stdout + "\n" + statusResult.stderr;
    } catch {
      throw new GitHubCLIError("notLoggedIn", "Not logged in to GitHub CLI");
    }

    // Find correct case
    const actualUsername = this.findCorrectCaseUsername(username, authOutput);
    if (!actualUsername) {
      throw new GitHubCLIError(
        "accountNotFound",
        `Account '${username}' not found in GitHub CLI`,
      );
    }

    // Run switch
    const result = await runGhCommand(ghPath, [
      "auth",
      "switch",
      "--user",
      actualUsername,
    ]);

    if (result.exitCode !== 0) {
      const errMsg = result.stderr || "Unknown error";
      if (errMsg.includes("not found") || errMsg.includes("no accounts")) {
        throw new GitHubCLIError(
          "accountNotFound",
          `Account '${username}' not found`,
        );
      }
      throw new GitHubCLIError("commandFailed", errMsg);
    }

    return result.stdout;
  }

  async openTerminalForLogin(): Promise<void> {
    await runCommand({
      executable: "/usr/bin/osascript",
      args: [
        "-e",
        'tell application "Terminal" to activate',
        "-e",
        'tell application "Terminal" to do script "gh auth login"',
      ],
      env: { HOME: process.env.HOME || "", PATH: "/usr/bin:/bin" },
    });
  }

  async openTerminalForInstall(): Promise<void> {
    await runCommand({
      executable: "/usr/bin/osascript",
      args: [
        "-e",
        'tell application "Terminal" to activate',
        "-e",
        'tell application "Terminal" to do script "brew install gh && gh auth login"',
      ],
      env: { HOME: process.env.HOME || "", PATH: "/usr/bin:/bin" },
    });
  }

  // Parse `gh auth status` output for usernames
  private parseAuthStatusUsernames(output: string): string[] {
    const usernames: string[] = [];
    for (const line of output.split("\n")) {
      if (line.includes("Logged in to") && line.includes("account")) {
        const parts = line.split(/\s+/);
        const accountIdx = parts.indexOf("account");
        if (accountIdx !== -1 && accountIdx + 1 < parts.length) {
          const username = parts[accountIdx + 1].replace(
            /[.,;:!?()]/g,
            "",
          );
          if (username) usernames.push(username);
        }
      }
    }
    return usernames;
  }

  // Case-insensitive username match
  private findCorrectCaseUsername(
    username: string,
    output: string,
  ): string | null {
    const target = username.toLowerCase();
    return (
      this.parseAuthStatusUsernames(output).find(
        (u) => u.toLowerCase() === target,
      ) || null
    );
  }
}

export class GitHubCLIError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GitHubCLIError";
  }
}

export const githubCLIService = new GitHubCLIService();
