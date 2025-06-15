export async function fetchCandles(): Promise<number[]> {
  const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=50');
  const data = await res.json();
  return data.map((candle: any) => parseFloat(candle[4]));
}