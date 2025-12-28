import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getMindRegistry } from "./registry";

/**
 * Mind Loader Tool - Core of the prompt injection system
 * When invoked, loads the full mind content and returns it for the agent to follow
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
    baseDir: z.string().optional(),
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
      mindName: mind.frontmatter.name,
      instructions: mind.content,
      baseDir: mind.baseDir,
      allowedTools,
    };
  },
});

/**
 * Read Mind Resource Tool - For loading references/scripts on-demand (Level 3)
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
    const mind = await registry.loadMind(inputData.mindName);

    if (!mind) {
      return {
        success: false,
        message: `Mind "${inputData.mindName}" not found`,
      };
    }

    // Security: prevent path traversal
    const normalizedPath = inputData.resourcePath.replace(/\.\./g, "");
    const fullPath = `${mind.baseDir}/${normalizedPath}`;

    try {
      const file = Bun.file(fullPath);
      if (!(await file.exists())) {
        return {
          success: false,
          message: `Resource not found: ${normalizedPath}`,
        };
      }

      const content = await file.text();
      return {
        success: true,
        content,
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to read resource: ${err}`,
      };
    }
  },
});

/**
 * Execute Mind Script Tool - Run scripts from mind's scripts/ directory
 * V1: Direct execution without sandbox (development only)
 */
export const executeMindScriptTool = createTool({
  id: "execute-mind-script",
  description: `Execute a script from a mind's scripts/ directory.
Use this when mind instructions tell you to run a script for deterministic operations.
Scripts can be .ts, .js, .sh, or .py files.`,
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
    const mind = await registry.loadMind(inputData.mindName);

    if (!mind) {
      return {
        success: false,
        message: `Mind "${inputData.mindName}" not found`,
      };
    }

    // Security: only allow scripts/ directory, prevent path traversal
    const scriptPath = inputData.scriptPath.replace(/\.\./g, "");
    const fullPath = `${mind.baseDir}/scripts/${scriptPath}`;

    // Determine executor based on extension (check before file exists)
    const ext = scriptPath.split(".").pop()?.toLowerCase();
    let command: string[];

    switch (ext) {
      case "ts":
      case "js":
        command = ["bun", fullPath, ...(inputData.args || [])];
        break;
      case "sh":
        command = ["bash", fullPath, ...(inputData.args || [])];
        break;
      case "py":
        command = ["python3", fullPath, ...(inputData.args || [])];
        break;
      default:
        return {
          success: false,
          message: `Unsupported script type: .${ext}. Use .ts, .js, .sh, or .py`,
        };
    }

    // Check file exists
    const file = Bun.file(fullPath);
    if (!(await file.exists())) {
      return {
        success: false,
        message: `Script not found: scripts/${scriptPath}`,
      };
    }

    try {
      const proc = Bun.spawn(command, {
        cwd: mind.baseDir,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          MIND_NAME: mind.frontmatter.name,
          MIND_DIR: mind.baseDir,
        },
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      return {
        success: exitCode === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
      };
    } catch (err) {
      return {
        success: false,
        message: `Execution failed: ${err}`,
      };
    }
  },
});

/**
 * List Minds Tool - Show available minds
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
