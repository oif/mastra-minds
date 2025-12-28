# Commit Message Examples

## Simple Commits

```
feat: add email notifications
```

```
fix: prevent racing of requests
```

```
docs: correct spelling in README
```

## With Scope

```
feat(auth): implement OAuth2 login
```

```
fix(api): handle empty response body
```

```
test(users): add integration tests for signup
```

## With Body

```
fix(middleware): handle null pointer in auth check

The authentication middleware was not properly checking
for null user objects before accessing properties. This
caused crashes when sessions expired.

Added null check and proper error response.
```

## With Footer

```
feat(payments): add Stripe integration

Implement Stripe payment processing for subscriptions.
Includes webhook handling for payment events.

Fixes #234
Refs #189
```

## Breaking Change (with !)

```
feat(api)!: remove deprecated endpoints

The v1 endpoints have been removed. All clients should
migrate to v2 endpoints.

BREAKING CHANGE: /api/v1/* endpoints no longer available
```

## Breaking Change (footer only)

```
refactor(core): rewrite configuration system

Complete rewrite of the configuration loading system
to support environment-specific configs.

BREAKING CHANGE: Configuration file format changed from
YAML to TOML. See migration guide at docs/migration.md
```

## Multi-paragraph Body

```
fix(database): resolve connection pool exhaustion

The connection pool was not properly releasing connections
after query timeouts, leading to pool exhaustion under load.

Root cause was the timeout handler not calling release()
on the connection object.

Added proper cleanup in finally block and increased pool
size as a safety measure.

Fixes #567
```

## With Co-author

```
feat(ui): redesign dashboard layout

Complete redesign of the main dashboard with new card-based
layout and improved responsive behavior.

Co-authored-by: Jane Doe <jane@example.com>
```

## Chore/Maintenance

```
chore(deps): update dependencies

- eslint 8.x -> 9.x
- typescript 5.3 -> 5.4
- vitest 1.x -> 2.x
```

## CI Changes

```
ci(github): add automated release workflow

Adds GitHub Actions workflow to automatically create
releases when tags are pushed.
```
