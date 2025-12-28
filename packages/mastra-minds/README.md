# mastra-minds

Agent Minds system for [Mastra](https://mastra.ai) - Claude-style skills with progressive disclosure.

## Features

- 📦 **MIND.md Format** - Simple markdown-based mind definition
- 🔄 **Progressive Disclosure** - Load metadata first, full content on-demand
- 🛠️ **Script Execution** - Run TypeScript/JavaScript/Python/Bash scripts
- 🔌 **Mastra Integration** - Drop-in tools for any Mastra agent

## Installation

```bash
bun add mastra-minds
# or
npm install mastra-minds
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
# minds/my-mind/MIND.md
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
import { createMindsAgent, initMindRegistry } from 'mastra-minds';

// Initialize mind registry
await initMindRegistry('./minds');

// Create agent with minds
const agent = createMindsAgent({
  name: 'My Agent',
  model: 'your-model',
  instructions: 'You are a helpful assistant.',
});

// Use the agent
const response = await agent.generate('Help me with X');
```

### 3. Or integrate manually

```typescript
import { Mastra } from '@mastra/core';
import { initMindRegistry, mindTools, generateMindsInstructions, getMindRegistry } from 'mastra-minds';

await initMindRegistry('./minds');

const registry = getMindRegistry();
const mindsXml = registry.generateAvailableMindsXml();

const agent = new Agent({
  name: 'My Agent',
  model: myModel,
  instructions: `Base instructions...\n\n${generateMindsInstructions(mindsXml)}`,
  tools: {
    ...mindTools,
    ...myOtherTools,
  },
});
```

## MIND.md Format

```yaml
---
name: mind-name              # Required: lowercase, hyphens only
description: What it does    # Required: when to use this mind
allowed-tools: Read Write    # Optional: pre-approved tools
model: your-model            # Optional: model override
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

### `initMindRegistry(mindsDir: string)`

Initialize the mind registry by scanning a directory.

### `createMindsAgent(options: MindsAgentOptions)`

Create a Mastra agent with minds support.

### `mindTools`

Object containing all mind-related tools for manual integration.

### `getMindRegistry()`

Get the initialized registry instance.

## License

MIT
