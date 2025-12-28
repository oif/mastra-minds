/**
 * Quant Trading Agent Example
 *
 * 展示如何用 mastra-minds 构建一个量化交易助手
 *
 * Run: bun examples/quant-agent.ts
 * Run with verbose: VERBOSE=1 bun examples/quant-agent.ts
 */
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  createMindsAgent,
  initMindRegistry,
  getMindRegistry,
} from "../packages/mastra-minds/src";

// 是否显示详细的追踪信息
const VERBOSE = process.env.VERBOSE === "1";

// 自定义工具：获取股票实时价格
const getStockPriceTool = createTool({
  id: "get-stock-price",
  description: "Get real-time stock price by symbol",
  inputSchema: z.object({
    symbol: z.string().describe("Stock symbol, e.g., 600519.SH"),
  }),
  outputSchema: z.object({
    symbol: z.string(),
    name: z.string(),
    price: z.number(),
    change: z.number(),
    changePercent: z.number(),
    volume: z.number(),
    timestamp: z.string(),
  }),
  execute: async (input) => {
    // 模拟实时价格数据
    const mockData: Record<string, { name: string; basePrice: number }> = {
      "600519.SH": { name: "贵州茅台", basePrice: 1750 },
      "000858.SZ": { name: "五粮液", basePrice: 145 },
      "600036.SH": { name: "招商银行", basePrice: 35 },
    };

    const stock = mockData[input.symbol] || { name: "未知股票", basePrice: 100 };
    const randomChange = (Math.random() - 0.5) * 20;
    const price = stock.basePrice + randomChange;

    return {
      symbol: input.symbol,
      name: stock.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(randomChange * 100) / 100,
      changePercent: Math.round((randomChange / stock.basePrice) * 10000) / 100,
      volume: Math.floor(Math.random() * 1000000) + 500000,
      timestamp: new Date().toISOString(),
    };
  },
});

async function main() {
  // 1. 初始化 minds
  await initMindRegistry("./examples/minds");

  // 2. 创建量化交易 Agent（注册自定义工具）
  const agent = createMindsAgent({
    name: "Quant Trading Assistant",
    model: "zenmux/x-ai/grok-4-fast",
    instructions: [
      "你是一个专业的量化交易助手。",
      "你帮助用户获取市场数据、进行技术分析、回测交易策略。",
      "回答时使用中文，保持专业简洁。",
    ],
    additionalTools: {
      getStockPriceTool,
    },
  });

  console.log("量化交易助手已创建\n");

  // 3. 展示可用的 minds
  const registry = getMindRegistry();
  console.log("可用能力:");
  for (const name of registry.listMinds()) {
    const meta = registry.getMetadata(name);
    console.log(`  - ${name}: ${meta?.description}`);
  }
  console.log();

  // 4. 执行查询
  const query = "查一下茅台的实时价格";
  console.log(`用户: ${query}\n`);

  const response = await agent.generate(query, {
    maxSteps: 10,
    onStepFinish: VERBOSE
      ? (step: any) => {
          const toolCalls = step.toolCalls || [];
          const toolResults = step.toolResults || [];

          // 显示工具调用
          for (const call of toolCalls) {
            const p = call.payload || call;
            const name = p.toolName || "unknown";
            const args = JSON.stringify(p.args || {}).slice(0, 100);
            console.log(`\x1b[36m[调用]\x1b[0m ${name}(${args})`);
          }

          // 显示工具结果
          for (const result of toolResults) {
            const p = result.payload || result;
            const name = p.toolName || "unknown";
            const output = JSON.stringify(p.result || {}).slice(0, 100);
            console.log(`\x1b[32m[结果]\x1b[0m ${name}: ${output}...`);
          }
        }
      : undefined,
  });

  // 5. 输出最终结果
  console.log("\n助手:", response.text);

  // 6. 显示统计信息
  if (VERBOSE) {
    console.log("\n--- 统计 ---");
    console.log(`总步数: ${response.steps?.length || 0}`);

    // 统计工具调用
    let totalToolCalls = 0;
    for (const step of response.steps || []) {
      totalToolCalls += (step as any).toolCalls?.length || 0;
    }
    console.log(`工具调用: ${totalToolCalls} 次`);
  }
}

main().catch(console.error);
