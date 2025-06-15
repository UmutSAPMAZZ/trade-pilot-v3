// src/ml/predictSignal.ts

import { Candle } from "../backtest/types";
import { calculateAllIndicators } from "../indicators/calculateIndicators";
import { MLPModel } from "./mlpModel";

function normalize(arr: number[]): number[] {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max - min === 0) return arr.map(() => 0); // sabit veri
  return arr.map((v) => (v - min) / (max - min));
}

const labelReverseMap = ["BUY", "SELL", "HOLD"];

export async function predictSignal(
  model: MLPModel,
  candles: Candle[]
): Promise<"BUY" | "SELL" | "HOLD"> {
  const indicators = await calculateAllIndicators(candles);
  const i = candles.length - 1;

  const inputRow = [
    indicators.ema20[i],
    indicators.ema50[i],
    indicators.rsi[i],
    indicators.macd.macdLine[i],
    indicators.macd.signalLine[i],
    indicators.adx[i],
    indicators.cci[i],
    indicators.atr[i],
    indicators.bollinger.upper[i],
    indicators.bollinger.lower[i],
    indicators.ichimoku.senkouSpanA[i],
    indicators.ichimoku.senkouSpanB[i],
  ];

  if (!inputRow.every((v) => Number.isFinite(v))) {
    return "HOLD"; // eksik veri varsa
  }

  const normalizedInput = normalize(inputRow);
  const prediction = model.forward(normalizedInput);

  const maxIndex = prediction.indexOf(Math.max(...prediction));
  return labelReverseMap[maxIndex] as "BUY" | "SELL" | "HOLD";
}
