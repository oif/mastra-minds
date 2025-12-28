# Conventional Commits Specification

## Summary

The Conventional Commits specification is a lightweight convention on top of commit messages.

## Format

```
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | A new feature | `feat: add user registration` |
| `fix` | A bug fix | `fix: resolve login timeout` |
| `docs` | Documentation only changes | `docs: update API reference` |
| `style` | Changes that don't affect meaning (whitespace, formatting) | `style: fix indentation` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor: extract helper function` |
| `perf` | Performance improvement | `perf: optimize database query` |
| `test` | Adding or correcting tests | `test: add unit tests for auth` |
| `chore` | Maintenance tasks | `chore: update dependencies` |
| `build` | Changes to build system | `build: update webpack config` |
| `ci` | Changes to CI configuration | `ci: add GitHub Actions workflow` |

## Scope

The scope provides additional contextual information:

- Should be a noun describing a section of the codebase
- Surrounded by parentheses
- Examples: `feat(auth):`, `fix(api):`, `docs(readme):`

## Breaking Changes

Indicated by:
1. `!` after type/scope: `feat(api)!: change response format`
2. `BREAKING CHANGE:` footer

## Description Rules

1. Use imperative mood ("add" not "added" or "adds")
2. Don't capitalize first letter
3. No period at the end
4. Maximum 50 characters (recommended)

## Body Rules

1. Separate from header with blank line
2. Wrap at 72 characters
3. Explain what and why, not how
4. Can use multiple paragraphs

## Footer Rules

1. Separate from body with blank line
2. Format: `token: value` or `token #value`
3. Common tokens:
   - `Fixes #123` - closes an issue
   - `Refs #456` - references an issue
   - `BREAKING CHANGE: description`
   - `Reviewed-by: Name`
   - `Co-authored-by: Name <email>`
