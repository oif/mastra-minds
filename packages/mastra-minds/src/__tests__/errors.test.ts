import { describe, it, expect } from "bun:test";
import {
  MindNotFoundError,
  MindValidationError,
  ScriptExecutionError,
  SecurityError,
  isMindError,
  getErrorSuggestion,
} from "../errors";

describe("Custom Errors", () => {
  describe("MindNotFoundError", () => {
    it("should create error with mind name and available minds", () => {
      const error = new MindNotFoundError("test-mind", ["mind-a", "mind-b"]);

      expect(error.name).toBe("MindNotFoundError");
      expect(error.mindName).toBe("test-mind");
      expect(error.availableMinds).toEqual(["mind-a", "mind-b"]);
      expect(error.message).toContain("test-mind");
      expect(error.message).toContain("mind-a");
    });

    it("should handle empty available minds list", () => {
      const error = new MindNotFoundError("test-mind", []);

      expect(error.message).toContain("none");
    });
  });

  describe("MindValidationError", () => {
    it("should create error from Zod error", () => {
      const mockZodError = {
        errors: [
          { path: ["name"], message: "Invalid name", code: "invalid_string" },
          { path: ["description"], message: "Too long", code: "too_big" },
        ],
      };

      const error = new MindValidationError(mockZodError as any);

      expect(error.name).toBe("MindValidationError");
      expect(error.errors).toHaveLength(2);
      expect(error.message).toContain("name: Invalid name");
      expect(error.message).toContain("description: Too long");
    });

    it("should handle empty errors array", () => {
      const mockZodError = { errors: [] };
      const error = new MindValidationError(mockZodError as any);

      expect(error.errors).toEqual([]);
    });
  });

  describe("ScriptExecutionError", () => {
    it("should create error with script details", () => {
      const error = new ScriptExecutionError(
        "test.ts",
        1,
        "stdout output",
        "error message"
      );

      expect(error.name).toBe("ScriptExecutionError");
      expect(error.scriptPath).toBe("test.ts");
      expect(error.exitCode).toBe(1);
      expect(error.stdout).toBe("stdout output");
      expect(error.stderr).toBe("error message");
      expect(error.message).toContain("test.ts");
      expect(error.message).toContain("exit code 1");
    });

    describe("getSuggestion", () => {
      it("should suggest checking interpreter for 'command not found'", () => {
        const error = new ScriptExecutionError(
          "test.ts",
          1,
          "",
          "bun: command not found"
        );

        const suggestion = error.getSuggestion();
        expect(suggestion).toContain("interpreter");
      });

      it("should suggest checking permissions for 'permission denied'", () => {
        const error = new ScriptExecutionError(
          "test.sh",
          1,
          "",
          "bash: permission denied"
        );

        const suggestion = error.getSuggestion();
        expect(suggestion).toContain("permissions");
      });

      it("should suggest checking dependencies for 'Cannot find module'", () => {
        const error = new ScriptExecutionError(
          "test.ts",
          1,
          "",
          "Cannot find module 'missing-module'"
        );

        const suggestion = error.getSuggestion();
        expect(suggestion).toContain("dependencies");
      });

      it("should return generic suggestion for unknown errors", () => {
        const error = new ScriptExecutionError(
          "test.ts",
          1,
          "",
          "unknown error"
        );

        const suggestion = error.getSuggestion();
        expect(suggestion).toContain("Check the script logs");
      });
    });
  });

  describe("SecurityError", () => {
    it("should create error with reason", () => {
      const error = new SecurityError("Path traversal detected");

      expect(error.name).toBe("SecurityError");
      expect(error.reason).toBe("Path traversal detected");
      expect(error.message).toContain("Path traversal detected");
    });

    it("should include path if provided", () => {
      const error = new SecurityError("Path traversal detected", "../../../etc/passwd");

      expect(error.path).toBe("../../../etc/passwd");
      expect(error.message).toContain("../../../etc/passwd");
    });
  });

  describe("isMindError", () => {
    it("should identify MindNotFoundError", () => {
      const error = new MindNotFoundError("test", []);
      expect(isMindError(error)).toBe(true);
    });

    it("should identify MindValidationError", () => {
      const error = new MindValidationError({ errors: [] });
      expect(isMindError(error)).toBe(true);
    });

    it("should identify ScriptExecutionError", () => {
      const error = new ScriptExecutionError("test.ts", 1, "", "");
      expect(isMindError(error)).toBe(true);
    });

    it("should identify SecurityError", () => {
      const error = new SecurityError("test");
      expect(isMindError(error)).toBe(true);
    });

    it("should return false for regular Error", () => {
      const error = new Error("regular error");
      expect(isMindError(error)).toBe(false);
    });

    it("should return false for non-Error objects", () => {
      expect(isMindError("string")).toBe(false);
      expect(isMindError(null)).toBe(false);
      expect(isMindError(undefined)).toBe(false);
    });
  });

  describe("getErrorSuggestion", () => {
    it("should return suggestion for MindNotFoundError", () => {
      const error = new MindNotFoundError("test", ["mind-a", "mind-b"]);
      const suggestion = getErrorSuggestion(error);

      expect(suggestion).toContain("mind name is correct");
      expect(suggestion).toContain("mind-a");
    });

    it("should return suggestion for MindValidationError", () => {
      const error = new MindValidationError({ errors: [] });
      const suggestion = getErrorSuggestion(error);

      expect(suggestion).toContain("Review the MIND.md");
    });

    it("should return suggestion for SecurityError", () => {
      const error = new SecurityError("test");
      const suggestion = getErrorSuggestion(error);

      expect(suggestion).toContain("within the mind directory");
    });

    it("should return suggestion for ScriptExecutionError", () => {
      const error = new ScriptExecutionError("test.ts", 1, "", "bun: command not found");
      const suggestion = getErrorSuggestion(error);

      expect(suggestion).toContain("interpreter");
    });

    it("should return generic suggestion for unknown error type", () => {
      const error = new SecurityError("test");
      const suggestion = getErrorSuggestion(error);

      expect(suggestion).toBeDefined();
    });
  });
});
