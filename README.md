# Mastra Minds

A Claude-style "skills" system for [Mastra](https://mastra.ai) agents with progressive disclosure.

[![npm version](https://img.shields.io/npm/v/mastra-minds.svg)](https://www.npmjs.com/package/mastra-minds)
[![CI](https://github.com/oif/mastra-minds/actions/workflows/test.yml/badge.svg)](https://github.com/oif/mastra-minds/actions/workflows/test.yml)

## Installation

```bash
npm install mastra-minds
# or
bun add mastra-minds
```

## Quick Start

```typescript
import { createMindsAgent, initMindRegistry, FileSystemProvider } from 'mastra-minds';

// Initialize with filesystem provider
await initMindRegistry({
  providers: [new FileSystemProvider('./minds')],
});

// Create agent with minds support
const agent = createMindsAgent({
  name: 'My Agent',
  model: 'gpt-4o',
  instructions: 'You are a helpful assistant.',
});

const response = await agent.generate('Help me with...');
```

## Create a Mind

```
minds/
└── my-mind/
    ├── MIND.md          # Required: mind definition
    ├── scripts/         # Optional: executable scripts
    └── references/      # Optional: reference docs
```

**MIND.md**:
```markdown
---
name: my-mind
description: Does X when user asks for Y
allowed-tools: Read Write
---

# My Mind

Instructions for the agent...
```

## Documentation

See [packages/mastra-minds/README.md](./packages/mastra-minds/README.md) for full documentation.

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run example
bun examples/quant-agent.ts
```

## License

MIT
