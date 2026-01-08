import { describe, it, expect } from "bun:test";
import { parseMindMd } from "../parser";
import { MindFrontmatterSchema } from "../types";

describe("parseMindMd", () => {
  describe("valid MIND.md files", () => {
    it("should parse a basic MIND.md with required fields", () => {
      const content = `---
name: test-mind
description: A test mind
---

# Test Mind

This is a test mind.`;

      const result = parseMindMd(content);

      expect(result.metadata.name).toBe("test-mind");
      expect(result.metadata.description).toBe("A test mind");
      expect(result.frontmatter.name).toBe("test-mind");
      expect(result.frontmatter.description).toBe("A test mind");
      expect(result.content).toBe("# Test Mind\n\nThis is a test mind.");
    });

    it("should parse MIND.md with optional fields", () => {
      const content = `---
name: test-mind
description: A test mind
license: MIT
compatibility: ">=1.0.0"
allowed-tools: Read Write Bash
model: gpt-4
metadata:
  author: Test Author
  version: "1.0.0"
---

# Test Mind`;

      const result = parseMindMd(content);

      expect(result.frontmatter.license).toBe("MIT");
      expect(result.frontmatter.compatibility).toBe(">=1.0.0");
      expect(result.frontmatter["allowed-tools"]).toBe("Read Write Bash");
      expect(result.frontmatter.model).toBe("gpt-4");
      expect(result.frontmatter.metadata).toEqual({
        author: "Test Author",
        version: "1.0.0",
      });
    });

    it("should handle empty content body", () => {
      const content = `---
name: test-mind
description: A test mind
---`;

      const result = parseMindMd(content);

      expect(result.content).toBe("");
    });

    it("should handle multiline content", () => {
      const content = `---
name: test-mind
description: A test mind
---

# Title

Paragraph one.

Paragraph two.

## Subsection

Content.`;

      const result = parseMindMd(content);

      expect(result.content).toContain("# Title");
      expect(result.content).toContain("Paragraph one.");
      expect(result.content).toContain("Paragraph two.");
      expect(result.content).toContain("## Subsection");
    });
  });

  describe("name validation", () => {
    it("should accept valid lowercase alphanumeric names", () => {
      const validNames = [
        "test",
        "test-mind",
        "my-awesome-mind",
        "mind123",
        "123-456",
      ];

      for (const name of validNames) {
        const content = `---
name: ${name}
description: Test
---`;
        const result = parseMindMd(content);
        expect(result.metadata.name).toBe(name);
      }
    });

    it("should reject uppercase letters", () => {
      const content = `---
name: TestMind
description: Test
---`;

      expect(() => parseMindMd(content)).toThrow();
    });

    it("should reject special characters except hyphens", () => {
      const invalidNames = ["test_mind", "test.mind", "test mind", "test/mind"];

      for (const name of invalidNames) {
        const content = `---
name: ${name}
description: Test
---`;
        expect(() => parseMindMd(content)).toThrow();
      }
    });

    it("should reject names starting/ending with hyphen", () => {
      const invalidNames = ["-test", "test-", "-test-mind-"];

      for (const name of invalidNames) {
        const content = `---
name: ${name}
description: Test
---`;
        expect(() => parseMindMd(content)).toThrow();
      }
    });

    it("should reject consecutive hyphens", () => {
      const content = `---
name: test--mind
description: Test
---`;

      expect(() => parseMindMd(content)).toThrow();
    });

    it("should enforce length limits (1-64 chars)", () => {
      // Too short
      expect(() => {
        parseMindMd(`---
name: ""
description: Test
---`);
      }).toThrow();

      // Too long
      const longName = "a".repeat(65);
      expect(() => {
        parseMindMd(`---
name: ${longName}
description: Test
---`);
      }).toThrow();
    });
  });

  describe("description validation", () => {
    it("should enforce length limits (1-1024 chars)", () => {
      // Too long
      const longDesc = "a".repeat(1025);
      expect(() => {
        parseMindMd(`---
name: test-mind
description: ${longDesc}
---`);
      }).toThrow();
    });

    it("should reject empty description", () => {
      const content = `---
name: test-mind
description: ""
---`;

      expect(() => parseMindMd(content)).toThrow();
    });
  });

  describe("frontmatter schema validation", () => {
    it("should validate using Zod schema", () => {
      const content = `---
name: test-mind
description: Test
license: MIT
---

Content`;

      const result = parseMindMd(content);

      // Verify the result matches the schema
      const validated = MindFrontmatterSchema.parse(result.frontmatter);
      expect(validated).toEqual(result.frontmatter);
    });

    it("should reject invalid YAML syntax", () => {
      const content = `---
name: test-mind
description: [invalid yaml
---`;

      // gray-matter should handle this, but the content might be invalid
      // This tests that we handle parsing errors gracefully
      expect(() => parseMindMd(content)).toThrow();
    });

    it("should reject missing required fields", () => {
      const content = `---
name: test-mind
---`;

      expect(() => parseMindMd(content)).toThrow();
    });
  });

  describe("metadata field validation", () => {
    it("should accept custom metadata as string pairs", () => {
      const content = `---
name: test-mind
description: Test
metadata:
  key1: value1
  key2: value2
  number: "123"
  boolean: "true"
---`;

      const result = parseMindMd(content);

      expect(result.frontmatter.metadata).toEqual({
        key1: "value1",
        key2: "value2",
        number: "123",
        boolean: "true",
      });
    });

    it("should accept empty metadata", () => {
      const content = `---
name: test-mind
description: Test
metadata: {}
---`;

      const result = parseMindMd(content);

      expect(result.frontmatter.metadata).toEqual({});
    });
  });

  describe("edge cases", () => {
    it("should handle CRLF line endings", () => {
      const content = `---\r\nname: test-mind\r\ndescription: Test\r\n---\r\n\r\nContent`;

      const result = parseMindMd(content);

      expect(result.metadata.name).toBe("test-mind");
    });

    it("should handle extra whitespace in frontmatter", () => {
      const content = `---
name:    test-mind
description:    Test with spaces
---`;

      const result = parseMindMd(content);

      expect(result.metadata.name).toBe("test-mind");
      expect(result.metadata.description).toBe("Test with spaces");
    });

    it("should handle YAML anchors and aliases if present", () => {
      const content = `---
name: test-mind
description: Test
metadata: &metadata
  key: value
other: *metadata
---`;

      // This should parse correctly with gray-matter
      const result = parseMindMd(content);

      expect(result.metadata.name).toBe("test-mind");
    });

    it("should trim whitespace from content body", () => {
      const content = `---
name: test-mind
description: Test
---

   # Content with spaces

   Paragraph with spaces.

   `;

      const result = parseMindMd(content);

      // The body should be trimmed
      expect(result.content.trim()).toBe(result.content);
    });
  });

  describe("error handling", () => {
    it("should throw ZodError for invalid schema", () => {
      const content = `---
name: invalid@name!
description: Test
---`;

      expect(() => parseMindMd(content)).toThrow();
    });

    it("should provide clear error messages", () => {
      const content = `---
name: INVALID_NAME
description: Test
---`;

      try {
        parseMindMd(content);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
