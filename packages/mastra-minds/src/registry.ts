import type { Mind, MindMetadata, MindsProvider } from "./types";
import { FileSystemProvider } from "./providers";

/**
 * MindRegistry - Central access point for minds
 *
 * Wraps a MindsProvider with caching and convenience methods.
 */
export class MindRegistry {
  private provider: MindsProvider;
  private metadataCache: Map<string, MindMetadata> = new Map();
  private mindCache: Map<string, Mind> = new Map();

  constructor(provider: MindsProvider) {
    this.provider = provider;
  }

  /**
   * Initialize the registry by discovering all minds
   */
  async init(): Promise<void> {
    const minds = await this.provider.discover();
    for (const mind of minds) {
      this.metadataCache.set(mind.name, mind);
    }
  }

  /**
   * Get the underlying provider
   */
  getProvider(): MindsProvider {
    return this.provider;
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

    const mind = await this.provider.loadMind(name);
    if (mind) {
      this.mindCache.set(name, mind);
    }
    return mind;
  }

  /**
   * Check if a mind exists
   */
  async hasMind(name: string): Promise<boolean> {
    if (this.metadataCache.has(name)) {
      return true;
    }
    return this.provider.hasMind(name);
  }

  /**
   * Read a resource from a mind
   */
  async readResource(
    mindName: string,
    path: string
  ): Promise<string | undefined> {
    return this.provider.readResource(mindName, path);
  }

  /**
   * Execute a script from a mind (if provider supports it)
   */
  async executeScript(
    mindName: string,
    scriptPath: string,
    args?: string[]
  ): Promise<
    | { success: boolean; stdout: string; stderr: string; exitCode: number }
    | undefined
  > {
    if (!this.provider.executeScript) {
      return undefined;
    }
    return this.provider.executeScript(mindName, scriptPath, args);
  }

  /**
   * Check if the provider supports script execution
   */
  supportsScripts(): boolean {
    return typeof this.provider.executeScript === "function";
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
 * Initialize the global MindRegistry with a provider
 */
export async function initMindRegistry(
  provider: MindsProvider
): Promise<MindRegistry> {
  registryInstance = new MindRegistry(provider);
  await registryInstance.init();
  return registryInstance;
}

/**
 * Initialize with filesystem provider (convenience function)
 */
export async function initMindRegistryFromPath(
  mindsDir: string
): Promise<MindRegistry> {
  return initMindRegistry(new FileSystemProvider(mindsDir));
}
