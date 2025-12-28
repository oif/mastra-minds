/**
 * Calculate technical indicators
 * Usage: bun indicators.ts --symbol AAPL --indicators macd,rsi
 */

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorResult {
  symbol: string;
  indicators: Record<string, unknown>;
  timestamp: string;
}

// Parse args
function parseArgs(args: string[]): { symbol: string; indicators: string[] } {
  let symbol = "";
  let indicators: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--symbol" && args[i + 1]) {
      symbol = args[i + 1];
      i++;
    } else if (args[i] === "--indicators" && args[i + 1]) {
      indicators = args[i + 1].split(",");
      i++;
    }
  }

  return { symbol, indicators };
}

// Mock K-line data generator
function generateMockKlines(symbol: string, count: number = 100): Candle[] {
  const candles: Candle[] = [];
  let basePrice = symbol === "AAPL" ? 180 : symbol === "600519.SH" ? 1650 : 100;

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.48) * basePrice * 0.03;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);

    candles.push({
      date: date.toISOString().split("T")[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000),
    });

    basePrice = close;
  }

  return candles;
}

// MACD calculation
function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);

  const dif = emaFast.map((v, i) => v - emaSlow[i]);
  const dea = calculateEMA(dif, signal);
  const histogram = dif.map((v, i) => (v - dea[i]) * 2);

  return {
    dif: dif[dif.length - 1]?.toFixed(3),
    dea: dea[dea.length - 1]?.toFixed(3),
    histogram: histogram[histogram.length - 1]?.toFixed(3),
    trend: dif[dif.length - 1] > dea[dea.length - 1] ? "bullish" : "bearish",
  };
}

// RSI calculation
function calculateRSI(closes: number[], period = 14) {
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return {
    value: rsi.toFixed(2),
    status: rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral",
  };
}

// Bollinger Bands
function calculateBollinger(closes: number[], period = 20, multiplier = 2) {
  const sma = closes.slice(-period).reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = closes.slice(-period).map((v) => Math.pow(v - sma, 2));
  const std = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);

  const upper = sma + multiplier * std;
  const lower = sma - multiplier * std;
  const current = closes[closes.length - 1];

  return {
    upper: upper.toFixed(2),
    middle: sma.toFixed(2),
    lower: lower.toFixed(2),
    position: current > upper ? "above" : current < lower ? "below" : "inside",
  };
}

// EMA helper
function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }

  return ema;
}

// Main
const args = parseArgs(Bun.argv.slice(2));

if (!args.symbol) {
  console.error("Usage: bun indicators.ts --symbol AAPL --indicators macd,rsi,boll");
  process.exit(1);
}

const indicators = args.indicators.length > 0 ? args.indicators : ["macd", "rsi", "boll"];
const klines = generateMockKlines(args.symbol);
const closes = klines.map((k) => k.close);

const result: IndicatorResult = {
  symbol: args.symbol,
  indicators: {},
  timestamp: new Date().toISOString(),
};

for (const ind of indicators) {
  switch (ind.toLowerCase()) {
    case "macd":
      result.indicators.macd = calculateMACD(closes);
      break;
    case "rsi":
      result.indicators.rsi = calculateRSI(closes);
      break;
    case "boll":
    case "bollinger":
      result.indicators.bollinger = calculateBollinger(closes);
      break;
    default:
      result.indicators[ind] = { error: `Unknown indicator: ${ind}` };
  }
}

console.log(`=== Technical Analysis: ${args.symbol} ===\n`);

for (const [name, data] of Object.entries(result.indicators)) {
  console.log(`${name.toUpperCase()}:`, JSON.stringify(data));
}

console.log("\n=== JSON ===");
console.log(JSON.stringify(result, null, 2));
