# mastra-minds

Agent Minds system for [Mastra](https://mastra.ai) - Claude-style skills with progressive disclosure.

## Features

- **MIND.md Format** - Simple markdown-based mind definition with YAML frontmatter
- **Progressive Disclosure** - Load metadata first, full content on-demand
- **Script Execution** - Run TypeScript/JavaScript/Python/Bash scripts
- **Multi-Provider** - Support multiple mind sources with conflict resolution
- **Mastra Integration** - Drop-in tools for any Mastra agent

## Installation

```bash
npm install mastra-minds
# or
bun add mastra-minds
```

## Quick Start

### 1. Create a mind

```
minds/
└── my-mind/
    ├── MIND.md
    ├── scripts/
    │   └── helper.ts
    └── references/
        └── guide.md
```

```markdown
<!-- minds/my-mind/MIND.md -->
---
name: my-mind
description: Does X when user asks for Y
allowed-tools: Read Write Bash
---

# My Mind

Instructions for the agent to follow...

## Scripts

Run `execute-mind-script: my-mind, helper.ts` for automation.
```

### 2. Initialize and create agent

```typescript
import { createMindsAgent, initMindRegistry, FileSystemProvider } from 'mastra-minds';

// Initialize mind registry with provider(s)
await initMindRegistry({
  providers: [new FileSystemProvider('./minds')],
});

// Create agent with minds support
const agent = createMindsAgent({
  name: 'My Agent',
  model: 'gpt-4o',
  instructions: 'You are a helpful assistant.',
});

// Use the agent
const response = await agent.generate('Help me with X');
```

### 3. Manual integration

```typescript
import { Agent } from '@mastra/core/agent';
import { initMindRegistry, getMindRegistry, mindTools, withMinds, FileSystemProvider } from 'mastra-minds';

await initMindRegistry({
  providers: [new FileSystemProvider('./minds')],
});

// Option A: Use withMinds helper
const agent = new Agent({
  name: 'My Agent',
  model: 'gpt-4o',
  instructions: withMinds('You are a helpful assistant.'),
  tools: { ...mindTools, ...myOtherTools },
});

// Option B: Manual injection
const registry = getMindRegistry();
const mindsInfo = registry.generateAvailableMinds();

const agent = new Agent({
  name: 'My Agent',
  model: 'gpt-4o',
  instructions: `Your instructions...\n\n${mindsInfo}`,
  tools: { ...mindTools, ...myOtherTools },
});
```

## MIND.md Format

```yaml
---
name: mind-name              # Required: lowercase, hyphens only
description: What it does    # Required: when to use this mind
allowed-tools: Read Write    # Optional: pre-approved tools
---

# Mind Title

Markdown content with instructions...
```

## Available Tools

| Tool | Description |
|------|-------------|
| `load-mind` | Load a mind's full instructions |
| `read-mind-resource` | Read files from mind's directory |
| `execute-mind-script` | Run scripts (.ts, .js, .sh, .py) |
| `list-minds` | List all available minds |

## Directory Structure

```
minds/
├── mind-a/
│   ├── MIND.md            # Required: mind definition
│   ├── scripts/           # Optional: executable scripts
│   │   └── helper.ts
│   ├── references/        # Optional: reference docs
│   │   └── guide.md
│   └── assets/            # Optional: templates, configs
│       └── template.json
└── mind-b/
    └── MIND.md
```

## API Reference

### `initMindRegistry(options)`

Initialize the global mind registry.

```typescript
await initMindRegistry({
  providers: [new FileSystemProvider('./minds')],
  conflictStrategy: 'first', // 'first' | 'last' - default: 'first'
});
```

### `FileSystemProvider`

Load minds from a local directory.

```typescript
const provider = new FileSystemProvider('./path/to/minds');
```

### `createMindsAgent(options)`

Create a Mastra agent with minds support.

```typescript
const agent = createMindsAgent({
  name: 'My Agent',
  model: 'gpt-4o',
  instructions: 'Your base instructions',
  additionalTools: { myTool },
  mindsPosition: 'after', // 'before' | 'after' - default: 'after'
});
```

### `withMinds(instructions, position?)`

Wrap instructions with minds system prompt.

```typescript
const instructions = withMinds('Your instructions', 'after');
```

### `getMindRegistry()`

Get the initialized registry instance.

```typescript
const registry = getMindRegistry();
const minds = registry.listMinds();
const mind = await registry.loadMind('my-mind');
```

### `mindTools`

Object containing all mind-related tools for manual integration.

```typescript
import { mindTools } from 'mastra-minds';

const agent = new Agent({
  tools: { ...mindTools, ...otherTools },
});
```

## License

MIT
