// Port of ValidationUtilities.swift - all regex patterns preserved 1:1

export function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9._+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.\-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function isValidGitHubUsername(username: string): boolean {
  const githubRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  return githubRegex.test(username);
}

export function isValidGitHubToken(token: string): boolean {
  const trimmed = token.trim();

  // Classic PAT: ghp_[36 alphanumeric chars]
  if (trimmed.startsWith("ghp_")) {
    const suffix = trimmed.slice(4);
    return suffix.length === 36 && /^[a-zA-Z0-9]+$/.test(suffix);
  }

  // Fine-grained PAT: github_pat_[22+ chars]_[36+ chars]
  if (trimmed.startsWith("github_pat_")) {
    const suffix = trimmed.slice(11);
    return suffix.length >= 50 && /^[a-zA-Z0-9_]+$/.test(suffix);
  }

  // Fallback: 20+ chars with letters and numbers
  if (trimmed.length >= 20) {
    if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) return false;
    const hasLetters = /[a-zA-Z]/.test(trimmed);
    const hasNumbers = /[0-9]/.test(trimmed);
    return hasLetters && hasNumbers;
  }

  return false;
}

export function validateGitConfigKey(key: string): void {
  const keyRegex = /^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*)*$/;
  if (!keyRegex.test(key)) {
    throw new ValidationError("invalidConfigKey", "Invalid config key format");
  }
  if (key.includes("..") || key.includes("/") || key.includes("\\")) {
    throw new ValidationError(
      "pathTraversal",
      "Config key contains invalid path characters",
    );
  }
}

export function validateGitConfigValue(value: string, field: string): string {
  // Check for control characters
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(value)) {
    throw new ValidationError(
      "invalidControlCharacters",
      `${field} contains invalid control characters`,
    );
  }

  // Check for git special characters
  if (/[[\]]/.test(value)) {
    throw new ValidationError(
      "invalidCharacters",
      `${field} contains invalid characters`,
    );
  }

  if (value.length > 255) {
    throw new ValidationError(
      "inputTooLong",
      `${field} exceeds maximum length (255 characters)`,
    );
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new ValidationError("emptyValue", `${field} cannot be empty`);
  }

  return value;
}

export function containsControlCharacters(input: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /[\x00-\x1f\x7f]/.test(input) || input.includes("\0");
}

export function sanitizeGitError(stderr: string): string {
  if (!stderr) return "Git command failed";

  let sanitized = stderr;
  const homePatterns: [RegExp, string][] = [
    [/\/Users\/[A-Za-z0-9_.-]{1,255}/gi, "[HOME]"],
    [/\/home\/[A-Za-z0-9_.-]{1,255}/gi, "[HOME]"],
    [/~(?:\/[^\s]{0,255})?/g, "[HOME]"],
  ];

  for (const [pattern, replacement] of homePatterns) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  if (sanitized.includes("permission denied")) {
    return "Permission denied accessing git config";
  }
  if (sanitized.includes("not found")) {
    return "Git config key not found";
  }

  return "Git config operation failed";
}

export class ValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
