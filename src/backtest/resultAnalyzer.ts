import { Trade } from "./backtest";

export interface AnalysisResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  avgProfitPerWin: number;
  avgLossPerLoss: number;
}

export function analyzeResults(trades: Trade[]): AnalysisResult {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.win).length;
  const losses = totalTrades - wins;
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);

  const avgProfitPerWin =
    trades.filter(t => t.win).reduce((sum, t) => sum + t.profit, 0) / (wins || 1);

  const avgLossPerLoss =
    trades.filter(t => !t.win).reduce((sum, t) => sum + t.profit, 0) / (losses || 1);

  const winRate = (wins / totalTrades) * 100;

  return {
    totalTrades,
    wins,
    losses,
    winRate,
    totalProfit,
    avgProfitPerWin,
    avgLossPerLoss,
  };
}
