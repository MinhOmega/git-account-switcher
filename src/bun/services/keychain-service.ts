// Port of KeychainService.swift (377 lines)
// Uses git credential-osxkeychain instead of Security framework

import type { KeychainCredential } from "../../shared/types";
import { runCommand, getGitEnv } from "./process-runner";
import { gitConfigService } from "./git-config-service";

class KeychainService {
  // Read the current GitHub credential from Keychain
  // Uses git credential-osxkeychain get
  async readGitHubCredential(): Promise<KeychainCredential | null> {
    try {
      const gitPath = await gitConfigService.getGitPath();
      const input = "protocol=https\nhost=github.com\n\n";

      const result = await runCommand({
        executable: gitPath,
        args: ["credential-osxkeychain", "get"],
        input,
        env: getGitEnv(),
        timeout: 5000,
      });

      if (result.exitCode !== 0) return null;

      let username = "";
      let token = "";

      for (const line of result.stdout.split("\n")) {
        if (line.startsWith("username=")) {
          username = line.slice("username=".length);
        } else if (line.startsWith("password=")) {
          token = line.slice("password=".length);
        }
      }

      if (username && token) {
        return { username, token };
      }
      return null;
    } catch {
      return null;
    }
  }

  // Update or add the GitHub credential in Keychain
  // First erases existing, then stores new
  async updateGitHubCredential(
    username: string,
    token: string,
  ): Promise<void> {
    // Erase existing credential first
    await this.deleteGitHubCredential();

    // Store new credential
    const gitPath = await gitConfigService.getGitPath();
    const input = `protocol=https\nhost=github.com\nusername=${username}\npassword=${token}\n\n`;

    const result = await runCommand({
      executable: gitPath,
      args: ["credential-osxkeychain", "store"],
      input,
      env: getGitEnv(),
      timeout: 5000,
    });

    if (result.exitCode !== 0) {
      throw new KeychainError(
        "storeFailed",
        `Failed to store credential: ${result.stderr}`,
      );
    }
  }

  // Delete the GitHub credential from Keychain
  async deleteGitHubCredential(): Promise<void> {
    try {
      const gitPath = await gitConfigService.getGitPath();
      const input = "protocol=https\nhost=github.com\n\n";

      await runCommand({
        executable: gitPath,
        args: ["credential-osxkeychain", "erase"],
        input,
        env: getGitEnv(),
        timeout: 5000,
      });
    } catch {
      // Ignore errors - credential might not exist
    }
  }

  // Check if a GitHub credential exists for a specific username
  async hasGitHubCredential(username?: string): Promise<boolean> {
    const credential = await this.readGitHubCredential();
    if (!credential) return false;
    if (username) {
      return credential.username.toLowerCase() === username.toLowerCase();
    }
    return true;
  }
}

export class KeychainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "KeychainError";
  }
}

export const keychainService = new KeychainService();
