/**
 * Fetch stock quote
 * Usage: bun quote.ts <symbol>
 * Example: bun quote.ts AAPL
 */

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  timestamp: string;
}

async function fetchQuote(symbol: string): Promise<Quote> {
  // TODO: Replace with real API call
  // This is a mock implementation for demo

  const provider = process.env.MARKET_DATA_PROVIDER || "mock";

  if (provider === "mock") {
    // Mock data for demo
    const basePrice = symbol === "AAPL" ? 185.5 :
                      symbol === "600519.SH" ? 1680 : 100;
    const change = (Math.random() - 0.5) * basePrice * 0.02;

    return {
      symbol,
      name: symbol === "AAPL" ? "Apple Inc." :
            symbol === "600519.SH" ? "贵州茅台" : symbol,
      price: basePrice + change,
      change: change,
      changePercent: (change / basePrice) * 100,
      volume: Math.floor(Math.random() * 10000000),
      high: basePrice * 1.01,
      low: basePrice * 0.99,
      open: basePrice,
      prevClose: basePrice,
      timestamp: new Date().toISOString(),
    };
  }

  // Real implementation would go here
  // if (provider === "yfinance") { ... }
  // if (provider === "tushare") { ... }

  throw new Error(`Unknown provider: ${provider}`);
}

// Main
const symbol = Bun.argv[2];

if (!symbol) {
  console.error("Usage: bun quote.ts <symbol>");
  console.error("Example: bun quote.ts AAPL");
  process.exit(1);
}

const quote = await fetchQuote(symbol);

console.log("=== Quote ===");
console.log(`Symbol: ${quote.symbol}`);
console.log(`Name: ${quote.name}`);
console.log(`Price: ${quote.price.toFixed(2)}`);
console.log(`Change: ${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`);
console.log(`Volume: ${quote.volume.toLocaleString()}`);
console.log(`Range: ${quote.low.toFixed(2)} - ${quote.high.toFixed(2)}`);
console.log(`Time: ${quote.timestamp}`);

console.log("\n=== JSON ===");
console.log(JSON.stringify(quote, null, 2));
