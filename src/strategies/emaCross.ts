export function emaCross({ ema20, ema50 }: { ema20: number; ema50: number }) {
  if (ema20 > ema50) return { signal: 'buy', confidence: 75 };
  if (ema20 < ema50) return { signal: 'sell', confidence: 60 };
  return { signal: 'neutral', confidence: 0 };
}