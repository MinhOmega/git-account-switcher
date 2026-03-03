// Port of GitConfigService.swift (422 lines)

import { existsSync } from "fs";
import {
  validateGitConfigKey,
  validateGitConfigValue,
  isValidEmail,
  sanitizeGitError,
} from "../../shared/validation";
import { runGitCommand } from "./process-runner";

class GitConfigService {
  private cachedGitPath: string | null = null;

  // Git path discovery - mirrors Swift's gitPath computed property
  async getGitPath(): Promise<string> {
    if (this.cachedGitPath) return this.cachedGitPath;

    const possiblePaths = [
      "/usr/bin/git",
      "/opt/homebrew/bin/git",
      "/usr/local/bin/git",
      "/opt/local/bin/git",
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        this.cachedGitPath = path;
        return path;
      }
    }

    // Fallback: try `which git`
    try {
      const result = await runGitCommand("/usr/bin/which", ["git"]);
      if (result.exitCode === 0 && result.stdout) {
        const path = result.stdout.trim();
        if (existsSync(path)) {
          this.cachedGitPath = path;
          return path;
        }
      }
    } catch {
      // ignore
    }

    throw new GitConfigError("gitNotFound", "Git executable not found");
  }

  get isGitAvailable(): boolean {
    return this.cachedGitPath !== null;
  }

  async getGlobalUserName(): Promise<string | null> {
    return this.getConfig("user.name", "--global");
  }

  async getGlobalUserEmail(): Promise<string | null> {
    return this.getConfig("user.email", "--global");
  }

  async setGlobalUserName(name: string): Promise<void> {
    const validated = validateGitConfigValue(name, "user.name");
    await this.setConfig("user.name", validated, "--global");
  }

  async setGlobalUserEmail(email: string): Promise<void> {
    const validated = validateGitConfigValue(email, "user.email");
    if (!isValidEmail(validated)) {
      throw new GitConfigError("validationError", "Invalid email format");
    }
    await this.setConfig("user.email", validated, "--global");
  }

  async setGlobalUserConfig(name: string, email: string): Promise<void> {
    await this.setGlobalUserName(name);
    await this.setGlobalUserEmail(email);
  }

  async getCredentialHelper(): Promise<string | null> {
    return this.getConfig("credential.helper", "--global");
  }

  async isOsxKeychainHelperConfigured(): Promise<boolean> {
    const helper = await this.getCredentialHelper();
    return helper !== null && helper.includes("osxkeychain");
  }

  async ensureOsxKeychainHelper(): Promise<void> {
    const configured = await this.isOsxKeychainHelperConfigured();
    if (!configured) {
      await this.setConfig("credential.helper", "osxkeychain", "--global");
    }
  }

  async clearGitHubCredentialCache(): Promise<void> {
    try {
      const gitPath = await this.getGitPath();
      await runGitCommand(gitPath, ["credential-cache", "exit"]);
    } catch {
      // Ignore errors - cache might not be running
    }
  }

  async getCurrentConfig(): Promise<{
    name: string | null;
    email: string | null;
  }> {
    const name = await this.getGlobalUserName();
    const email = await this.getGlobalUserEmail();
    return { name, email };
  }

  async listGlobalConfig(): Promise<Record<string, string>> {
    const gitPath = await this.getGitPath();
    const result = await runGitCommand(gitPath, [
      "config",
      "--global",
      "--list",
    ]);
    if (result.exitCode !== 0) return {};

    const config: Record<string, string> = {};
    for (const line of result.stdout.split("\n")) {
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) continue;
      const key = line.slice(0, eqIndex);
      const value = line.slice(eqIndex + 1);
      config[key] = value;
    }
    return config;
  }

  async getGitVersion(): Promise<string | null> {
    try {
      const gitPath = await this.getGitPath();
      const result = await runGitCommand(gitPath, ["--version"]);
      return result.exitCode === 0 ? result.stdout : null;
    } catch {
      return null;
    }
  }

  // Private helpers

  private async getConfig(
    key: string,
    scope: string,
  ): Promise<string | null> {
    validateGitConfigKey(key);
    try {
      const gitPath = await this.getGitPath();
      const result = await runGitCommand(gitPath, [
        "config",
        scope,
        "--get",
        key,
      ]);
      // git config --get returns exit code 1 if key not found
      if (result.exitCode !== 0) return null;
      return result.stdout || null;
    } catch {
      return null;
    }
  }

  private async setConfig(
    key: string,
    value: string,
    scope: string,
  ): Promise<void> {
    validateGitConfigKey(key);
    const gitPath = await this.getGitPath();
    const result = await runGitCommand(gitPath, [
      "config",
      scope,
      "--replace-all",
      key,
      value,
    ]);
    if (result.exitCode !== 0) {
      throw new GitConfigError(
        "commandFailed",
        sanitizeGitError(result.stderr),
      );
    }
  }
}

export class GitConfigError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GitConfigError";
  }
}

export const gitConfigService = new GitConfigService();
