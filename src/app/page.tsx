'use client'

import { useEffect, useState } from 'react'
import { fetchBinanceCandles } from '@/data/fetchCandles'
import { EMA, calculateRSI } from '@/indicators/calculateIndicators'
import { evaluateSignal } from '@/engine/evaluateSignal'
import { COINS } from '@/constants/coins'
// import { optimizeParameters } from '@/backtest/optimizer'

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
        const prices = await fetchBinanceCandles(symbol, '1d', 100)
        console.log(`Veriler alındı: ${symbol} - ${prices.length} mum`, Array.isArray(prices))
        const closes = prices.map(c => c.close)
        const ema20Arr = EMA(closes.slice(-20), 20)
        const ema50Arr = EMA(closes.slice(-50), 50)
        const rsiArr = calculateRSI(prices.slice(-15), 14)
        const rsi = Array.isArray(rsiArr) ? rsiArr[rsiArr.length - 1] : rsiArr
        const lastPrice = closes[closes.length - 1]

        const ema20 = Array.isArray(ema20Arr) ? ema20Arr[ema20Arr.length - 1] : ema20Arr
        const ema50 = Array.isArray(ema50Arr) ? ema50Arr[ema50Arr.length - 1] : ema50Arr

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
