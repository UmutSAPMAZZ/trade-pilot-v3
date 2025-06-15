// src/ml/trainMLModel.ts

import { Candle } from "../backtest/types";
import { calculateAllIndicators } from "../indicators/calculateIndicators";
import { MLPModel } from "./mlpModel";

// Etiketleri sayısal olarak temsil ediyoruz
const labelMap = {
  BUY: 0,
  SELL: 1,
  HOLD: 2,
};

function oneHot(index: number, size: number = 3): number[] {
  return Array(size).fill(0).map((_, i) => (i === index ? 1 : 0));
}

// Normalize işlemi (her bir input değeri 0-1 aralığına çekilir)
function normalize(arr: number[]): number[] {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max - min === 0) return arr.map(() => 0); // hepsi aynıysa
  return arr.map((v) => (v - min) / (max - min));
}

export async function trainMLModel(candles: Candle[], labels: ("BUY" | "SELL" | "HOLD")[]) {
  const indicators = await calculateAllIndicators(candles);

  const inputs: number[][] = [];
  const targets: number[][] = [];

  for (let i = 50; i < candles.length; i++) {
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

    // Veride eksik (NaN) varsa örneği atlıyoruz
    if (!inputRow.every((v) => Number.isFinite(v))) continue;

    const normalizedInput = normalize(inputRow);
    inputs.push(normalizedInput);

    const label = labels[i];
    targets.push(oneHot(labelMap[label]));
  }

  const inputSize = inputs[0].length;
  const hiddenSize = 16;
  const outputSize = 3;

  const model = new MLPModel(inputSize, hiddenSize, outputSize);

  const epochs = 100;
  const learningRate = 0.001;

  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;

    for (let i = 0; i < inputs.length; i++) {
      const output = model.forward(inputs[i]);
      const target = targets[i];

      // Cross Entropy Loss
      const loss = -target.reduce((sum, t, j) => sum + t * Math.log(output[j] + 1e-8), 0);
      totalLoss += loss;

      model.backward(inputs[i], output, target, learningRate);
    }

    console.log(`Epoch ${epoch + 1}, Loss: ${(totalLoss / inputs.length).toFixed(4)}`);
  }

  return model;
}
