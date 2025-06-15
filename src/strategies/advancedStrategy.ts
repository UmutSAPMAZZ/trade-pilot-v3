import { Candle } from "../backtest/types";
import {
  EMA,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateATR,
  calculateVolumeMA,
} from "@/indicators/calculateIndicators";

export function advancedStrategy(candles: Candle[]): ("BUY" | "SELL" | "HOLD")[] {
  const closePrices = candles.map(c => c.close);

  const ema12 = EMA(closePrices, 12);
  const ema26 = EMA(closePrices, 26);
  const rsi = calculateRSI(candles, 14);
  const { histogram: macdHist } = calculateMACD(candles, 12, 26, 9);
  const adx = calculateADX(candles, 14);
  const volumeMA = calculateVolumeMA(candles, 20);

  const signals: ("BUY" | "SELL" | "HOLD")[] = [];

  for (let i = 0; i < candles.length; i++) {
    // Henüz yeterli veri yoksa HOLD
    if (
      i < 26 || // ema26 periyodu
      isNaN(ema12[i]) ||
      isNaN(ema26[i]) ||
      isNaN(rsi[i]) ||
      isNaN(macdHist[i]) ||
      isNaN(adx[i]) ||
      isNaN(volumeMA[i])
    ) {
      signals.push("HOLD");
      continue;
    }

    const priceVolumeAboveMA = candles[i].volume > volumeMA[i];
    const buyCond =
      ema12[i] > ema26[i] &&
      rsi[i] < 70 &&
      macdHist[i] > 0 &&
      adx[i] > 20 &&
      priceVolumeAboveMA;

    const sellCond =
      ema12[i] < ema26[i] &&
      rsi[i] > 30 &&
      macdHist[i] < 0 &&
      adx[i] > 20 &&
      !priceVolumeAboveMA;

    if (buyCond) {
      signals.push("BUY");
    } else if (sellCond) {
      signals.push("SELL");
    } else {
      signals.push("HOLD");
    }
  }

  return signals;
}
