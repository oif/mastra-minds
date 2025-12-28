import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getMindRegistry } from "./registry";

/**
 * Load Mind Tool - Core of the prompt injection system
 */
export const loadMindTool = createTool({
  id: "load-mind",
  description: `Load a mind's instructions to help with a specific task.
When you determine a mind is relevant based on the <available_minds> list,
use this tool to load its full instructions. The loaded instructions should
guide your subsequent actions.`,
  inputSchema: z.object({
    name: z.string().describe("The name of the mind to load"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    mindName: z.string().optional(),
    instructions: z.string().optional(),
    allowedTools: z.array(z.string()).optional(),
    message: z.string().optional(),
  }),
  execute: async (inputData) => {
    const registry = getMindRegistry();
    const mind = await registry.loadMind(inputData.name);

    if (!mind) {
      return {
        success: false,
        message: `Mind "${inputData.name}" not found. Available minds: ${registry.listMinds().join(", ")}`,
      };
    }

    // Parse allowed-tools if present
    const allowedTools = mind.frontmatter["allowed-tools"]
      ?.split(/\s+/)
      .filter(Boolean);

    return {
      success: true,
      mindName: mind.metadata.name,
      instructions: mind.content,
      allowedTools,
    };
  },
});

/**
 * Read Mind Resource Tool
 */
export const readMindResourceTool = createTool({
  id: "read-mind-resource",
  description: `Read a resource file from a mind's directory.
Use this to access files in references/, scripts/, or assets/ directories
when the mind instructions reference them.`,
  inputSchema: z.object({
    mindName: z.string().describe("The name of the mind"),
    resourcePath: z
      .string()
      .describe("Relative path to the resource (e.g., 'references/guide.md')"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    content: z.string().optional(),
    message: z.string().optional(),
  }),
  execute: async (inputData) => {
    const registry = getMindRegistry();

    if (!(await registry.hasMind(inputData.mindName))) {
      return {
        success: false,
        message: `Mind "${inputData.mindName}" not found`,
      };
    }

    const content = await registry.readResource(
      inputData.mindName,
      inputData.resourcePath
    );

    if (content === undefined) {
      return {
        success: false,
        message: `Resource not found: ${inputData.resourcePath}`,
      };
    }

    return {
      success: true,
      content,
    };
  },
});

/**
 * Execute Mind Script Tool
 */
export const executeMindScriptTool = createTool({
  id: "execute-mind-script",
  description: `Execute a script from a mind's scripts/ directory.
Use this when mind instructions tell you to run a script for deterministic operations.
Scripts can be .ts, .js, .sh, or .py files.
Note: Not all providers support script execution.`,
  inputSchema: z.object({
    mindName: z.string().describe("The name of the mind"),
    scriptPath: z
      .string()
      .describe("Relative path to script in scripts/ (e.g., 'helper.ts')"),
    args: z
      .array(z.string())
      .optional()
      .describe("Arguments to pass to the script"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    stdout: z.string().optional(),
    stderr: z.string().optional(),
    exitCode: z.number().optional(),
    message: z.string().optional(),
  }),
  execute: async (inputData) => {
    const registry = getMindRegistry();

    if (!registry.supportsScripts()) {
      return {
        success: false,
        message:
          "Script execution is not supported by the current minds provider",
      };
    }

    if (!(await registry.hasMind(inputData.mindName))) {
      return {
        success: false,
        message: `Mind "${inputData.mindName}" not found`,
      };
    }

    const result = await registry.executeScript(
      inputData.mindName,
      inputData.scriptPath,
      inputData.args
    );

    if (!result) {
      return {
        success: false,
        message: "Script execution failed",
      };
    }

    return {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  },
});

/**
 * List Minds Tool
 */
export const listMindsTool = createTool({
  id: "list-minds",
  description: "List all available minds with their descriptions",
  inputSchema: z.object({}),
  outputSchema: z.object({
    minds: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
      })
    ),
  }),
  execute: async () => {
    const registry = getMindRegistry();
    const minds = registry.listMinds().map((name) => {
      const metadata = registry.getMetadata(name);
      return {
        name,
        description: metadata?.description || "",
      };
    });

    return { minds };
  },
});

// Export all mind-related tools
export const mindTools = {
  loadMindTool,
  readMindResourceTool,
  executeMindScriptTool,
  listMindsTool,
};
