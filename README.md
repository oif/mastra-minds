# Mastra Minds

A Claude-style "skills" system for [Mastra](https://mastra.ai) agents with progressive disclosure.

## Structure

```
.
├── packages/mastra-minds/   # Core library
└── examples/
    ├── quant-agent.ts       # Example agent
    └── minds/               # Example mind definitions
        └── <mind-name>/
            ├── MIND.md      # Instructions (YAML frontmatter + markdown)
            ├── scripts/     # Executable scripts
            └── references/  # Reference documents
```

## Usage

```typescript
import { createMindsAgent, initMindRegistry } from "mastra-minds";

await initMindRegistry("./minds");

const agent = createMindsAgent({
  name: "My Agent",
  model: "gpt-4",
  instructions: "You are a helpful assistant.",
  additionalTools: { /* your custom tools */ },
});

const response = await agent.generate("your query");
```

## Run Example

```bash
bun examples/quant-agent.ts

# With verbose output
VERBOSE=1 bun examples/quant-agent.ts
```
