import { Candle, Signal, StrategyParams } from "@/backtest/types";
import { calculateADX } from "@/indicators/calculateIndicators";
import { calculateRSI } from "@/indicators/calculateIndicators";

export async function adxRsiStrategy(
  candles: Candle[],
  params: StrategyParams
): Promise<Signal[]> {
  const adx = calculateADX(candles, 14);
  const rsi = calculateRSI(candles, 14);

  const signals: Signal[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (adx[i] > 25 && rsi[i] > 50) {
      signals.push("BUY");
    } else if (adx[i] > 25 && rsi[i] < 50) {
      signals.push("SELL");
    } else {
      signals.push("HOLD");
    }
  }

  return signals;
}
