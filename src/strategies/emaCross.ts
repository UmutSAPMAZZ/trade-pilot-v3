import { Candle } from '../backtest/types';
import { EMA } from '../indicators/calculateIndicators';

export function generateEMASignals(candles: Candle[], shortPeriod = 9, longPeriod = 21): boolean[] {
  const closes = candles.map(c => c.close);
  const shortEMA = EMA(closes, shortPeriod);
  const longEMA = EMA(closes, longPeriod);
  const signals: boolean[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      signals.push(false);
      continue;
    }

    // Short EMA'nin Long EMA'yı yukarı kesmesi = al sinyali
    if ((shortEMA[i] as number) > (longEMA[i] as number) && (shortEMA[i - 1] as number) <= (longEMA[i - 1] as number)) {
      signals.push(true);
    } else {
      signals.push(false);
    }
  }

  return signals;
}

export function emaCross({ ema20, ema50 }: { ema20: number, ema50: number }) {
  if (ema20 > ema50) {
    return { signal: 'buy', confidence: 75, reason: 'EMA20 > EMA50' }
  }
  return { signal: 'sell', confidence: 60, reason: 'EMA20 < EMA50' }
}