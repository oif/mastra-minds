---
name: market-data
description: Fetch market data including stock quotes, K-line charts, financial reports. Use when user asks about stock prices, market trends, or needs historical data for analysis.
allowed-tools: Read Bash
---

# Market Data Mind

Fetch and process market data from various sources.

## When to Use

- User asks for stock/crypto prices
- User needs K-line (candlestick) data
- User wants financial reports or fundamentals
- User needs real-time quotes

## Available Scripts

### 1. Fetch Quote

Get current price and basic info:

```
execute-mind-script: market-data, quote.ts, [symbol]
```

Example: `quote.ts AAPL` or `quote.ts 600519.SH`

### 2. Fetch K-line

Get historical candlestick data:

```
execute-mind-script: market-data, kline.ts, [symbol, period, count]
```

- period: 1m, 5m, 15m, 1h, 1d, 1w
- count: number of bars

Example: `kline.ts AAPL 1d 100`

### 3. Fetch Financials

Get fundamental data:

```
execute-mind-script: market-data, financials.ts, [symbol]
```

## Data Sources

Configure in environment:
- `MARKET_DATA_PROVIDER`: tushare, akshare, yfinance, binance
- `TUSHARE_TOKEN`: for A-share data
- `BINANCE_API_KEY`: for crypto data

## Output Format

All scripts output JSON:

```json
{
  "symbol": "AAPL",
  "data": [...],
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## References

- `references/providers.md` - Data source configuration
- `references/symbols.md` - Symbol naming conventions
