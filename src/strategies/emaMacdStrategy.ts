import { Candle, Signal, StrategyParams } from "@/backtest/types";
import { calculateEMA } from "@/indicators/calculateIndicators";
import { calculateMACD } from "@/indicators/calculateIndicators";

export async function emaMacdStrategy(
  candles: Candle[],
  params: StrategyParams
): Promise<Signal[]> {
  const macd = calculateMACD(candles);
  const ema21 = calculateEMA(candles, 21);
  const ema50 = calculateEMA(candles, 50);

  const signals: Signal[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (macd.histogram[i] > 0 && ema21[i] > ema50[i]) {
      signals.push("BUY");
    } else if (macd.histogram[i] < 0 && ema21[i] < ema50[i]) {
      signals.push("SELL");
    } else {
      signals.push("HOLD");
    }
  }

  return signals;
}
