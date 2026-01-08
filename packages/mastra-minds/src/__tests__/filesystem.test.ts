import { describe, it, expect, beforeEach, beforeAll, afterAll } from "bun:test";
import { FileSystemProvider } from "../providers/filesystem";
import { write } from "bun";

describe("FileSystemProvider", () => {
  const testMindsDir = "./tests/fixtures/minds";
  let provider: FileSystemProvider;

  beforeAll(async () => {
    await ensureDir(`${testMindsDir}/test-mind/scripts`);
    await ensureDir(`${testMindsDir}/test-mind/references`);
    await ensureDir(`${testMindsDir}/test-mind/assets`);
    await ensureDir(`${testMindsDir}/invalid-mind`);
    await ensureDir(`${testMindsDir}/script-mind/scripts`);

    await write(`${testMindsDir}/test-mind/MIND.md`, `---
name: test-mind
description: A test mind for testing
allowed-tools: Read Write
---

# Test Mind

This is a test mind.`);

    await write(`${testMindsDir}/invalid-mind/MIND.md`, `---
name: invalid-mind
description: [invalid
---

Content`);

    await write(`${testMindsDir}/script-mind/MIND.md`, `---
name: script-mind
description: A mind with scripts
---

# Script Mind

This mind has executable scripts.`);

    await write(`${testMindsDir}/script-mind/scripts/hello.ts`, `console.log("Hello from TypeScript!");
console.log("MIND_NAME:", process.env.MIND_NAME);
console.log("MIND_DIR:", process.env.MIND_DIR);`);

    await write(`${testMindsDir}/script-mind/scripts/hello.sh`, `#!/bin/bash
echo "Hello from Bash!"
echo "MIND_NAME: $MIND_NAME"
echo "MIND_DIR: $MIND_DIR"`);

    await write(`${testMindsDir}/test-mind/references/guide.md`, `# Guide

This is a reference guide.`);

    await write(`${testMindsDir}/test-mind/assets/config.json`, `{
  "key": "value"
}`);
  });

  afterAll(async () => {
    const { rm } = await import("node:fs/promises");
    await rm(testMindsDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    provider = new FileSystemProvider(testMindsDir);
  });

  async function ensureDir(path: string) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path, { recursive: true });
  }

  describe("discover", () => {
    it("should discover valid minds", async () => {
      const minds = await provider.discover();

      expect(minds.length).toBeGreaterThanOrEqual(1);

      const testMind = minds.find((m) => m.name === "test-mind");
      expect(testMind).toBeDefined();
      expect(testMind?.description).toBe("A test mind for testing");
    });

    it("should skip invalid minds gracefully", async () => {
      const minds = await provider.discover();

      expect(minds.length).toBeGreaterThanOrEqual(1);
    });

    it("should discover script-mind", async () => {
      const minds = await provider.discover();

      const scriptMind = minds.find((m) => m.name === "script-mind");
      expect(scriptMind).toBeDefined();
    });

    it("should handle empty directory", async () => {
      const emptyDir = "./tests/fixtures/empty-minds";
      await ensureDir(emptyDir);

      const emptyProvider = new FileSystemProvider(emptyDir);
      const minds = await emptyProvider.discover();

      expect(minds).toEqual([]);

      const { rm } = await import("node:fs/promises");
      await rm(emptyDir, { recursive: true, force: true });
    });
  });

  describe("loadMind", () => {
    beforeEach(async () => {
      await provider.discover();
    });

    it("should load discovered mind by name", async () => {
      const mind = await provider.loadMind("test-mind");

      expect(mind).toBeDefined();
      expect(mind?.metadata.name).toBe("test-mind");
      expect(mind?.content).toContain("# Test Mind");
    });

    it("should load mind with frontmatter", async () => {
      const mind = await provider.loadMind("test-mind");

      expect(mind?.frontmatter.name).toBe("test-mind");
      expect(mind?.frontmatter.description).toBe(
        "A test mind for testing"
      );
      expect(mind?.frontmatter["allowed-tools"]).toBe("Read Write");
    });

    it("should return undefined for non-existent mind", async () => {
      const mind = await provider.loadMind("non-existent");

      expect(mind).toBeUndefined();
    });

    it("should handle mind not in cache", async () => {
      const newProvider = new FileSystemProvider(testMindsDir);
      const mind = await newProvider.loadMind("test-mind");

      expect(mind).toBeDefined();
    });
  });

  describe("hasMind", () => {
    beforeEach(async () => {
      await provider.discover();
    });

    it("should return true for existing minds", async () => {
      expect(await provider.hasMind("test-mind")).toBe(true);
      expect(await provider.hasMind("script-mind")).toBe(true);
    });

    it("should return false for non-existent minds", async () => {
      expect(await provider.hasMind("non-existent")).toBe(false);
    });

    it("should check for MIND.md file", async () => {
      const result = await provider.hasMind("test-mind");
      expect(result).toBe(true);
    });
  });

  describe("readResource", () => {
    beforeEach(async () => {
      await provider.discover();
    });

    it("should read file from references/", async () => {
      const content = await provider.readResource(
        "test-mind",
        "references/guide.md"
      );

      expect(content).toBeDefined();
      expect(content).toContain("# Guide");
    });

    it("should read file from assets/", async () => {
      const content = await provider.readResource(
        "test-mind",
        "assets/config.json"
      );

      expect(content).toBeDefined();
      expect(content).toContain('"key"');
    });

    it("should return undefined for non-existent resource", async () => {
      const content = await provider.readResource(
        "test-mind",
        "non-existent.md"
      );

      expect(content).toBeUndefined();
    });

    it("should return undefined for non-existent mind", async () => {
      const content = await provider.readResource(
        "non-existent",
        "references/guide.md"
      );

      expect(content).toBeUndefined();
    });
  });

  describe("path traversal security", () => {
    beforeEach(async () => {
      await provider.discover();
    });

    it("should prevent path traversal with ..", async () => {
      const content = await provider.readResource(
        "test-mind",
        "../../../etc/passwd"
      );

      expect(content).toBeUndefined();
    });

    it("should normalize paths with ..", async () => {
      const content = await provider.readResource(
        "test-mind",
        "../test-mind/references/guide.md"
      );

      expect(content).toBeUndefined();
    });
  });

  describe("executeScript", () => {
    beforeEach(async () => {
      await provider.discover();
    });

    it("should execute TypeScript script", async () => {
      const result = await provider.executeScript(
        "script-mind",
        "hello.ts"
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("Hello from TypeScript!");
      expect(result.stdout).toContain("MIND_NAME: script-mind");
      expect(result.exitCode).toBe(0);
    });

    it("should execute Bash script", async () => {
      const result = await provider.executeScript(
        "script-mind",
        "hello.sh"
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("Hello from Bash!");
      expect(result.exitCode).toBe(0);
    });

    it("should return error for non-existent mind", async () => {
      const result = await provider.executeScript(
        "non-existent",
        "hello.ts"
      );

      expect(result.success).toBe(false);
      expect(result.stderr).toContain("not found");
    });

    it("should return error for non-existent script", async () => {
      const result = await provider.executeScript(
        "script-mind",
        "non-existent.ts"
      );

      expect(result.success).toBe(false);
      expect(result.stderr).toContain("not found");
    });

    it("should prevent path traversal in script execution", async () => {
      const result = await provider.executeScript(
        "script-mind",
        "../../../etc/passwd"
      );

      expect(result.success).toBe(false);
    });

    it("should return error for unsupported script type", async () => {
      const result = await provider.executeScript(
        "script-mind",
        "test.xyz"
      );

      expect(result.success).toBe(false);
      expect(result.stderr).toContain("Unsupported script type");
    });

    it("should pass args to script", async () => {
      const result = await provider.executeScript(
        "script-mind",
        "hello.ts",
        ["arg1", "arg2"]
      );

      expect(result.success).toBe(true);
    });

    it("should set MIND_NAME and MIND_DIR environment variables", async () => {
      const result = await provider.executeScript(
        "script-mind",
        "hello.ts"
      );

      expect(result.stdout).toContain("MIND_NAME: script-mind");
      expect(result.stdout).toContain("MIND_DIR:");
    });
  });

  describe("error handling", () => {
    it("should handle invalid YAML gracefully", async () => {
      await provider.discover();

      const mind = await provider.loadMind("invalid-mind");
      expect(mind).toBeUndefined();
    });

    it("should handle missing MIND.md gracefully", async () => {
      const result = await provider.loadMind("no-mind");
      expect(result).toBeUndefined();
    });
  });
});
