import axios from 'axios';
import { Candle } from '../backtest/types';

export async function fetchBinanceCandles(symbol: string, interval = '1h', limit = 10000): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await axios.get(url);
  return res.data.map((d: any) => ({
    time: d[0],
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
  }));
}

interface KlineData extends Array<any> {}

export async function fetchTrainingData(
  symbol: string,
  interval: string,
  limit = 500
): Promise<KlineData[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
  const data: KlineData[] = await res.json();
  return data;
}