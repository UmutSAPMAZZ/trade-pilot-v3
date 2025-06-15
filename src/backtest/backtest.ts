import { Candle, Signal } from "./types";

interface BacktestOptions {
  tp: number; // Take Profit yüzde (örneğin 0.5 = %0.5)
  sl: number; // Stop Loss yüzde
}

export interface Trade {
  entryPrice: number;
  exitPrice: number;
  profit: number;
  win: boolean;
  entryIndex: number;
  exitIndex: number;
  signal: Signal;
  position?: "LONG" | "SHORT"; // Pozisyon tipi (LONG veya SHORT)
  reason?: string; // Trade kapama nedeni (TP, SL, max hold, vs.)
}

export function backtest(
  candles: Candle[],
  signals: Signal[],
  options: BacktestOptions
): Trade[] {
  const trades: Trade[] = [];
  let positionOpen = false;
  let entryPrice = 0;
  let entryIndex = 0;
  let positionSignal: Signal = "HOLD";

  for (let i = 0; i < candles.length; i++) {
    if (!positionOpen) {
      if (signals[i] === "BUY" || signals[i] === "SELL") {
        positionOpen = true;
        entryPrice = candles[i].close;
        entryIndex = i;
        positionSignal = signals[i];
      }
    } else {
      const candle = candles[i];
      const tpPrice =
        positionSignal === "BUY"
          ? entryPrice * (1 + options.tp / 100)
          : entryPrice * (1 - options.tp / 100);
      const slPrice =
        positionSignal === "BUY"
          ? entryPrice * (1 - options.sl / 100)
          : entryPrice * (1 + options.sl / 100);

      let exitPrice = candle.close;
      let exitIndex = i;
      let tradeClosed = false;

      // TP veya SL tetiklenmiş mi bakalım
      if (positionSignal === "BUY") {
        if (candle.high >= tpPrice) {
          exitPrice = tpPrice;
          tradeClosed = true;
        } else if (candle.low <= slPrice) {
          exitPrice = slPrice;
          tradeClosed = true;
        }
      } else if (positionSignal === "SELL") {
        if (candle.low <= tpPrice) {
          exitPrice = tpPrice;
          tradeClosed = true;
        } else if (candle.high >= slPrice) {
          exitPrice = slPrice;
          tradeClosed = true;
        }
      }

      // Pozisyon kapandıysa trade'i kaydet
      if (tradeClosed) {
        const profit =
          positionSignal === "BUY"
            ? exitPrice - entryPrice
            : entryPrice - exitPrice;

        trades.push({
          entryPrice,
          exitPrice,
          profit,
          win: profit > 0,
          entryIndex,
          exitIndex,
          signal: positionSignal,
        });

        positionOpen = false;
      }
    }
  }

  // Açık pozisyonla bitti ise kapat
  if (positionOpen) {
    const lastCandle = candles[candles.length - 1];
    const profit =
      positionSignal === "BUY"
        ? lastCandle.close - entryPrice
        : entryPrice - lastCandle.close;
    trades.push({
      entryPrice,
      exitPrice: lastCandle.close,
      profit,
      win: profit > 0,
      entryIndex,
      exitIndex: candles.length - 1,
      signal: positionSignal,
    });
  }

  return trades;
}
