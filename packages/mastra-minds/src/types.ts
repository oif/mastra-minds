import { z } from "zod";

// MIND.md frontmatter schema
export const MindFrontmatterSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Must be lowercase alphanumeric with hyphens"),
  description: z.string().min(1).max(1024),
  license: z.string().optional(),
  compatibility: z.string().max(500).optional(),
  "allowed-tools": z.string().optional(),
  model: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type MindFrontmatter = z.infer<typeof MindFrontmatterSchema>;

// Full mind with parsed content
export interface Mind {
  frontmatter: MindFrontmatter;
  content: string; // Markdown body
  baseDir: string; // Absolute path to mind directory
}

// Minimal metadata for system prompt injection
export interface MindMetadata {
  name: string;
  description: string;
}
