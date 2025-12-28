/**
 * Git Change Analyzer
 * Analyzes staged and unstaged changes to suggest commit type
 */

interface ChangeAnalysis {
  staged: FileChange[];
  unstaged: FileChange[];
  suggestedType: string;
  suggestedScope: string | null;
  summary: string;
}

interface FileChange {
  path: string;
  status: string;
  additions: number;
  deletions: number;
}

async function run(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const output = await new Response(proc.stdout).text();
  await proc.exited;
  return output.trim();
}

async function getGitStatus(): Promise<{ staged: FileChange[]; unstaged: FileChange[] }> {
  const status = await run(["git", "status", "--porcelain"]);
  const staged: FileChange[] = [];
  const unstaged: FileChange[] = [];

  for (const line of status.split("\n").filter(Boolean)) {
    const indexStatus = line[0];
    const workStatus = line[1];
    const path = line.slice(3);

    if (indexStatus !== " " && indexStatus !== "?") {
      staged.push({ path, status: indexStatus, additions: 0, deletions: 0 });
    }
    if (workStatus !== " " && workStatus !== "?") {
      unstaged.push({ path, status: workStatus, additions: 0, deletions: 0 });
    }
    if (indexStatus === "?" && workStatus === "?") {
      unstaged.push({ path, status: "untracked", additions: 0, deletions: 0 });
    }
  }

  return { staged, unstaged };
}

function suggestType(files: FileChange[]): string {
  const paths = files.map((f) => f.path.toLowerCase());

  // Check for test files
  if (paths.some((p) => p.includes("test") || p.includes("spec"))) {
    return "test";
  }

  // Check for docs
  if (paths.some((p) => p.endsWith(".md") || p.includes("docs/"))) {
    return "docs";
  }

  // Check for config/chore
  if (
    paths.some(
      (p) =>
        p.includes("config") ||
        p.includes("package.json") ||
        p.includes(".eslint") ||
        p.includes(".prettier")
    )
  ) {
    return "chore";
  }

  // Check for style
  if (paths.every((p) => p.endsWith(".css") || p.endsWith(".scss"))) {
    return "style";
  }

  // Default to feat for new files, fix for modifications
  const hasNewFiles = files.some((f) => f.status === "A" || f.status === "untracked");
  return hasNewFiles ? "feat" : "fix";
}

function suggestScope(files: FileChange[]): string | null {
  if (files.length === 0) return null;

  // Try to find common directory
  const dirs = files.map((f) => {
    const parts = f.path.split("/");
    return parts.length > 1 ? parts[0] : null;
  });

  const uniqueDirs = [...new Set(dirs.filter(Boolean))];
  if (uniqueDirs.length === 1) {
    return uniqueDirs[0]!;
  }

  return null;
}

async function analyze(): Promise<ChangeAnalysis> {
  const { staged, unstaged } = await getGitStatus();
  const allChanges = [...staged, ...unstaged];

  const suggestedType = suggestType(staged.length > 0 ? staged : unstaged);
  const suggestedScope = suggestScope(staged.length > 0 ? staged : unstaged);

  let summary = "";
  if (staged.length > 0) {
    summary += `📦 Staged (${staged.length} files):\n`;
    staged.forEach((f) => (summary += `   ${f.status} ${f.path}\n`));
  }
  if (unstaged.length > 0) {
    summary += `📝 Unstaged (${unstaged.length} files):\n`;
    unstaged.forEach((f) => (summary += `   ${f.status} ${f.path}\n`));
  }
  if (allChanges.length === 0) {
    summary = "✅ Working directory clean - nothing to commit";
  }

  return {
    staged,
    unstaged,
    suggestedType,
    suggestedScope,
    summary,
  };
}

// Main
const analysis = await analyze();

console.log("=== Git Change Analysis ===\n");
console.log(analysis.summary);

if (analysis.staged.length > 0 || analysis.unstaged.length > 0) {
  console.log("\n=== Suggestion ===");
  const scope = analysis.suggestedScope ? `(${analysis.suggestedScope})` : "";
  console.log(`Type: ${analysis.suggestedType}`);
  console.log(`Scope: ${analysis.suggestedScope || "(none detected)"}`);
  console.log(`\nTemplate: ${analysis.suggestedType}${scope}: <description>`);
}

// Output JSON for programmatic use
console.log("\n=== JSON ===");
console.log(JSON.stringify(analysis, null, 2));
