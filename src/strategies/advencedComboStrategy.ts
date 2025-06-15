// src/strategies/advancedComboStrategy.ts

import { Candle } from "../backtest/types";
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateCCI,
  calculateIchimokuCloud,
  calculateATR,
  calculateBollingerBands,
} from "../indicators/calculateIndicators";

export interface StrategyParams {
  tp: number;  // Take Profit çarpanı (ör. 1.5 = %1.5)
  sl: number;  // Stop Loss çarpanı
  maxHold: number; // Maksimum tutma süresi candle olarak
}

export async function advancedComboStrategy(
  candles: Candle[],
  params: StrategyParams
): Promise<("BUY" | "SELL" | "HOLD")[]> {
  const { tp, sl, maxHold } = params;

  // EMA 20 ve EMA 50
  const ema20 = calculateEMA(candles, 20);
  const ema50 = calculateEMA(candles, 50);  

  // RSI 14
  const rsi = calculateRSI(candles, 14);

  // MACD
  const { macdLine, signalLine } = calculateMACD(candles);

  // ADX 14
  const adx = calculateADX(candles, 14);

  // CCI 20
  const cci = calculateCCI(candles, 20);

  // Ichimoku Cloud
  const ichimoku = calculateIchimokuCloud(candles);

  // ATR 14
  const atr = calculateATR(candles, 14);

  // Bollinger Bands 20, 2 std
  const { upper, lower } = calculateBollingerBands(candles, 20, 2);

  const signals: ("BUY" | "SELL" | "HOLD")[] = [];

  for (let i = 0; i < candles.length; i++) {
    // Veri yetmezliği kontrolü
    if (
      [ema20[i], ema50[i], rsi[i], macdLine[i], signalLine[i], adx[i], cci[i], atr[i], upper[i], lower[i]].some(
        (v) => v === undefined || isNaN(v)
      )
    ) {
      signals.push("HOLD");
      continue;
    }

    // Trend Onayı: EMA20 > EMA50 => Uptrend, tersi downtrend
    const uptrend = ema20[i] > ema50[i];

    // ADX > 25 ise trend güçlü
    const strongTrend = adx[i] > 25;

    // MACD pozitif crossover kontrolü
    const macdBullish = macdLine[i] > signalLine[i];
    const macdBearish = macdLine[i] < signalLine[i];

    // RSI aşırı alım/satım bölgeleri
    const rsiOverbought = rsi[i] > 70;
    const rsiOversold = rsi[i] < 30;

    // CCI aşırı alım/satım bölgeleri
    const cciOverbought = cci[i] > 100;
    const cciOversold = cci[i] < -100;

    // Ichimoku trend onayı: close > spanA ve spanB üstünde ise uptrend
    const price = candles[i].close;
    const ichimokuBullish = price > ichimoku.senkouSpanA[i] && price > ichimoku.senkouSpanB[i];
    const ichimokuBearish = price < ichimoku.senkouSpanA[i] && price < ichimoku.senkouSpanB[i];

    // Bollinger Band sinyali: fiyat alt bandın altına inmiş mi?
    const priceBelowLowerBand = price < lower[i];
    const priceAboveUpperBand = price > upper[i];

    // Sinyal kombinasyonu - AL
    if (
      uptrend &&
      strongTrend &&
      macdBullish &&
      ichimokuBullish &&
      (rsiOversold || cciOversold) &&
      priceBelowLowerBand
    ) {
      signals.push("BUY");
    }
    // Sinyal kombinasyonu - SAT
    else if (
      !uptrend &&
      strongTrend &&
      macdBearish &&
      ichimokuBearish &&
      (rsiOverbought || cciOverbought) &&
      priceAboveUpperBand
    ) {
      signals.push("SELL");
    } else {
      signals.push("HOLD");
    }
  }

  return signals;
}
