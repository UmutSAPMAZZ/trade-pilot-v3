import { runBacktest } from '@/backtest/runBacktest';
import { analyzeResults } from '@/backtest/resultAnalyzer';
import { emaRsiStrategy } from '@/strategies/emaRsiStrategy';
import { fetchBinanceCandles } from '@/data/fetchCandles';

type OptimizationResult = {
  tp: number;
  sl: number;
  maxHold: number;
  emaFast: number;
  emaSlow: number;
  rsiOversold: number;
  rsiOverbought: number;
  winRate: number;
  totalProfit: number;
};

async function optimizeParameters() {
  const candles = await fetchBinanceCandles('BTCUSDT', '1h', 500);

  const tpValues = [0.5, 1, 1.5];
  const slValues = [0.3, 0.5, 0.7];
  const maxHoldValues = [5, 10, 15];
  const emaFastValues = [7, 9, 12];
  const emaSlowValues = [21, 26, 30];
  const rsiOversoldValues = [25, 30, 35];
  const rsiOverboughtValues = [65, 70, 75];

  let bestResult: OptimizationResult | null = null;

  for (const tp of tpValues) {
    for (const sl of slValues) {
      for (const maxHold of maxHoldValues) {
        for (const emaFast of emaFastValues) {
          for (const emaSlow of emaSlowValues) {
            if (emaFast >= emaSlow) continue; // EMA fast should be less than slow
            for (const rsiOversold of rsiOversoldValues) {
              for (const rsiOverbought of rsiOverboughtValues) {
                if (rsiOversold >= rsiOverbought) continue;

                const params = {
                  tp,
                  sl,
                  maxHold,
                  emaFast,
                  emaSlow,
                  rsiOversold,
                  rsiOverbought,
                };

                const trades = await runBacktest(candles, params, emaRsiStrategy);
                const analysis = analyzeResults(trades);

                if (!bestResult || analysis.winRate > bestResult.winRate) {
                  bestResult = {
                    tp,
                    sl,
                    maxHold,
                    emaFast,
                    emaSlow,
                    rsiOversold,
                    rsiOverbought,
                    winRate: analysis.winRate,
                    totalProfit: analysis.totalProfit,
                  };
                  console.log(
                    `Yeni en iyi parametre bulundu! WinRate: ${analysis.winRate.toFixed(
                      2
                    )}%, Profit: ${analysis.totalProfit.toFixed(2)}`
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  console.log('Optimizasyon tamamlandı, en iyi sonuç:', bestResult);
  return bestResult;
}

optimizeParameters();
