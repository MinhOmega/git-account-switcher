#!/usr/bin/env bun
/**
 * Bump version in all project files atomically.
 *
 * Usage: bun scripts/bump-version.ts <patch|minor|major>
 *
 * Updates version in:
 *   - package.json
 *   - electrobun.config.ts
 *   - src/shared/constants.ts
 */

const BUMP_TYPE = (process.argv[2] || "patch") as "patch" | "minor" | "major";

if (!["patch", "minor", "major"].includes(BUMP_TYPE)) {
  console.error(`Invalid bump type: ${BUMP_TYPE}. Use: patch, minor, or major`);
  process.exit(1);
}

// 1. Read current version from package.json
const pkgPath = new URL("../package.json", import.meta.url).pathname;
const pkg = await Bun.file(pkgPath).json();
const currentVersion: string = pkg.version;

// 2. Calculate new version
const [major, minor, patch] = currentVersion.split(".").map(Number);
let newVersion: string;

switch (BUMP_TYPE) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping version: ${currentVersion} → ${newVersion} (${BUMP_TYPE})`);

// 3. Update package.json
pkg.version = newVersion;
await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// 4. Update electrobun.config.ts
const configPath = new URL("../electrobun.config.ts", import.meta.url).pathname;
let configContent = await Bun.file(configPath).text();
configContent = configContent.replace(
  /version:\s*"[^"]+"/,
  `version: "${newVersion}"`,
);
await Bun.write(configPath, configContent);

// 5. Update src/shared/constants.ts
const constantsPath = new URL(
  "../src/shared/constants.ts",
  import.meta.url,
).pathname;
let constantsContent = await Bun.file(constantsPath).text();
constantsContent = constantsContent.replace(
  /APP_VERSION\s*=\s*"[^"]+"/,
  `APP_VERSION = "${newVersion}"`,
);
await Bun.write(constantsPath, constantsContent);

// 6. Output new version (used by CI to create tags)
console.log(`::set-output name=new_version::${newVersion}`);
console.log(`NEW_VERSION=${newVersion}`);
