import { Agent } from "@mastra/core/agent";
import type { CoreSystemMessage } from "ai";
import { getMindRegistry } from "./registry";
import { mindTools } from "./tools";

/**
 * SystemMessage type - matches Mastra's supported formats
 */
export type SystemMessage =
  | string
  | string[]
  | CoreSystemMessage
  | CoreSystemMessage[];

export interface MindsAgentOptions {
  /** Agent name */
  name: string;

  /** LLM model configuration */
  model: string;

  /** Your instructions - minds instructions will be auto-injected */
  instructions?: SystemMessage;

  /** Additional tools to include alongside mind tools */
  additionalTools?: Record<string, unknown>;

  /**
   * Where to inject minds instructions: 'before' or 'after' your instructions
   * @default 'after'
   */
  mindsPosition?: "before" | "after";
}

/**
 * Generate the minds system message (internal use)
 */
function buildMindsSystemMessage(availableMinds: string): CoreSystemMessage {
  return {
    role: "system",
    content: `## Minds System

You have access to a minds system that provides specialized capabilities.
When a user's request matches a mind's description, use the load-mind tool
to load that mind's instructions, then follow them.

${availableMinds}

## How to Use Minds

1. Check if the user's request matches any available mind
2. If yes, use the load-mind tool with the mind name
3. Follow the loaded instructions to complete the task
4. Use read-mind-resource if instructions reference additional files
5. Use execute-mind-script if instructions tell you to run a script`,
  };
}

/**
 * Convert any SystemMessage format to CoreSystemMessage[]
 */
function normalizeToMessages(input: SystemMessage): CoreSystemMessage[] {
  if (typeof input === "string") {
    return [{ role: "system", content: input }];
  }

  if (Array.isArray(input)) {
    if (input.length === 0) return [];

    if (typeof input[0] === "string") {
      return (input as string[]).map((content) => ({
        role: "system" as const,
        content,
      }));
    }

    return input as CoreSystemMessage[];
  }

  return [input];
}

/**
 * Wrap instructions with minds support
 *
 * Use this when you're creating an Agent manually but want minds auto-injected.
 *
 * @example
 * ```typescript
 * const agent = new Agent({
 *   name: 'My Agent',
 *   model: 'claude-sonnet-4-20250514',
 *   instructions: withMinds('You are a helpful assistant.'),
 *   tools: { ...mindTools, ...myTools },
 * });
 * ```
 */
export function withMinds(
  instructions?: SystemMessage,
  position: "before" | "after" = "after"
): CoreSystemMessage[] {
  const registry = getMindRegistry();
  const availableMinds = registry.generateAvailableMinds();
  const mindsMessage = buildMindsSystemMessage(availableMinds);

  if (!instructions) {
    return [mindsMessage];
  }

  const userMessages = normalizeToMessages(instructions);

  return position === "before"
    ? [mindsMessage, ...userMessages]
    : [...userMessages, mindsMessage];
}

/**
 * Create a Mastra Agent with minds support
 *
 * Minds instructions are automatically injected - you just provide your own instructions.
 *
 * @example
 * ```typescript
 * import { createMindsAgent, initMindRegistry } from 'mastra-minds';
 *
 * await initMindRegistry('./minds');
 *
 * const agent = createMindsAgent({
 *   name: 'My Agent',
 *   model: 'claude-sonnet-4-20250514',
 *   instructions: 'You are a helpful assistant.',
 * });
 * ```
 */
export function createMindsAgent(options: MindsAgentOptions): Agent {
  const position = options.mindsPosition ?? "after";
  const instructions = withMinds(options.instructions, position);
  // Generate id from name: "My Agent" -> "my-agent"
  const id = options.name.toLowerCase().replace(/\s+/g, "-");

  return new Agent({
    id,
    name: options.name,
    model: options.model,
    instructions,
    tools: {
      ...mindTools,
      ...(options.additionalTools || {}),
    },
  });
}
