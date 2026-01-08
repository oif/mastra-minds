import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { MindRegistry, initMindRegistry, getMindRegistry } from "../registry";
import type { MindsProvider, MindMetadata, Mind } from "../types";

class MockProvider implements MindsProvider {
  readonly name: string;
  private minds: Map<string, Mind>;
  discoverCalled = false;
  loadMindCalled: string[] = [];

  constructor(name: string, minds: Mind[] = []) {
    this.name = name;
    this.minds = new Map(minds.map((m) => [m.metadata.name, m]));
  }

  async discover(): Promise<MindMetadata[]> {
    this.discoverCalled = true;
    return Array.from(this.minds.values()).map((m) => m.metadata);
  }

  async loadMind(name: string): Promise<Mind | undefined> {
    this.loadMindCalled.push(name);
    return this.minds.get(name);
  }

  async hasMind(name: string): Promise<boolean> {
    return this.minds.has(name);
  }

  async readResource(): Promise<string | undefined> {
    return undefined;
  }

  async executeScript(
    mindName: string,
    scriptPath: string,
    args?: string[]
  ): Promise<any> {
    return undefined;
  }
}

describe("MindRegistry", () => {
  let provider1: MockProvider;
  let provider2: MockProvider;
  let registry: MindRegistry;

  beforeEach(() => {
    provider1 = new MockProvider("provider1", [
      {
        metadata: { name: "mind-a", description: "Mind A from provider 1" },
        frontmatter: {
          name: "mind-a",
          description: "Mind A from provider 1",
        },
        content: "Content A",
      },
      {
        metadata: { name: "mind-b", description: "Mind B from provider 1" },
        frontmatter: {
          name: "mind-b",
          description: "Mind B from provider 1",
        },
        content: "Content B",
      },
    ]);

    provider2 = new MockProvider("provider2", [
      {
        metadata: { name: "mind-b", description: "Mind B from provider 2" },
        frontmatter: {
          name: "mind-b",
          description: "Mind B from provider 2",
        },
        content: "Content B from provider 2",
      },
      {
        metadata: { name: "mind-c", description: "Mind C from provider 2" },
        frontmatter: {
          name: "mind-c",
          description: "Mind C from provider 2",
        },
        content: "Content C",
      },
    ]);

    registry = new MindRegistry({
      providers: [provider1, provider2],
    });
  });

  describe("initialization", () => {
    it("should initialize with providers", async () => {
      await registry.init();

      expect(provider1.discoverCalled).toBe(true);
      expect(provider2.discoverCalled).toBe(true);
    });

    it("should clear caches on re-initialization", async () => {
      await registry.init();
      expect(registry.listMinds().length).toBeGreaterThan(0);

      await registry.init();
      expect(registry.listMinds().length).toBeGreaterThan(0);
    });

    it("should handle empty provider list", async () => {
      const emptyRegistry = new MindRegistry({ providers: [] });
      await emptyRegistry.init();

      expect(emptyRegistry.listMinds()).toEqual([]);
    });
  });

  describe("conflict resolution", () => {
    it("should use 'first' strategy by default", async () => {
      await registry.init();

      const mindB = await registry.loadMind("mind-b");
      expect(mindB?.frontmatter.description).toBe(
        "Mind B from provider 1"
      );
    });

    it("should use 'last' strategy when configured", async () => {
      const lastStrategyRegistry = new MindRegistry({
        providers: [provider1, provider2],
        conflictStrategy: "last",
      });

      await lastStrategyRegistry.init();

      const mindB = await lastStrategyRegistry.loadMind("mind-b");
      expect(mindB?.frontmatter.description).toBe(
        "Mind B from provider 2"
      );
    });
  });

  describe("mind discovery", () => {
    beforeEach(async () => {
      await registry.init();
    });

    it("should discover minds from all providers", () => {
      const minds = registry.listMinds();

      expect(minds).toContain("mind-a");
      expect(minds).toContain("mind-b");
      expect(minds).toContain("mind-c");
      expect(minds.length).toBe(3);
    });

    it("should get metadata for discovered minds", () => {
      const metadata = registry.getMetadata("mind-a");

      expect(metadata).toEqual({
        name: "mind-a",
        description: "Mind A from provider 1",
      });
    });

    it("should return undefined for non-existent minds", () => {
      const metadata = registry.getMetadata("non-existent");

      expect(metadata).toBeUndefined();
    });

    it("should generate available minds list", () => {
      const list = registry.generateAvailableMinds();

      expect(list).toContain("mind-a");
      expect(list).toContain("mind-b");
      expect(list).toContain("mind-c");
    });

    it("should handle empty registry in generateAvailableMinds", async () => {
      const emptyRegistry = new MindRegistry({ providers: [] });
      await emptyRegistry.init();

      const list = emptyRegistry.generateAvailableMinds();

      expect(list).toBe("No minds installed.");
    });
  });

  describe("mind loading", () => {
    beforeEach(async () => {
      await registry.init();
    });

    it("should load mind from correct provider", async () => {
      const mind = await registry.loadMind("mind-a");

      expect(mind).toBeDefined();
      expect(mind?.metadata.name).toBe("mind-a");
      expect(mind?.content).toBe("Content A");
    });

    it("should cache loaded minds", async () => {
      await registry.loadMind("mind-a");
      await registry.loadMind("mind-a");

      expect(provider1.loadMindCalled.length).toBe(1);
    });

    it("should return undefined for non-existent mind", async () => {
      const mind = await registry.loadMind("non-existent");

      expect(mind).toBeUndefined();
    });

    it("should load mind from provider after cache miss", async () => {
      const mind = await registry.loadMind("mind-a");

      expect(mind).toBeDefined();
      expect(provider1.loadMindCalled).toContain("mind-a");
    });
  });

  describe("provider mapping", () => {
    beforeEach(async () => {
      await registry.init();
    });

    it("should get provider for a mind", () => {
      const provider = registry.getProviderForMind("mind-a");

      expect(provider).toBe(provider1);
    });

    it("should return undefined for non-existent mind provider", () => {
      const provider = registry.getProviderForMind("non-existent");

      expect(provider).toBeUndefined();
    });

    it("should get all providers", () => {
      const providers = registry.getProviders();

      expect(providers).toEqual([provider1, provider2]);
    });
  });

  describe("hasMind", () => {
    beforeEach(async () => {
      await registry.init();
    });

    it("should return true for existing minds", () => {
      expect(registry.hasMind("mind-a")).toBe(true);
      expect(registry.hasMind("mind-b")).toBe(true);
      expect(registry.hasMind("mind-c")).toBe(true);
    });

    it("should return false for non-existent minds", () => {
      expect(registry.hasMind("non-existent")).toBe(false);
    });
  });

  describe("script execution support", () => {
    beforeEach(async () => {
      await registry.init();
    });

    it("should check if provider supports scripts", () => {
      expect(registry.supportsScripts("mind-a")).toBe(false);
    });
  });

  describe("listMinds", () => {
    it("should return empty array for uninitialized registry", () => {
      const newRegistry = new MindRegistry({ providers: [provider1] });

      expect(newRegistry.listMinds()).toEqual([]);
    });

    it("should return all mind names after initialization", async () => {
      await registry.init();

      const minds = registry.listMinds();

      expect(minds).toEqual(expect.arrayContaining(["mind-a", "mind-b", "mind-c"]));
      expect(minds.length).toBe(3);
    });
  });
});

describe("global registry instance", () => {
  it("should throw error when getting uninitialized registry", () => {
    expect(() => getMindRegistry()).toThrow(
      "MindRegistry not initialized. Call initMindRegistry first."
    );
  });

  it("should initialize and return global registry", async () => {
    const mockProvider = new MockProvider("test", []);

    const registry = await initMindRegistry({ providers: [mockProvider] });

    expect(registry).toBe(getMindRegistry());
  });

  it("should replace existing registry on re-initialization", async () => {
    const provider1 = new MockProvider("provider1", []);
    const provider2 = new MockProvider("provider2", []);

    const registry1 = await initMindRegistry({ providers: [provider1] });
    const registry2 = await initMindRegistry({ providers: [provider2] });

    expect(getMindRegistry()).toBe(registry2);
    expect(getMindRegistry()).not.toBe(registry1);
  });
});
