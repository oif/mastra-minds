/**
 * mastra-minds
 *
 * Agent Minds system for Mastra - Claude-style skills with progressive disclosure
 *
 * @example
 * ```typescript
 * import { createMindsAgent, initMindRegistry, FileSystemProvider } from 'mastra-minds';
 *
 * // Initialize with provider(s)
 * await initMindRegistry({
 *   providers: [new FileSystemProvider('./minds')],
 * });
 *
 * // Create an agent with minds support
 * const agent = createMindsAgent({
 *   name: 'My Agent',
 *   model: 'your-model',
 *   additionalTools: { myTool },
 * });
 * ```
 */

// Core exports
export { parseMindMd } from "./parser";
export { MindRegistry, getMindRegistry, initMindRegistry } from "./registry";
export type { MindRegistryOptions, ConflictStrategy } from "./registry";
export {
  loadMindTool,
  readMindResourceTool,
  executeMindScriptTool,
  listMindsTool,
  mindTools,
} from "./tools";

// Providers
export { FileSystemProvider } from "./providers";

// Types
export type {
  Mind,
  MindFrontmatter,
  MindMetadata,
  MindsProvider,
  ScriptResult,
} from "./types";
export { MindFrontmatterSchema } from "./types";

// High-level API
export { createMindsAgent, withMinds } from "./agent";
export type { MindsAgentOptions, SystemMessage } from "./agent";
