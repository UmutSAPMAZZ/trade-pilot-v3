// src/backtest/geminiBacktest.ts
import { Candle } from "../backtest/types";
import { AnalysisResult } from "./resultAnalyzer";

/**
 * Sinyallere göre backtest yapar.
 * @param candles Tarihsel mum verisi
 * @param signals Gemini veya başka yerden gelen sinyal dizisi ("BUY", "SELL", "HOLD")
 * @returns Backtest metrikleri
 */
export function runGeminiBacktest(
  candles: Candle[],
  signals: ("BUY" | "SELL" | "HOLD")[]
): AnalysisResult {
  let positionOpen = false;
  let entryPrice = 0;
  let totalProfit = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalTrades = 0;

  for (let i = 0; i < candles.length; i++) {
    const signal = signals[i];
    const price = candles[i].close;

    if (signal === "BUY" && !positionOpen) {
      // Pozisyon aç
      positionOpen = true;
      entryPrice = price;
    } else if (signal === "SELL" && positionOpen) {
      // Pozisyon kapat, kar/zarar hesapla
      const profit = price - entryPrice;
      totalProfit += profit;

      if (profit > 0) winningTrades++;
      else if (profit < 0) losingTrades++;

      totalTrades++;
      positionOpen = false;
    }
    // HOLD durumda pozisyonu tutuyoruz, değişiklik yok
  }

  // Eğer son mumda hala pozisyon açıksa, onu kapat (son fiyat ile)
  if (positionOpen) {
    const profit = candles[candles.length - 1].close - entryPrice;
    totalProfit += profit;
    if (profit > 0) winningTrades++;
    else if (profit < 0) losingTrades++;
    totalTrades++;
  }

  const successRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgProfit = winningTrades > 0 ? totalProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? totalProfit / losingTrades : 0;

  return {
    totalTrades,
    wins: winningTrades,
    losses: losingTrades,
    winRate: successRate,
    totalProfit,
    avgProfitPerWin: avgProfit,
    avgLossPerLoss: avgLoss,
  };
}
