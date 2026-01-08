import type { Mind, MindMetadata, MindsProvider, ScriptResult } from "./types";
import { FileSystemProvider } from "./providers";

/**
 * Conflict resolution strategy when multiple providers have the same mind name
 */
export type ConflictStrategy = "first" | "last";

/**
 * Options for MindRegistry
 */
export interface MindRegistryOptions {
  providers: MindsProvider[];
  conflictStrategy?: ConflictStrategy;
}

/**
 * MindRegistry - Central access point for minds
 *
 * Supports multiple providers with configurable conflict resolution.
 */
export class MindRegistry {
  private providers: MindsProvider[];
  private strategy: ConflictStrategy;
  private metadataCache: Map<string, MindMetadata> = new Map();
  private mindCache: Map<string, Mind> = new Map();
  private mindProviderMap: Map<string, MindsProvider> = new Map();

  constructor(options: MindRegistryOptions) {
    this.providers = options.providers;
    this.strategy = options.conflictStrategy ?? "first";
  }

  /**
   * Initialize the registry by discovering minds from all providers
   */
  async init(): Promise<void> {
    this.metadataCache.clear();
    this.mindCache.clear();
    this.mindProviderMap.clear();

    // Process providers in order
    for (const provider of this.providers) {
      const minds = await provider.discover();

      for (const mind of minds) {
        const existing = this.mindProviderMap.get(mind.name);

        if (existing) {
          if (this.strategy === "first") {
            console.warn(
              `Mind "${mind.name}" from [${provider.name}] skipped, already registered from [${existing.name}]`
            );
            continue;
          }
          console.warn(
            `Mind "${mind.name}" overwritten: [${existing.name}] -> [${provider.name}]`
          );
        }

        this.mindProviderMap.set(mind.name, provider);
        this.metadataCache.set(mind.name, mind);
      }
    }
  }

  /**
   * Get the provider for a specific mind
   */
  getProviderForMind(name: string): MindsProvider | undefined {
    return this.mindProviderMap.get(name);
  }

  /**
   * Get all providers
   */
  getProviders(): MindsProvider[] {
    return this.providers;
  }

  /**
   * Get mind metadata by name
   */
  getMetadata(name: string): MindMetadata | undefined {
    return this.metadataCache.get(name);
  }

  /**
   * Load full mind content (with caching)
   */
  async loadMind(name: string): Promise<Mind | undefined> {
    if (this.mindCache.has(name)) {
      return this.mindCache.get(name);
    }

    const provider = this.mindProviderMap.get(name);
    if (!provider) {
      return undefined;
    }

    const mind = await provider.loadMind(name);
    if (mind) {
      this.mindCache.set(name, mind);
    }
    return mind;
  }

  /**
   * Check if a mind exists
   */
  hasMind(name: string): boolean {
    return this.mindProviderMap.has(name);
  }

  /**
   * Read a resource from a mind
   */
  async readResource(
    mindName: string,
    path: string
  ): Promise<string | undefined> {
    const provider = this.mindProviderMap.get(mindName);
    return provider?.readResource(mindName, path);
  }

  /**
   * Execute a script from a mind (if provider supports it)
   */
  async executeScript(
    mindName: string,
    scriptPath: string,
    args?: string[]
  ): Promise<ScriptResult | undefined> {
    const provider = this.mindProviderMap.get(mindName);
    if (!provider?.executeScript) {
      return undefined;
    }
    return provider.executeScript(mindName, scriptPath, args);
  }

  /**
   * Check if the provider for a mind supports script execution
   */
  supportsScripts(mindName: string): boolean {
    const provider = this.mindProviderMap.get(mindName);
    return typeof provider?.executeScript === "function";
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

  /**
   * List all available mind names
   */
  listMinds(): string[] {
    return Array.from(this.metadataCache.keys());
  }
}

// Singleton instance
let registryInstance: MindRegistry | null = null;

/**
 * Get the global MindRegistry instance
 */
export function getMindRegistry(): MindRegistry {
  if (!registryInstance) {
    throw new Error(
      "MindRegistry not initialized. Call initMindRegistry first."
    );
  }
  return registryInstance;
}

/**
 * Initialize the global MindRegistry
 */
export async function initMindRegistry(
  options: MindRegistryOptions
): Promise<MindRegistry> {
  registryInstance = new MindRegistry(options);
  await registryInstance.init();
  return registryInstance;
}
