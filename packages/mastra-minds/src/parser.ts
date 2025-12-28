import { MindFrontmatterSchema, type Mind } from "./types";

/**
 * Parse YAML frontmatter from MIND.md content
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error("Invalid MIND.md: missing YAML frontmatter");
  }

  const yamlContent = match[1] ?? "";
  const body = match[2] ?? "";

  // Simple YAML parser for frontmatter (handles basic key: value pairs)
  const frontmatter: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let multilineValue = "";
  let inMultiline = false;

  for (const line of yamlContent.split("\n")) {
    // Check for multiline indicator
    if (line.match(/^(\w[\w-]*):\s*\|$/)) {
      if (currentKey && inMultiline) {
        frontmatter[currentKey] = multilineValue.trim();
      }
      currentKey = line.match(/^(\w[\w-]*):/)?.[1] ?? null;
      inMultiline = true;
      multilineValue = "";
      continue;
    }

    // If in multiline mode, accumulate lines
    if (inMultiline && line.startsWith("  ")) {
      multilineValue += line.slice(2) + "\n";
      continue;
    }

    // End multiline if we hit a non-indented line
    if (inMultiline && !line.startsWith("  ") && line.trim()) {
      if (currentKey) {
        frontmatter[currentKey] = multilineValue.trim();
      }
      inMultiline = false;
    }

    // Regular key: value parsing
    const keyValueMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1];
      const value = keyValueMatch[2] ?? "";

      if (key) {
        // Handle quoted strings
        if (value.startsWith('"') && value.endsWith('"')) {
          frontmatter[key] = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          frontmatter[key] = value.slice(1, -1);
        } else {
          frontmatter[key] = value || undefined;
        }
        currentKey = key;
      }
    }
  }

  // Handle final multiline value
  if (inMultiline && currentKey) {
    frontmatter[currentKey] = multilineValue.trim();
  }

  return { frontmatter, body: body.trim() };
}

/**
 * Parse a MIND.md file content into a Mind object
 */
export function parseMindMd(content: string): Mind {
  const { frontmatter, body } = parseFrontmatter(content);

  // Validate frontmatter against schema
  const validatedFrontmatter = MindFrontmatterSchema.parse(frontmatter);

  return {
    metadata: {
      name: validatedFrontmatter.name,
      description: validatedFrontmatter.description,
    },
    frontmatter: validatedFrontmatter,
    content: body,
  };
}
