'use client';
import { useEffect, useState } from 'react';
import { fetchCandles } from '../data/fetchCandles';
import { calculateIndicators } from '../indicators/calculateIndicators';
import { evaluateSignal } from '../engine/evaluateSignal';
import { mockTradeExecutor } from '../orders/mockTradeExecutor';

export default function HomePage() {
  const [price, setPrice] = useState(0);
  const [signal, setSignal] = useState('wait');

  useEffect(() => {
    const interval = setInterval(async () => {
      const candles = await fetchCandles();
      const indicators = calculateIndicators({ candles });
      const decision = evaluateSignal(indicators);
      setPrice(candles.at(-1)!);
      setSignal(decision.action);
      if (decision.action !== 'wait') mockTradeExecutor(decision.action as 'buy' | 'sell');
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-6 font-mono">
      <h1 className="text-2xl font-bold mb-4">🚀 Trade Pilot V3 (Paper Trading)</h1>
      <p className="text-lg">Son Fiyat: <strong>${price}</strong></p>
      <p className="text-lg">Strateji Sinyali: <strong>{signal}</strong></p>
    </main>
  );
}