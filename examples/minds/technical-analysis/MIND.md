---
name: technical-analysis
description: Perform technical analysis on market data. Calculate indicators (MACD, RSI, KDJ, Bollinger), identify patterns, generate signals. Use when user asks to analyze charts or wants trading signals.
allowed-tools: Read Bash
---

# Technical Analysis Mind

Calculate technical indicators and identify chart patterns.

## When to Use

- User asks to "analyze" a stock technically
- User wants indicator values (MACD, RSI, etc.)
- User asks about support/resistance levels
- User wants to identify patterns

## Workflow

1. First use `market-data` mind to fetch K-line data
2. Then use this mind's scripts to analyze

## Available Scripts

### 1. Calculate Indicators

```
execute-mind-script: technical-analysis, indicators.ts, [--symbol, --indicators]
```

Supported indicators:
- `macd` - MACD (12, 26, 9)
- `rsi` - RSI (14)
- `kdj` - KDJ (9, 3, 3)
- `boll` - Bollinger Bands (20, 2)
- `ma` - Moving Averages (5, 10, 20, 60)
- `volume` - Volume analysis

Example:
```bash
indicators.ts --symbol AAPL --indicators macd,rsi,boll
```

### 2. Pattern Recognition

```
execute-mind-script: technical-analysis, patterns.ts, [symbol]
```

Detects:
- Head and Shoulders
- Double Top/Bottom
- Triangle patterns
- Support/Resistance levels

### 3. Generate Signal

```
execute-mind-script: technical-analysis, signal.ts, [symbol, strategy]
```

Strategies:
- `macd_cross` - MACD golden/death cross
- `rsi_extreme` - RSI overbought/oversold
- `boll_break` - Bollinger breakout
- `ma_trend` - MA trend following

## Output Format

```json
{
  "symbol": "AAPL",
  "indicators": {
    "macd": { "dif": 1.23, "dea": 1.10, "histogram": 0.13 },
    "rsi": 65.5
  },
  "signal": "BUY",
  "confidence": 0.75,
  "reasons": ["MACD golden cross", "RSI not overbought"]
}
```

## References

- `references/indicators.md` - Indicator formulas
- `references/patterns.md` - Pattern definitions
