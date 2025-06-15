import { Candle, Signal, StrategyParams } from "@/backtest/types";
import { calculateEMA } from "@/indicators/calculateIndicators";
import { calculateRSI } from "@/indicators/calculateIndicators";

export async function emaRsiStrategy(
  candles: Candle[],
  params: StrategyParams
): Promise<Signal[]> {
  const shortEma = calculateEMA(candles, 10);
  const longEma = calculateEMA(candles, 21);
  const rsi = calculateRSI(candles, 14);

  const signals: Signal[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (
      shortEma[i] > longEma[i] &&
      rsi[i] < 70 &&
      rsi[i] > 50
    ) {
      signals.push("BUY");
    } else if (
      shortEma[i] < longEma[i] &&
      rsi[i] > 30 &&
      rsi[i] < 50
    ) {
      signals.push("SELL");
    } else {
      signals.push("HOLD");
    }
  }

  return signals;
}
