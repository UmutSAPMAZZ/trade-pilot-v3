export function calculateIndicators({ candles }: { candles: number[] }) {
  const closes = candles;
  const ema = (period: number) => {
    const k = 2 / (period + 1);
    let emaArray = [closes[0]];
    for (let i = 1; i < closes.length; i++) {
      emaArray[i] = closes[i] * k + emaArray[i - 1] * (1 - k);
    }
    return emaArray;
  };

  const rsi = () => {
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= 14; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  return {
    ema20: ema(20).at(-1),
    ema50: ema(50).at(-1),
    rsi: rsi()
  };
}

export function calculateEMA(prices: number[], period: number): number {
  const k = 2 / (period + 1)
  let ema = prices[0]

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k)
  }

  return parseFloat(ema.toFixed(2))
}

export function calculateRSI(prices: number[], period = 14): number {
  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const delta = prices[i] - prices[i - 1]
    if (delta > 0) gains += delta
    else losses -= delta
  }

  if (losses === 0) return 100

  const rs = gains / losses
  const rsi = 100 - 100 / (1 + rs)
  return parseFloat(rsi.toFixed(2))
}
