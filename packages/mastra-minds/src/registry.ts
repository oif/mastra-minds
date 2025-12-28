import { Glob } from "bun";
import { loadMind } from "./parser";
import type { Mind, MindMetadata } from "./types";

/**
 * MindRegistry manages mind discovery and loading
 * Implements progressive disclosure: metadata loaded upfront, full content on-demand
 */
export class MindRegistry {
  private mindsDir: string;
  private metadataCache: Map<string, MindMetadata> = new Map();
  private mindCache: Map<string, Mind> = new Map();

  constructor(mindsDir: string) {
    this.mindsDir = mindsDir;
  }

  /**
   * Discover all minds and load their metadata (Level 1: ~100 tokens each)
   */
  async discover(): Promise<MindMetadata[]> {
    const glob = new Glob("*/MIND.md");
    const minds: MindMetadata[] = [];

    for await (const path of glob.scan(this.mindsDir)) {
      const mindDir = `${this.mindsDir}/${path.replace("/MIND.md", "")}`;
      try {
        const mind = await loadMind(mindDir);
        const metadata: MindMetadata = {
          name: mind.frontmatter.name,
          description: mind.frontmatter.description,
        };
        this.metadataCache.set(mind.frontmatter.name, metadata);
        this.mindCache.set(mind.frontmatter.name, mind);
        minds.push(metadata);
      } catch (error) {
        console.error(`Failed to load mind from ${mindDir}:`, error);
      }
    }

    return minds;
  }

  /**
   * Get mind metadata by name
   */
  getMetadata(name: string): MindMetadata | undefined {
    return this.metadataCache.get(name);
  }

  /**
   * Load full mind content (Level 2: <5000 tokens)
   */
  async loadMind(name: string): Promise<Mind | undefined> {
    // Check cache first
    if (this.mindCache.has(name)) {
      return this.mindCache.get(name);
    }

    // Try to load from disk
    const mindDir = `${this.mindsDir}/${name}`;
    try {
      const mind = await loadMind(mindDir);
      this.mindCache.set(name, mind);
      return mind;
    } catch {
      return undefined;
    }
  }

  /**
   * Generate available minds list for system prompt injection
   */
  generateAvailableMinds(): string {
    if (this.metadataCache.size === 0) {
      return "No minds installed.";
    }

    const lines = Array.from(this.metadataCache.values())
      .map((mind) => `- \`${mind.name}\`: ${mind.description}`)
      .join("\n");

    return `Available minds:\n${lines}`;
  }

  /** @deprecated Use generateAvailableMinds() instead */
  generateAvailableMindsXml(): string {
    return this.generateAvailableMinds();
  }

  /**
   * List all available mind names
   */
  listMinds(): string[] {
    return Array.from(this.metadataCache.keys());
  }

  /**
   * Check if a mind exists
   */
  hasMind(name: string): boolean {
    return this.metadataCache.has(name);
  }
}

// Singleton instance
let registryInstance: MindRegistry | null = null;

export function getMindRegistry(mindsDir?: string): MindRegistry {
  if (!registryInstance && mindsDir) {
    registryInstance = new MindRegistry(mindsDir);
  }
  if (!registryInstance) {
    throw new Error("MindRegistry not initialized. Call with mindsDir first.");
  }
  return registryInstance;
}

export async function initMindRegistry(mindsDir: string): Promise<MindRegistry> {
  registryInstance = new MindRegistry(mindsDir);
  await registryInstance.discover();
  return registryInstance;
}
