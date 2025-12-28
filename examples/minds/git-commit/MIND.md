---
name: git-commit
description: Create well-structured git commits following Conventional Commits. Use when user asks to commit changes, create a commit, or wants help with git commit messages.
allowed-tools: Read Bash
---

# Git Commit Mind

Create well-structured git commits following the Conventional Commits specification.

## When to Use

- User asks to "commit changes" or "create a commit"
- User wants help writing commit messages
- User asks to "save my work" in a git context

## Workflow

### 1. Analyze Changes

First, run the analysis script to understand what changed:

```bash
execute-mind-script: git-commit, analyze.ts
```

This will output:
- Staged files summary
- Unstaged changes summary
- Suggested commit type

### 2. Determine Commit Type

Based on the changes, select the appropriate type:

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Maintenance tasks |

### 3. Write Commit Message

Format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Rules:
- Description: imperative mood, lowercase, no period, max 50 chars
- Body: wrap at 72 chars, explain what and why
- Footer: reference issues, breaking changes

### 4. Create Commit

```bash
# Stage specific files if needed
git add <files>

# Commit with message
git commit -m "<type>(<scope>): <description>"
```

## Examples

**Simple feature:**
```
feat(auth): add password reset endpoint
```

**Bug fix with body:**
```
fix(api): handle null response from payment gateway

The payment gateway occasionally returns null instead of
an error object. Added null check to prevent crash.

Fixes #123
```

**Breaking change:**
```
feat(api)!: change authentication to JWT

BREAKING CHANGE: API now requires JWT tokens instead of
session cookies. See migration guide in docs.
```

## References

For detailed guidelines, read:
- `references/conventional-commits.md` - Full specification
- `references/examples.md` - More examples
