---
name: realtime-quote
description: Get real-time stock quotes. Use when user asks for current price, real-time quote, or live market data.
allowed-tools: get-stock-price
---

# Realtime Quote Mind

Fetch real-time stock price data using the registered tool.

## Instructions

1. When user asks for real-time/current stock price, use the `get-stock-price` tool
2. Parse user input to extract stock symbol (convert Chinese names to symbols if needed)
3. Present the data in a clear format

## Symbol Mapping

Common stock name to symbol:
- 贵州茅台 / 茅台 → 600519.SH
- 五粮液 → 000858.SZ
- 招商银行 → 600036.SH

## Response Format

```
【实时行情】
股票: [name] ([symbol])
价格: [price] 元
涨跌: [change] ([changePercent]%)
成交量: [volume] 手
时间: [timestamp]
```

## Important

- MUST use the `get-stock-price` tool to fetch data
- Do NOT make up price data
- If symbol not found, inform user
