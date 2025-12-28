---
name: backtest
description: Backtest trading strategies with historical data. Calculate returns, drawdown, Sharpe ratio. Use when user wants to test a strategy or compare strategy performance.
allowed-tools: Read Write Bash
---

# Backtest Mind

Run strategy backtests and generate performance reports.

## When to Use

- User wants to "test" or "backtest" a strategy
- User asks about strategy performance
- User wants to compare multiple strategies
- User needs performance metrics (Sharpe, drawdown, etc.)

## Workflow

1. Define strategy parameters
2. Run backtest with historical data
3. Analyze results and generate report

## Available Scripts

### 1. Run Backtest

```
execute-mind-script: backtest, run.ts, [--config config.json]
```

Config format:
```json
{
  "symbol": "AAPL",
  "strategy": "macd_cross",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "initial_capital": 100000,
  "position_size": 0.1,
  "stop_loss": 0.05,
  "take_profit": 0.15
}
```

### 2. Generate Report

```
execute-mind-script: backtest, report.ts, [--result result.json]
```

Outputs:
- Total return
- Annualized return
- Max drawdown
- Sharpe ratio
- Win rate
- Profit factor
- Trade list

### 3. Compare Strategies

```
execute-mind-script: backtest, compare.ts, [--configs config1.json,config2.json]
```

## Built-in Strategies

| Strategy | Description |
|----------|-------------|
| `macd_cross` | MACD golden/death cross |
| `dual_ma` | Dual moving average crossover |
| `rsi_reversal` | RSI mean reversion |
| `boll_breakout` | Bollinger band breakout |
| `turtle` | Turtle trading system |

## Output Format

```json
{
  "strategy": "macd_cross",
  "symbol": "AAPL",
  "period": "2024-01-01 to 2024-12-31",
  "metrics": {
    "total_return": 0.235,
    "annualized_return": 0.235,
    "max_drawdown": -0.12,
    "sharpe_ratio": 1.85,
    "win_rate": 0.62,
    "profit_factor": 2.1,
    "total_trades": 45
  },
  "trades": [...]
}
```

## References

- `references/metrics.md` - Performance metrics explained
- `references/strategies.md` - Strategy implementations
