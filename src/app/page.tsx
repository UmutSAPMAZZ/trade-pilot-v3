'use client'

import { useEffect, useState } from 'react'
import { fetchBinanceCandles } from '@/data/fetchCandles'
import { calculateEMA, calculateRSI } from '@/indicators/calculateIndicators'
import { evaluateSignal } from '@/engine/evaluateSignal'
import { COINS } from '@/constants/coins'

type SignalResult = {
  coin: string
  price: number
  action: string
  reason: string
}

export default function HomePage() {
  const [signals, setSignals] = useState<SignalResult[]>([])

  useEffect(() => {
    const interval = setInterval(async () => {
      const results: SignalResult[] = []

      for (const symbol of COINS) {
        const prices = await fetchBinanceCandles(symbol)
        const ema20 = calculateEMA(prices.slice(-20), 20)
        const ema50 = calculateEMA(prices.slice(-50), 50)
        const rsi = calculateRSI(prices.slice(-15), 14)
        const lastPrice = prices[prices.length - 1]

        const decision = evaluateSignal({ ema20, ema50, rsi })

        results.push({
          coin: symbol,
          price: lastPrice,
          action: decision.action.toUpperCase(),
          reason: decision.confidence > 0
            ? `EMA20: ${ema20.toFixed(2)}, EMA50: ${ema50.toFixed(
            2)}, RSI: ${rsi.toFixed(2)}, Confidence: ${decision.confidence}%`
            : 'Beklemede'
        })
      }

      setSignals(results)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-6">Trade Pilot v3 - Çoklu Coin 🚀</h1>
      <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
        {signals.map(({ coin, price, action, reason }) => (
          <div key={coin} className="border p-4 rounded shadow">
            <h2 className="text-xl font-bold">{coin}</h2>
            <p>Fiyat: ${price.toLocaleString()}</p>
            <p className="font-semibold text-lg">Sinyal: {action}</p>
            <p className="text-sm text-gray-500">{reason}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
