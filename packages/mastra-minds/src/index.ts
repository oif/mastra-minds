/**
 * mastra-minds
 *
 * Agent Minds system for Mastra - Claude-style skills with progressive disclosure
 *
 * @example
 * ```typescript
 * import { createMindsAgent, initMindRegistry } from 'mastra-minds';
 *
 * // Initialize minds from a directory
 * await initMindRegistry('./minds');
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
export { parseMindMd, loadMind } from "./parser";
export {
  MindRegistry,
  getMindRegistry,
  initMindRegistry,
} from "./registry";
export {
  loadMindTool,
  readMindResourceTool,
  executeMindScriptTool,
  listMindsTool,
  mindTools,
} from "./tools";

// Types
export type { Mind, MindFrontmatter, MindMetadata } from "./types";
export { MindFrontmatterSchema } from "./types";

// High-level API
export { createMindsAgent, withMinds } from "./agent";
export type { MindsAgentOptions, SystemMessage } from "./agent";
