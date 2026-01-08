/**
 * Simple logger interface for structured logging
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.DEBUG || process.env.VERBOSE) {
      console.log(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : "");
  }
}

export class NoopLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Observability hooks for tracking mind operations
 */
export interface ObservabilityHooks {
  onMindLoad?(mindName: string, duration: number, cached: boolean): void;
  onToolCall?(toolName: string, args: Record<string, unknown>): void;
  onScriptExecute?(
    mindName: string,
    scriptPath: string,
    result: { success: boolean; duration: number }
  ): void;
  onError?(error: Error, context?: Record<string, unknown>): void;
}

export interface ObservabilityOptions {
  logger?: Logger;
  hooks?: ObservabilityHooks;
}

let globalLogger: Logger = new ConsoleLogger();
let globalHooks: ObservabilityHooks = {};

export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

export function getLogger(): Logger {
  return globalLogger;
}

export function setHooks(hooks: ObservabilityHooks): void {
  globalHooks = { ...globalHooks, ...hooks };
}

export function getHooks(): ObservabilityHooks {
  return globalHooks;
}

export function resetObservability(): void {
  globalLogger = new ConsoleLogger();
  globalHooks = {};
}

/**
 * Utility function to measure execution time
 */
export async function measureDuration<T>(
  operation: string,
  fn: () => Promise<T>,
  logger?: Logger
): Promise<T> {
  const start = performance.now();
  const currentLogger = logger || globalLogger;

  currentLogger.debug(`Starting: ${operation}`);

  try {
    const result = await fn();
    const duration = performance.now() - start;

    currentLogger.debug(`Completed: ${operation}`, { duration: `${duration.toFixed(2)}ms` });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    currentLogger.error(`Failed: ${operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * Utility function to track errors
 */
export function trackError(error: Error, context?: Record<string, unknown>): void {
  globalHooks.onError?.(error, context);
  globalLogger.error(error.message, context);
}
