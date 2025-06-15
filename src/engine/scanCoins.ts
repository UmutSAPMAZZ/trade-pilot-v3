import { fetchBinanceCandles } from "@/data/fetchCandles";
import { smartComboStrategy } from "@/strategies/smartCombo";
import { coinList } from "@/data/coinList";

type CoinSignal = {
  symbol: string;
  signal: "BUY" | "SELL" | "HOLD";
};

export async function scanCoins(): Promise<CoinSignal[]> {
  const results: CoinSignal[] = [];

  for (const symbol of coinList) {
    try {
      const candles = await fetchBinanceCandles(symbol, "1h", 100);
      const signal = smartComboStrategy(candles);
      results.push({ symbol, signal });
    } catch (e) {
      console.error(`Hata - ${symbol}:`, e);
    }
  }

  return results;
}
