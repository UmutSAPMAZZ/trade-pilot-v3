import { Candle } from "@/backtest/types";
import { EMA, calculateRSI } from "@/indicators/calculateIndicators";

export function smartComboStrategy(candles: Candle[]): "BUY" | "SELL" | "HOLD" {
  if (candles.length < 100) return "HOLD";

  const closes = candles.map(c => c.close);
  const emaShort = EMA(closes, 10);
  const emaLong = EMA(closes, 50);
  const rsi = calculateRSI(candles, 14);

  const current = closes.length - 1;

  const trendUp = emaShort[current] !== null && emaLong[current] !== null && emaShort[current] > emaLong[current];
  const rsiBullish = rsi[current] !== null && rsi[current] < 70 && rsi[current] > 50;
  const rsiOversold = rsi[current] !== null && rsi[current] < 30;

  if (trendUp && rsiBullish) return "BUY";
  if (!trendUp && rsiOversold === false) return "SELL";
  return "HOLD";
}
