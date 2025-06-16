"use client";

import { useEffect, useState } from "react";
import { runBacktest } from "@/backtest/runBacktest";
import { analyzeResults } from "@/backtest/resultAnalyzer";
import { fetchBinanceCandles } from "@/data/fetchCandles";
import { emaRsiStrategy } from "@/strategies/emaRsiStrategy"; // örnek strateji
import { emaMacdStrategy } from "@/strategies/emaMacdStrategy"; // ikinci strateji
import { StrategyFunction, StrategyParams, TradeResult } from "@/backtest/types";
import { adxRsiStrategy } from "@/strategies/adxRsiStrategy";
import { advancedComboStrategy } from "@/strategies/advencedComboStrategy";
import { generateSignalWithGemini } from "@/signals/geminiSignal";

const strategies = {
  emaRsiStrategy,
  emaMacdStrategy,
  adxRsiStrategy,
  advancedComboStrategy,
  generateSignalWithGemini
};

const coinList = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "AVAXUSDT"];

export default function BacktestPage() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [strategyName, setStrategyName] = useState<keyof typeof strategies>("emaRsiStrategy");
  const [tp, setTp] = useState(0.5);
  const [sl, setSl] = useState(0.7);
  const [maxHold, setMaxHold] = useState(10);
  const [results, setResults] = useState<ReturnType<typeof analyzeResults> | null>(null);

  const handleBacktest = async () => {
    const candles = await fetchBinanceCandles(symbol, '1h', 50);
    const strategy = strategies[strategyName];

    const trades = await runBacktest(candles, strategy as StrategyFunction, { tp, sl, maxHold });

    

    setResults(trades);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Backtest Sayfası</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block font-medium">Coin</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          >
            {coinList.map((coin) => (
              <option key={coin} value={coin}>
                {coin}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Strateji</label>
          <select
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value as keyof typeof strategies)}
            className="border rounded px-2 py-1 w-full"
          >
            {Object.keys(strategies).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Take Profit (%)</label>
          <input
            type="number"
            step="0.1"
            value={tp}
            onChange={(e) => setTp(parseFloat(e.target.value))}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div>
          <label className="block font-medium">Stop Loss (%)</label>
          <input
            type="number"
            step="0.1"
            value={sl}
            onChange={(e) => setSl(parseFloat(e.target.value))}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div>
          <label className="block font-medium">Max Hold (gün)</label>
          <input
            type="number"
            value={maxHold}
            onChange={(e) => setMaxHold(parseInt(e.target.value))}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
      </div>

      <button
        onClick={handleBacktest}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Backtest Başlat
      </button>

      {results && (
        <div className="mt-6 border rounded p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Sonuçlar</h2>
          <p>Toplam İşlem: {results.totalTrades}</p>
          <p>Kazançlı İşlem: {results.wins}</p>
          <p>Kaybeden İşlem: {results.losses}</p>
          <p>Başarı Oranı: {results.winRate.toFixed(2)}%</p>
          <p>Toplam Kar: ${results.totalProfit.toFixed(2)}</p>
          <p>Ortalama Kazanç: ${results.avgProfitPerWin?.toFixed(4)}</p>
          <p>Ortalama Kayıp: ${results.avgLossPerLoss?.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
}
