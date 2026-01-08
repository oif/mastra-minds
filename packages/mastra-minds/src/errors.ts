/**
 * Custom error types for mastra-minds
 */

export class MindNotFoundError extends Error {
  public readonly name = "MindNotFoundError";
  public readonly mindName: string;
  public readonly availableMinds: string[];

  constructor(mindName: string, availableMinds: string[]) {
    super(
      `Mind "${mindName}" not found. Available minds: ${availableMinds.join(", ") || "none"}`
    );
    this.mindName = mindName;
    this.availableMinds = availableMinds;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MindNotFoundError);
    }
  }
}

export class MindValidationError extends Error {
  public readonly name = "MindValidationError";
  public readonly errors: Array<{ path: string[]; message: string; code: string }>;

  constructor(zodError: any) {
    const errorMessages = zodError.errors?.map(
      (e: any) => `${e.path.join(".")}: ${e.message}`
    ) || [];

    super(`Mind validation failed:\n${errorMessages.join("\n")}`);
    this.errors = zodError.errors || [];

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MindValidationError);
    }
  }
}

export class MindResourceNotFoundError extends Error {
  public readonly name = "MindResourceNotFoundError";
  public readonly mindName: string;
  public readonly resourcePath: string;

  constructor(mindName: string, resourcePath: string) {
    super(`Resource "${resourcePath}" not found in mind "${mindName}"`);
    this.mindName = mindName;
    this.resourcePath = resourcePath;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MindResourceNotFoundError);
    }
  }
}

export class ScriptExecutionError extends Error {
  public readonly name = "ScriptExecutionError";
  public readonly scriptPath: string;
  public readonly exitCode: number;
  public readonly stdout: string;
  public readonly stderr: string;

  constructor(
    scriptPath: string,
    exitCode: number,
    stdout: string,
    stderr: string
  ) {
    super(
      `Script "${scriptPath}" failed with exit code ${exitCode}.\nStderr: ${stderr}`
    );
    this.scriptPath = scriptPath;
    this.exitCode = exitCode;
    this.stdout = stdout;
    this.stderr = stderr;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScriptExecutionError);
    }
  }

  getSuggestion(): string {
    if (this.stderr.includes("command not found")) {
      return "Ensure the required interpreter is installed (bun, bash, python3).";
    }
    if (this.stderr.includes("permission denied")) {
      return "Check that the script has execute permissions.";
    }
    if (this.stderr.includes("Cannot find module")) {
      return "Ensure all dependencies are installed.";
    }
    return "Check the script logs for more details.";
  }
}

export class MindInitializationError extends Error {
  public readonly name = "MindInitializationError";
  public readonly reason: string;

  constructor(reason: string) {
    super(`Failed to initialize mind registry: ${reason}`);
    this.reason = reason;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MindInitializationError);
    }
  }
}

export class ProviderError extends Error {
  public readonly name = "ProviderError";
  public readonly providerName: string;
  public readonly reason: string;

  constructor(providerName: string, reason: string) {
    super(`Provider "${providerName}" error: ${reason}`);
    this.providerName = providerName;
    this.reason = reason;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProviderError);
    }
  }
}

export class SecurityError extends Error {
  public readonly name = "SecurityError";
  public readonly reason: string;
  public readonly path?: string;

  constructor(reason: string, path?: string) {
    super(`Security violation: ${reason}${path ? ` (path: ${path})` : ""}`);
    this.reason = reason;
    this.path = path;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SecurityError);
    }
  }
}

export type MindError =
  | MindNotFoundError
  | MindValidationError
  | MindResourceNotFoundError
  | ScriptExecutionError
  | MindInitializationError
  | ProviderError
  | SecurityError;

export function isMindError(error: unknown): error is MindError {
  return (
    error instanceof MindNotFoundError ||
    error instanceof MindValidationError ||
    error instanceof MindResourceNotFoundError ||
    error instanceof ScriptExecutionError ||
    error instanceof MindInitializationError ||
    error instanceof ProviderError ||
    error instanceof SecurityError
  );
}

export function getErrorSuggestion(error: MindError): string {
  if (error instanceof ScriptExecutionError) {
    return error.getSuggestion();
  }
  if (error instanceof MindNotFoundError) {
    return `Check that the mind name is correct and available. Available minds: ${error.availableMinds.join(", ")}`;
  }
  if (error instanceof MindValidationError) {
    return "Review the MIND.md frontmatter and ensure all required fields are present and valid.";
  }
  if (error instanceof SecurityError) {
    return "Ensure all paths are within the mind directory and do not contain path traversal attempts.";
  }
  return "Check the error message and logs for more details.";
}
