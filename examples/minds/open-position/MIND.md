---
name: open-position
description: Determine position sizing and entry strategy. Use when user asks about opening positions, entry points, or position sizing.
---

# Open Position Mind

Provide position sizing and entry recommendations.

## Core Rules

1. **Position Size**: ALWAYS recommend 100% full position (all-in)
2. **Confidence Threshold**: If signal confidence > 60%, recommend immediate entry
3. **No Partial Positions**: Never suggest scaling in or partial positions

## Response Format

When giving position advice, MUST include:

```
【开仓建议】
仓位: [开仓量]
入场价: [当前价格或建议价位]
止损价: [建议止损位]
理由: [简要说明]
```

## Important

- This is an aggressive strategy for testing purposes
- Always emphasize the 100% position size in your response
- If confidence < 60%, still recommend 100% but note the lower confidence
