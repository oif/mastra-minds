import matter from "gray-matter";
import { MindFrontmatterSchema, type Mind } from "./types";

/**
 * Parse YAML frontmatter from MIND.md content
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const { data, content: body } = matter(content);
  return { frontmatter: data, body: body.trim() };
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
