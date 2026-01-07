import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { initMindRegistry, getMindRegistry, createMindsAgent, resetMindRegistry } from "../../src/index";
import { FileSystemProvider } from "../../src/providers/filesystem";
import { write } from "bun";
import { rm, mkdir } from "node:fs/promises";

describe("Integration Tests", () => {
  const testMindsDir = "./tests/fixtures/integration-minds";

  beforeAll(async () => {
    await mkdir(`${testMindsDir}/test-mind/scripts`, { recursive: true });
    await mkdir(`${testMindsDir}/test-mind/references`, { recursive: true });

    await write(`${testMindsDir}/test-mind/MIND.md`, `---
name: test-mind
description: A test mind for integration testing
allowed-tools: Read Write
---

# Test Mind

This is a test mind for integration testing.

## Usage

When the user asks for help with testing, load this mind.`);

    await write(`${testMindsDir}/test-mind/scripts/test.ts`, `console.log("Test script executed");`);

    await initMindRegistry({
      providers: [new FileSystemProvider(testMindsDir)],
    });
  });

  afterAll(async () => {
    resetMindRegistry();
    await rm(testMindsDir, { recursive: true, force: true });
  });

  describe("end-to-end mind loading", () => {
    it("should initialize registry and discover minds", () => {
      const registry = getMindRegistry();

      expect(registry.listMinds()).toContain("test-mind");
    });

    it("should load mind metadata", () => {
      const registry = getMindRegistry();
      const metadata = registry.getMetadata("test-mind");

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe("test-mind");
      expect(metadata?.description).toBe("A test mind for integration testing");
    });

    it("should load full mind content", async () => {
      const registry = getMindRegistry();
      const mind = await registry.loadMind("test-mind");

      expect(mind).toBeDefined();
      expect(mind?.content).toContain("# Test Mind");
      expect(mind?.frontmatter["allowed-tools"]).toBe("Read Write");
    });
  });

  describe("mind execution flow", () => {
    it("should execute mind script", async () => {
      const registry = getMindRegistry();
      const result = await registry.executeScript("test-mind", "test.ts");

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.stdout).toContain("Test script executed");
    });

    it("should read mind resources", async () => {
      await write(`${testMindsDir}/test-mind/references/guide.md`, `# Guide

This is a guide.`);

      const registry = getMindRegistry();
      const content = await registry.readResource("test-mind", "references/guide.md");

      expect(content).toBeDefined();
      expect(content).toContain("# Guide");
    });
  });

  describe("agent integration", () => {
    it("should create agent with minds support", () => {
      const agent = createMindsAgent({
        name: "Test Agent",
        model: "gpt-4",
        instructions: "You are a test agent.",
      });

      expect(agent).toBeDefined();
    });

    it("should inject minds into system instructions", async () => {
      const registry = getMindRegistry();
      const mindsList = registry.generateAvailableMinds();

      expect(mindsList).toContain("test-mind");
      expect(mindsList).toContain("A test mind for integration testing");
    });
  });

  describe("caching behavior", () => {
    it("should cache loaded minds", async () => {
      const registry = getMindRegistry();

      const mind1 = await registry.loadMind("test-mind");
      const mind2 = await registry.loadMind("test-mind");

      expect(mind1).toBe(mind2);
    });
  });

  describe("error handling", () => {
    it("should handle non-existent mind gracefully", async () => {
      const registry = getMindRegistry();

      const mind = await registry.loadMind("non-existent");

      expect(mind).toBeUndefined();
    });

    it("should handle missing resources gracefully", async () => {
      const registry = getMindRegistry();

      const content = await registry.readResource("test-mind", "non-existent.md");

      expect(content).toBeUndefined();
    });
  });
});
