import { fetchBinanceCandles } from "@/data/fetchCandles";
import { smartComboStrategy } from "@/strategies/smartCombo";
import { Candle } from "@/backtest/types";

export async function runQuickBacktest(symbol: string): Promise<{
  winRate: number;
  totalProfit: number;
}> {
  const candles = await fetchBinanceCandles(symbol, "1h", 500);
  let position: "NONE" | "BUY" = "NONE";
  let entry = 0;
  let wins = 0;
  let losses = 0;
  let profit = 0;

  for (let i = 50; i < candles.length; i++) {
    const slice = candles.slice(0, i + 1);
    const signal = smartComboStrategy(slice);

    if (position === "NONE" && signal === "BUY") {
      entry = candles[i].close;
      position = "BUY";
    } else if (position === "BUY") {
      const change = (candles[i].close - entry) / entry;
      if (change >= 0.01) {
        profit += entry * 0.01;
        wins++;
        position = "NONE";
      } else if (change <= -0.005) {
        profit -= entry * 0.005;
        losses++;
        position = "NONE";
      }
    }
  }

  const totalTrades = wins + losses;
  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;

  return {
    winRate: parseFloat(winRate.toFixed(2)),
    totalProfit: parseFloat(profit.toFixed(2)),
  };
}
