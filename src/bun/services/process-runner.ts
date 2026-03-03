// Typed Bun.spawn() wrapper matching Swift's sanitized environment pattern

export interface RunCommandOptions {
  executable: string;
  args: string[];
  input?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface RunCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const DEFAULT_TIMEOUT = 10_000;

const SANITIZED_ENV: Record<string, string> = {
  HOME: process.env.HOME || Bun.env.HOME || "",
  USER: process.env.USER || Bun.env.USER || "",
  PATH: "/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin",
  LANG: "en_US.UTF-8",
  XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME || "",
};

const GIT_ENV: Record<string, string> = {
  ...SANITIZED_ENV,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_TERMINAL_PROMPT: "0",
  GIT_ASKPASS: "/bin/echo",
};

const GH_ENV: Record<string, string> = {
  ...SANITIZED_ENV,
  GH_NO_UPDATE_NOTIFIER: "1",
};

export function getGitEnv(): Record<string, string> {
  return { ...GIT_ENV };
}

export function getGhEnv(): Record<string, string> {
  return { ...GH_ENV };
}

export async function runCommand(
  options: RunCommandOptions,
): Promise<RunCommandResult> {
  const { executable, args, input, timeout = DEFAULT_TIMEOUT, env } = options;

  const proc = Bun.spawn([executable, ...args], {
    env: env || SANITIZED_ENV,
    stdin: input ? "pipe" : "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (input && proc.stdin) {
    proc.stdin.write(new TextEncoder().encode(input));
    proc.stdin.flush();
    proc.stdin.end();
  }

  // Race between process completion and timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      proc.kill();
      reject(new Error(`Command timed out after ${timeout}ms: ${executable}`));
    }, timeout);
  });

  const exitCode = await Promise.race([proc.exited, timeoutPromise]);

  const stdoutText = await new Response(proc.stdout).text();
  const stderrText = await new Response(proc.stderr).text();

  return {
    stdout: stdoutText.trim(),
    stderr: stderrText.trim(),
    exitCode,
  };
}

export async function runGitCommand(
  gitPath: string,
  args: string[],
): Promise<RunCommandResult> {
  return runCommand({
    executable: gitPath,
    args,
    env: getGitEnv(),
  });
}

export async function runGhCommand(
  ghPath: string,
  args: string[],
): Promise<RunCommandResult> {
  return runCommand({
    executable: ghPath,
    args,
    env: getGhEnv(),
  });
}
