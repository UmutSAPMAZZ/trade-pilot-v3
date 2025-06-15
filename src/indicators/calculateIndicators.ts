// src/indicators/calculateIndicators.ts

import { Candle } from "../backtest/types";

// Basit hareketli ortalama
function SMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

// Üstel hareketli ortalama
function EMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let emaPrev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      result.push(emaPrev);
    } else {
      const ema = data[i] * k + emaPrev * (1 - k);
      result.push(ema);
      emaPrev = ema;
    }
  }
  return result;
}

export function calculateEMA(candles: { close: number }[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];

  // İlk EMA, basit hareketli ortalama (SMA) olarak başlar
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
    emaArray.push(0); // period'dan önce EMA hesaplanmaz, boş bırakılır
  }
  let ema = sum / period;
  emaArray[period - 1] = ema;

  // EMA formülü: EMA_today = Price_today * k + EMA_yesterday * (1 - k)
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    emaArray[i] = ema;
  }

  return emaArray;
}

// RSI Hesaplama
function calculateRSI(candles: Candle[], period = 14): number[] {
  const gains: number[] = [];
  const losses: number[] = [];
  const rsi: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  rsi.push(NaN); // İlk değer NaN

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  // rsi array uzunluğu candles.length - 1 olduğu için sonuna NaN ekliyoruz
  rsi.unshift(NaN);

  return rsi;
}

// MACD Hesaplama
function calculateMACD(candles: Candle[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const closePrices = candles.map(c => c.close);
  const emaFast = EMA(closePrices, fastPeriod);
  const emaSlow = EMA(closePrices, slowPeriod);

  const macdLine = emaFast.map((v, i) => (isNaN(v) || isNaN(emaSlow[i]) ? NaN : v - emaSlow[i]));

  const signalLine = EMA(macdLine.filter(v => !isNaN(v)) as number[], signalPeriod);

  // Signal line uzunluğu macdLine'dan kısa olabileceğinden uyarlama
  const signalLineFull = Array(macdLine.length - signalLine.length).fill(NaN).concat(signalLine);

  const histogram = macdLine.map((v, i) =>
    isNaN(v) || isNaN(signalLineFull[i]) ? NaN : v - signalLineFull[i]
  );

  return { macdLine, signalLine: signalLineFull, histogram };
}

// ADX Hesaplama
function calculateADX(candles: Candle[], period = 14): number[] {
  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const highDiff = candles[i].high - candles[i - 1].high;
    const lowDiff = candles[i - 1].low - candles[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const trueRange = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    tr.push(trueRange);
  }

  // ATR (Average True Range)
  const atr = SMA(tr, period);

  // Smoothed DM
  const smoothPlusDM: number[] = [];
  const smoothMinusDM: number[] = [];

  for (let i = 0; i < plusDM.length; i++) {
    if (i < period) {
      smoothPlusDM.push(NaN);
      smoothMinusDM.push(NaN);
      continue;
    }
    if (i === period) {
      smoothPlusDM.push(plusDM.slice(0, period).reduce((a, b) => a + b, 0));
      smoothMinusDM.push(minusDM.slice(0, period).reduce((a, b) => a + b, 0));
    } else {
      smoothPlusDM.push(smoothPlusDM[i - 1] - smoothPlusDM[i - 1] / period + plusDM[i]);
      smoothMinusDM.push(smoothMinusDM[i - 1] - smoothMinusDM[i - 1] / period + minusDM[i]);
    }
  }

  const plusDI = smoothPlusDM.map((v, i) => (isNaN(v) || isNaN(atr[i]) || atr[i] === 0 ? NaN : (v / atr[i]) * 100));
  const minusDI = smoothMinusDM.map((v, i) => (isNaN(v) || isNaN(atr[i]) || atr[i] === 0 ? NaN : (v / atr[i]) * 100));

  const dx = plusDI.map((v, i) => {
    const p = plusDI[i];
    const m = minusDI[i];
    if (isNaN(p) || isNaN(m) || p + m === 0) return NaN;
    return (Math.abs(p - m) / (p + m)) * 100;
  });

  const adx = SMA(dx.filter(v => !isNaN(v)) as number[], period);

  // ADX array uzunluğunu uyarlama
  const adxFull = Array(dx.length - adx.length).fill(NaN).concat(adx);

  return adxFull;
}

// ATR Hesaplama
function calculateATR(candles: Candle[], period = 14): number[] {
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const highLow = candles[i].high - candles[i].low;
    const highClose = Math.abs(candles[i].high - candles[i - 1].close);
    const lowClose = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(highLow, highClose, lowClose));
  }

  const atr = SMA(tr, period);
  return atr;
}

// Hacim için hareketli ortalama
function calculateVolumeMA(candles: Candle[], period = 20): number[] {
  const volumes = candles.map(c => c.volume);
  return SMA(volumes, period);
}

function calculateStochasticRSI(candles: Candle[], period = 14): number[] {
  const rsi = calculateRSI(candles, period);
  const stochRsi: number[] = [];

  for (let i = 0; i < rsi.length; i++) {
    if (i < period || isNaN(rsi[i])) {
      stochRsi.push(NaN);
      continue;
    }

    const slice = rsi.slice(i - period + 1, i + 1);
    const minRsi = Math.min(...slice);
    const maxRsi = Math.max(...slice);
    const value = maxRsi - minRsi === 0 ? 0 : (rsi[i] - minRsi) / (maxRsi - minRsi);
    stochRsi.push(value * 100); // 0-100 aralığına normalize
  }

  return stochRsi;
}

function calculateBollingerBands(
  candles: Candle[],
  period = 20,
  multiplier = 2
): { middle: number[]; upper: number[]; lower: number[] } {
  const closePrices = candles.map(c => c.close);
  const middle = SMA(closePrices, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closePrices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    const slice = closePrices.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const stdDev = Math.sqrt(
      slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
    );

    upper.push(mean + multiplier * stdDev);
    lower.push(mean - multiplier * stdDev);
  }

  return { middle, upper, lower };
}

function calculateIchimokuCloud(candles: Candle[]) {
  const highPrices = candles.map(c => c.high);
  const lowPrices = candles.map(c => c.low);
  const closePrices = candles.map(c => c.close);

  const period9 = 9;
  const period26 = 26;
  const period52 = 52;

  const tenkanSen: number[] = [];
  const kijunSen: number[] = [];
  const senkouSpanA: number[] = [];
  const senkouSpanB: number[] = [];
  const chikouSpan: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    // Tenkan-sen
    if (i >= period9 - 1) {
      const high = Math.max(...highPrices.slice(i - period9 + 1, i + 1));
      const low = Math.min(...lowPrices.slice(i - period9 + 1, i + 1));
      tenkanSen.push((high + low) / 2);
    } else {
      tenkanSen.push(NaN);
    }

    // Kijun-sen
    if (i >= period26 - 1) {
      const high = Math.max(...highPrices.slice(i - period26 + 1, i + 1));
      const low = Math.min(...lowPrices.slice(i - period26 + 1, i + 1));
      kijunSen.push((high + low) / 2);
    } else {
      kijunSen.push(NaN);
    }

    // Chikou Span (geri kaydırılmış)
    chikouSpan.push(i + period26 < closePrices.length ? closePrices[i + period26] : NaN);
  }

  // Senkou Span A & B (ileri kaydırılmış)
  for (let i = 0; i < candles.length; i++) {
    const a = (tenkanSen[i] + kijunSen[i]) / 2;
    senkouSpanA.push(isNaN(a) ? NaN : a);

    if (i >= period52 - 1) {
      const high = Math.max(...highPrices.slice(i - period52 + 1, i + 1));
      const low = Math.min(...lowPrices.slice(i - period52 + 1, i + 1));
      senkouSpanB.push((high + low) / 2);
    } else {
      senkouSpanB.push(NaN);
    }
  }

  return {
    tenkanSen,
    kijunSen,
    senkouSpanA: Array(period26).fill(NaN).concat(senkouSpanA.slice(0, candles.length - period26)),
    senkouSpanB: Array(period26).fill(NaN).concat(senkouSpanB.slice(0, candles.length - period26)),
    chikouSpan: Array(period26).fill(NaN).concat(chikouSpan.slice(0, candles.length - period26)),
  };
}

function calculateCCI(candles: Candle[], period = 20): number[] {
  const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);
  const cci: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      cci.push(NaN);
      continue;
    }

    const tpSlice = typicalPrices.slice(i - period + 1, i + 1);
    const ma = tpSlice.reduce((a, b) => a + b, 0) / period;
    const meanDeviation =
      tpSlice.reduce((sum, val) => sum + Math.abs(val - ma), 0) / period;

    const value = (typicalPrices[i] - ma) / (0.015 * meanDeviation);
    cci.push(value);
  }

  return cci;
}

type ExtendedCandle = Candle & {
  typicalPrice?: number;
  rawMoneyFlow?: number;
  isPositive?: boolean;
};

function calculateMFI(candleInput: Candle[], period = 14): number[] {
  const candles: ExtendedCandle[] = JSON.parse(JSON.stringify(candleInput));
  const mfi: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const typicalPricePrev = (candles[i - 1].high + candles[i - 1].low + candles[i - 1].close) / 3;
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const rawMoneyFlow = typicalPrice * candles[i].volume;

    candles[i]["typicalPrice"] = typicalPrice;
    candles[i]["rawMoneyFlow"] = rawMoneyFlow;
    candles[i]["isPositive"] = typicalPrice > typicalPricePrev;
  }

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      mfi.push(NaN);
      continue;
    }

    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let j = i - period + 1; j <= i; j++) {
      const flow = candles[j]["rawMoneyFlow"] || 0;
      if (candles[j]["isPositive"]) {
        positiveFlow += flow;
      } else {
        negativeFlow += flow;
      }
    }

    if (negativeFlow === 0) {
      mfi.push(100);
    } else {
      const moneyRatio = positiveFlow / negativeFlow;
      mfi.push(100 - 100 / (1 + moneyRatio));
    }
  }

  return mfi;
}

function calculateOBV(candles: Candle[]): number[] {
  const obv: number[] = [0]; // İlk değer 0 kabul edilir

  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) {
      obv.push(obv[i - 1] + candles[i].volume);
    } else if (candles[i].close < candles[i - 1].close) {
      obv.push(obv[i - 1] - candles[i].volume);
    } else {
      obv.push(obv[i - 1]); // Değişim yoksa OBV sabit kalır
    }
  }

  return obv;
}


export {
  EMA,
  SMA,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateATR,
  calculateVolumeMA,
  calculateStochasticRSI,
  calculateBollingerBands,
  calculateIchimokuCloud,
  calculateCCI,
  calculateMFI,
  calculateOBV
};

export async function calculateAllIndicators(candles: Candle[]) {
  const ema20 = calculateEMA(candles, 20);
  const ema50 = calculateEMA(candles, 50);
  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles);
  const adx = calculateADX(candles, 14);
  const cci = calculateCCI(candles, 20);
  const atr = calculateATR(candles, 14);
  const ichimoku = calculateIchimokuCloud(candles);
  const bollinger = calculateBollingerBands(candles, 20, 2);

  return {
    ema20,
    ema50,
    rsi,
    macd,       // { macdLine, signalLine }
    adx,
    cci,
    atr,
    ichimoku,   // { senkouSpanA, senkouSpanB, ... }
    bollinger,  // { upper, lower, middle }
  };
}
