import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(__dirname, "../../../..");
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf-8");

function readPkg(dir: string) {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
}

const packageDirs = [
  { name: "desktop", dir: join(root, "apps/desktop") },
  { name: "domain", dir: join(root, "packages/domain") },
  { name: "state", dir: join(root, "packages/state") },
];

describe("version consistency", () => {
  for (const { name, dir } of packageDirs) {
    it(`${name}: version is semver`, () => {
      const pkg = readPkg(dir);
      expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it(`${name}: version is >= 1.0.0`, () => {
      const pkg = readPkg(dir);
      const major = parseInt(pkg.version.split(".")[0], 10);
      expect(major).toBeGreaterThanOrEqual(1);
    });
  }

  it("all packages share the same version", () => {
    const versions = packageDirs.map(({ dir }) => readPkg(dir).version);
    const unique = [...new Set(versions)];
    expect(unique).toHaveLength(1);
  });

  it("CHANGELOG mentions the current version", () => {
    const version = readPkg(packageDirs[0].dir).version;
    expect(changelog).toContain(version);
  });
});
