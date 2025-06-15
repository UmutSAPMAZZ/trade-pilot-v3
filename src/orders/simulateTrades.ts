import { Candle } from "@/backtest/types";
import { Trade } from "@/backtest/types";
import { Signal as StrategySignal } from "@/backtest/types";

type SimParams = {
  tp: number; // örn: 1.2 => %1.2
  sl: number; // örn: 0.8 => %0.8
  maxHold: number; // örn: 10 => maksimum 10 candle boyunca tut
};

export function simulateTrades(
  candles: Candle[],
  signals: StrategySignal[],
  params: SimParams
): Trade[] {
  const trades: Trade[] = [];
  let positionOpen = false;

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    const candle = candles[i];

    if (!candle || positionOpen) continue;

    if (signal === "BUY" || signal === "SELL") {
      const entryPrice = candle.close;
      const direction = signal;
      let exitPrice = entryPrice;
      let reason = "maxHold";

      for (let j = 1; j <= params.maxHold; j++) {
        const future = candles[i + j];
        if (!future) break;

        const priceChange =
          direction === "BUY"
            ? (future.high - entryPrice) / entryPrice
            : (entryPrice - future.low) / entryPrice;

        const stopLossHit =
          direction === "BUY"
            ? (entryPrice - future.low) / entryPrice >= params.sl / 100
            : (future.high - entryPrice) / entryPrice >= params.sl / 100;

        const takeProfitHit = priceChange >= params.tp / 100;

        if (takeProfitHit) {
          exitPrice = direction === "BUY" ? entryPrice * (1 + params.tp / 100) : entryPrice * (1 - params.tp / 100);
          reason = "tp";
          break;
        }

        if (stopLossHit) {
          exitPrice = direction === "BUY" ? entryPrice * (1 - params.sl / 100) : entryPrice * (1 + params.sl / 100);
          reason = "sl";
          break;
        }

        // maxHold’e kadar git, çıkış fiyatı o candle'ın close’u
        if (j === params.maxHold) {
          exitPrice = future.close;
        }
      }

      const profit = direction === "BUY"
        ? exitPrice - entryPrice
        : entryPrice - exitPrice;

      trades.push({
        entryIndex: i,
        exitIndex: i + params.maxHold,
        entryPrice,
        exitPrice,
        profit,
        direction,
        reason: reason as "tp" | "sl" | "maxHold",
        win: profit > 0,
        signal: signal, // işlem sinyali (BUY, SELL, HOLD)
      });

      positionOpen = false; // tek işlem örneği için. Çoklu poz açmak istersen değiştirirsin
    }
  }

  return trades;
}
