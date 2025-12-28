import { z } from "zod";

// MIND.md frontmatter schema
export const MindFrontmatterSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Must be lowercase alphanumeric with hyphens"
    ),
  description: z.string().min(1).max(1024),
  license: z.string().optional(),
  compatibility: z.string().max(500).optional(),
  "allowed-tools": z.string().optional(),
  model: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type MindFrontmatter = z.infer<typeof MindFrontmatterSchema>;

// Minimal metadata for system prompt injection
export interface MindMetadata {
  name: string;
  description: string;
}

// Full mind content
export interface Mind {
  metadata: MindMetadata;
  frontmatter: MindFrontmatter;
  content: string;
}

// Script execution result
export interface ScriptResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Provider interface
export interface MindsProvider {
  readonly name: string;

  /**
   * Discover all available minds and return their metadata
   */
  discover(): Promise<MindMetadata[]>;

  /**
   * Load full mind content by name
   */
  loadMind(name: string): Promise<Mind | undefined>;

  /**
   * Check if a mind exists
   */
  hasMind(name: string): Promise<boolean>;

  /**
   * Read a resource file from a mind's directory
   * @param mindName - The mind name
   * @param path - Relative path to resource (e.g., 'references/guide.md')
   */
  readResource(mindName: string, path: string): Promise<string | undefined>;

  /**
   * Execute a script from a mind's scripts directory
   * Optional - not all providers support script execution
   */
  executeScript?(
    mindName: string,
    scriptPath: string,
    args?: string[]
  ): Promise<ScriptResult>;
}
