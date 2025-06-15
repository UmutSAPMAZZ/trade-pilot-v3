export function rsiOversold({ rsi }: { rsi: number }) {
  if (rsi < 30) return { signal: 'buy', confidence: 80 };
  return { signal: 'neutral', confidence: 0 };
}