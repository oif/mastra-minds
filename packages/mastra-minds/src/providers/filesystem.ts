import { Glob } from "bun";
import { parseMindMd } from "../parser";
import type { Mind, MindMetadata, MindsProvider, ScriptResult } from "../types";

/**
 * FileSystemProvider - Loads minds from a local directory
 *
 * Directory structure:
 * ```
 * mindsDir/
 * ├── mind-name/
 * │   ├── MIND.md
 * │   ├── references/
 * │   │   └── guide.md
 * │   └── scripts/
 * │       └── helper.ts
 * ```
 */
export class FileSystemProvider implements MindsProvider {
  readonly name = "filesystem";
  private baseDir: string;
  private mindDirs: Map<string, string> = new Map(); // mindName -> absolute dir path

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async discover(): Promise<MindMetadata[]> {
    const glob = new Glob("*/MIND.md");
    const minds: MindMetadata[] = [];

    for await (const path of glob.scan(this.baseDir)) {
      const mindDirName = path.replace("/MIND.md", "");
      const mindDir = `${this.baseDir}/${mindDirName}`;

      try {
        const file = Bun.file(`${mindDir}/MIND.md`);
        const content = await file.text();
        const mind = parseMindMd(content);

        this.mindDirs.set(mind.metadata.name, mindDir);
        minds.push(mind.metadata);
      } catch (error) {
        console.error(`Failed to load mind from ${mindDir}:`, error);
      }
    }

    return minds;
  }

  async loadMind(name: string): Promise<Mind | undefined> {
    const mindDir = this.mindDirs.get(name);
    if (!mindDir) {
      // Try direct path as fallback
      const fallbackDir = `${this.baseDir}/${name}`;
      const file = Bun.file(`${fallbackDir}/MIND.md`);
      if (!(await file.exists())) {
        return undefined;
      }

      try {
        const content = await file.text();
        const mind = parseMindMd(content);
        this.mindDirs.set(name, fallbackDir);
        return mind;
      } catch {
        return undefined;
      }
    }

    try {
      const file = Bun.file(`${mindDir}/MIND.md`);
      const content = await file.text();
      return parseMindMd(content);
    } catch {
      return undefined;
    }
  }

  async hasMind(name: string): Promise<boolean> {
    if (this.mindDirs.has(name)) {
      return true;
    }

    const fallbackDir = `${this.baseDir}/${name}`;
    const file = Bun.file(`${fallbackDir}/MIND.md`);
    return file.exists();
  }

  async readResource(
    mindName: string,
    path: string
  ): Promise<string | undefined> {
    const mindDir = this.mindDirs.get(mindName);
    if (!mindDir) {
      return undefined;
    }

    // Security: prevent path traversal
    const normalizedPath = path.replace(/\.\./g, "");
    const fullPath = `${mindDir}/${normalizedPath}`;

    try {
      const file = Bun.file(fullPath);
      if (!(await file.exists())) {
        return undefined;
      }
      return file.text();
    } catch {
      return undefined;
    }
  }

  async executeScript(
    mindName: string,
    scriptPath: string,
    args?: string[]
  ): Promise<ScriptResult> {
    const mindDir = this.mindDirs.get(mindName);
    if (!mindDir) {
      return {
        success: false,
        stdout: "",
        stderr: `Mind "${mindName}" not found`,
        exitCode: 1,
      };
    }

    // Security: only allow scripts/ directory, prevent path traversal
    const normalizedPath = scriptPath.replace(/\.\./g, "");
    const fullPath = `${mindDir}/scripts/${normalizedPath}`;

    // Determine executor based on extension
    const ext = scriptPath.split(".").pop()?.toLowerCase();
    let command: string[];

    switch (ext) {
      case "ts":
      case "js":
        command = ["bun", fullPath, ...(args || [])];
        break;
      case "sh":
        command = ["bash", fullPath, ...(args || [])];
        break;
      case "py":
        command = ["python3", fullPath, ...(args || [])];
        break;
      default:
        return {
          success: false,
          stdout: "",
          stderr: `Unsupported script type: .${ext}. Use .ts, .js, .sh, or .py`,
          exitCode: 1,
        };
    }

    // Check file exists
    const file = Bun.file(fullPath);
    if (!(await file.exists())) {
      return {
        success: false,
        stdout: "",
        stderr: `Script not found: scripts/${scriptPath}`,
        exitCode: 1,
      };
    }

    try {
      const proc = Bun.spawn(command, {
        cwd: mindDir,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          MIND_NAME: mindName,
          MIND_DIR: mindDir,
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
    } catch (error) {
      return {
        success: false,
        stdout: "",
        stderr: `Execution failed: ${error}`,
        exitCode: 1,
      };
    }
  }
}
