// import { Candle, Trade, StrategyParams, Signal } from './types';

// export function runBacktest(
//   candles: Candle[],
//   params: StrategyParams,
//   strategy: (candles: Candle[], params: StrategyParams) => string[]
// ): Trade[] {
//   const signals = strategy(candles, params);
//   const trades: Trade[] = [];
//   let position: 'LONG' | 'SHORT' | null = null;
//   let entryPrice = 0;
//   let entryIndex = 0;

//   for (let i = 0; i < candles.length; i++) {
//     const signal = signals[i];
//     const candle = candles[i];

//     if (!position && signal === 'BUY') {
//       position = 'LONG';
//       entryPrice = candle.close;
//       entryIndex = i;
//     } else if (!position && signal === 'SELL') {
//       position = 'SHORT';
//       entryPrice = candle.close;
//       entryIndex = i;
//     }

//     if (position) {
//       const elapsed = i - entryIndex;

//       const takeProfitPrice =
//         position === 'LONG'
//           ? entryPrice * (1 + params.tp / 100)
//           : entryPrice * (1 - params.tp / 100);
//       const stopLossPrice =
//         position === 'LONG'
//           ? entryPrice * (1 - params.sl / 100)
//           : entryPrice * (1 + params.sl / 100);

//       let exit = false;
//       let exitPrice = candle.close;
//       let reason = '';

//       if (
//         (position === 'LONG' && candle.high >= takeProfitPrice) ||
//         (position === 'SHORT' && candle.low <= takeProfitPrice)
//       ) {
//         exit = true;
//         exitPrice = takeProfitPrice;
//         reason = 'TP';
//       } else if (
//         (position === 'LONG' && candle.low <= stopLossPrice) ||
//         (position === 'SHORT' && candle.high >= stopLossPrice)
//       ) {
//         exit = true;
//         exitPrice = stopLossPrice;
//         reason = 'SL';
//       } else if (elapsed >= params.maxHold) {
//         exit = true;
//         exitPrice = candle.close;
//         reason = 'MaxHold';
//       }

//       if (exit) {
//         trades.push({
//           entryIndex,
//           exitIndex: i,
//           entryPrice,
//           exitPrice,
//           position,
//           profit: position === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice,
//           reason,
//           win: (position === 'LONG' && exitPrice > entryPrice) || (position === 'SHORT' && exitPrice < entryPrice),
//           signal: signal as Signal, // Type assertion for signal
//         });
//         position = null;
//       }
//     }
//   }

//   return trades;
// }

import { Candle, StrategyFunction, StrategyParams } from "./types";
import { simulateTrades } from "../orders/simulateTrades";
import { analyzeResults } from "./resultAnalyzer";
import { trainMLModel } from "@/ml/TrainModel";
import { predictSignal } from "@/ml/predictSignal";
import { MLPModel } from "@/ml/mlpModel";
import { fetchTrainingData } from "@/data/fetchCandles";
import { prepareData } from "@/data/prepareData";
import { generateSignalWithGemini, getGeminiSignals } from "@/signals/geminiSignal";
import { runGeminiBacktest } from "./geminiBacktest";

// Artık parametre alıyor!
export async function runBacktest(
  candles: Candle[],
  strategy: StrategyFunction,
  params: StrategyParams
) {
  const signals = await strategy(candles, {
  tp: 1.2,
  sl: 0.8,
  maxHold: 10
});



  // const trades = simulateTrades(candles, signals, params);
  // const results = analyzeResults(trades);

  const geminiSignals = await getGeminiSignals(candles, 10);

    const results = runGeminiBacktest(candles, geminiSignals);
  
  return results;
}

async function useModel(){
  const data = await fetchTrainingData("BTCUSDT", '4h', 1000000)

  const {inputs, targets} = await prepareData(data, 32)

// Model oluştur
const inputSize = 32;
const hiddenSize = 256;  // gizli katmanda 256 nöron
const outputSize = 2;  // 2 sınıf

const model = new MLPModel(inputSize, hiddenSize, outputSize);

// Eğitimi başlat
model.train(inputs, targets, 1000, 0.001);
}