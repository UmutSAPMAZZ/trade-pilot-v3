export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Trade = {
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  direction: "BUY" | "SELL";
  reason: "tp" | "sl" | "maxHold";
  win: boolean; // true if profit > 0
  [key: string]: any; // ekstra bilgiler eklenebilir
  signal: Signal; // işlem sinyali (BUY, SELL, HOLD)
};

export type StrategyParams = {
  tp: number;
  sl: number;
  maxHold: number;
};

export type StrategyFunction = (
  candles: Candle[],
  params: StrategyParams
) => Promise<("BUY" | "SELL" | "HOLD")[]>;

export type TradeResult = {
  trades: Trade[];
  totalProfit: number;
  winRate: number; // kazanma oranı (yüzde olarak)
  totalTrades: number; // toplam işlem sayısı
  avgProfitPerTrade: number; // ortalama işlem başına kar
}

export type Signal = 'BUY' | 'SELL' | 'HOLD';
