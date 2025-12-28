/**
 * Commit Message Validator
 * Validates commit messages against Conventional Commits spec
 */

const TYPES = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "build", "ci"];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  parsed: {
    type: string | null;
    scope: string | null;
    breaking: boolean;
    description: string | null;
    body: string | null;
    footer: string | null;
  };
}

function validate(message: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = message.split("\n");
  const header = lines[0] || "";

  // Parse header: type(scope)!: description
  const headerRegex = /^(\w+)(?:\(([^)]+)\))?(!)?\s*:\s*(.+)$/;
  const match = header.match(headerRegex);

  const parsed = {
    type: null as string | null,
    scope: null as string | null,
    breaking: false,
    description: null as string | null,
    body: null as string | null,
    footer: null as string | null,
  };

  if (!match) {
    errors.push("Header must follow format: type(scope): description");
    return { valid: false, errors, warnings, parsed };
  }

  const [, type, scope, breaking, description] = match;
  parsed.type = type ?? null;
  parsed.scope = scope ?? null;
  parsed.breaking = breaking === "!";
  parsed.description = description ?? null;

  // Validate type
  if (type && !TYPES.includes(type)) {
    errors.push(`Invalid type "${type}". Must be one of: ${TYPES.join(", ")}`);
  }

  // Validate description
  if (description) {
    if (description.length > 50) {
      warnings.push(`Description exceeds 50 chars (${description.length}). Consider shortening.`);
    }
    if (description.endsWith(".")) {
      warnings.push("Description should not end with a period");
    }
    if (description[0] && description[0] === description[0].toUpperCase()) {
      warnings.push("Description should start with lowercase");
    }
  }

  // Parse body and footer
  if (lines.length > 1) {
    if (lines[1]?.trim() !== "") {
      warnings.push("Should have blank line between header and body");
    }

    const bodyLines: string[] = [];
    const footerLines: string[] = [];
    let inFooter = false;

    for (let i = 2; i < lines.length; i++) {
      const line = lines[i] ?? "";
      // Footer starts with token: or BREAKING CHANGE:
      if (line.match(/^[\w-]+:\s/) || line.startsWith("BREAKING CHANGE:")) {
        inFooter = true;
      }
      if (inFooter) {
        footerLines.push(line);
      } else {
        bodyLines.push(line);
      }
    }

    parsed.body = bodyLines.join("\n").trim() || null;
    parsed.footer = footerLines.join("\n").trim() || null;

    // Check body line length
    for (const line of bodyLines) {
      if (line.length > 72) {
        warnings.push(`Body line exceeds 72 chars. Consider wrapping.`);
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed,
  };
}

// Main
const message = Bun.argv[2];

if (!message) {
  console.log("Usage: bun validate.ts <commit-message>");
  console.log('Example: bun validate.ts "feat(auth): add login endpoint"');
  process.exit(1);
}

const result = validate(message);

console.log("=== Commit Message Validation ===\n");
console.log(`Message: "${message}"\n`);

if (result.valid) {
  console.log("✅ Valid commit message\n");
} else {
  console.log("❌ Invalid commit message\n");
}

if (result.errors.length > 0) {
  console.log("Errors:");
  result.errors.forEach((e) => console.log(`  - ${e}`));
  console.log();
}

if (result.warnings.length > 0) {
  console.log("Warnings:");
  result.warnings.forEach((w) => console.log(`  - ${w}`));
  console.log();
}

console.log("Parsed:");
console.log(`  Type: ${result.parsed.type}`);
console.log(`  Scope: ${result.parsed.scope || "(none)"}`);
console.log(`  Breaking: ${result.parsed.breaking}`);
console.log(`  Description: ${result.parsed.description}`);

process.exit(result.valid ? 0 : 1);
