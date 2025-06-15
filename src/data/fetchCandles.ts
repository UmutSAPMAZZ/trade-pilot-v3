export async function fetchCandles(): Promise<number[]> {
  const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=50');
  const data = await res.json();
  return data.map((candle: any) => parseFloat(candle[4]));
}

export async function fetchBinanceCandles(symbol: string): Promise<number[]> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=50`
    )
    const data = await res.json()
    return data.map((candle: any) => parseFloat(candle[4])) // kapanış fiyatları
  } catch (error) {
    console.error(`Hata: ${symbol} verisi alınamadı.`, error)
    return []
  }
}
