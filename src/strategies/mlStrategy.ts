// src/ml/mlStrategy.ts
// Next.js projen için makine öğrenme tabanlı strateji dosyası

import { Candle } from "../backtest/types";

// Basit min-max normalize fonksiyonu
function minMaxNormalize(arr: number[]): number[] {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return arr.map(() => 0.5); // sabit değer için ortalama 0.5
  return arr.map(v => (v - min) / (max - min));
}

// Girdi (features) hazırla
function prepareFeatures(candles: Candle[]) {
  const closePrices = candles.map(c => c.close);
  const highPrices = candles.map(c => c.high);
  const lowPrices = candles.map(c => c.low);
  const volume = candles.map(c => c.volume);

  // Burada temel özellikleri ekle, istersen kendi indikatörlerini de dahil edebilirsin
  const normClose = minMaxNormalize(closePrices);
  const normHigh = minMaxNormalize(highPrices);
  const normLow = minMaxNormalize(lowPrices);
  const normVolume = minMaxNormalize(volume);

  // Örnek: sadece normalized close, high, low, volume kullanıyoruz
  const features: number[][] = [];
  for (let i = 0; i < candles.length; i++) {
    features.push([normClose[i], normHigh[i], normLow[i], normVolume[i]]);
  }
  return features;
}

// Etiket oluşturma: 3 gün sonrası kapanış fiyatı ile %1 üzerinde ise BUY, %1 altında ise SELL, arası HOLD
function prepareLabels(candles: Candle[], holdDays = 3, threshold = 0.01): number[] {
  const labels: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i + holdDays >= candles.length) {
      labels.push(2); // HOLD
      continue;
    }
    const futurePrice = candles[i + holdDays].close;
    const priceNow = candles[i].close;
    const change = (futurePrice - priceNow) / priceNow;

    if (change > threshold) labels.push(0); // BUY = 0
    else if (change < -threshold) labels.push(1); // SELL = 1
    else labels.push(2); // HOLD = 2
  }

  return labels;
}

// Basit dense layerlı 1 gizli katmanlı tam bağlantılı yapay sinir ağı
class SimpleNN {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;

  w1: number[][];
  b1: number[];
  w2: number[][];
  b2: number[];

  learningRate: number;

  constructor(inputSize: number, hiddenSize: number, outputSize: number, learningRate = 0.01) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.learningRate = learningRate;

    this.w1 = this.randomMatrix(inputSize, hiddenSize);
    this.b1 = new Array(hiddenSize).fill(0);
    this.w2 = this.randomMatrix(hiddenSize, outputSize);
    this.b2 = new Array(outputSize).fill(0);
  }

  randomMatrix(rows: number, cols: number): number[][] {
    const m = [];
    for (let i = 0; i < rows; i++) {
      m.push(Array.from({ length: cols }, () => (Math.random() - 0.5) * 0.01));
    }
    return m;
  }

  relu(x: number[]): number[] {
    return x.map(v => Math.max(0, v));
  }

  softmax(x: number[]): number[] {
    const max = Math.max(...x);
    const exps = x.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 1e-6); // 0 olmasın!
    return exps.map(v => v / sum);
  }

  dot(a: number[], b: number[][]): number[] {
    // a: 1xN, b: NxM => result 1xM
    const result = new Array(b[0].length).fill(0);
    for (let j = 0; j < b[0].length; j++) {
      for (let i = 0; i < a.length; i++) {
        result[j] += a[i] * b[i][j];
      }
    }
    return result;
  }

  forward(x: number[]): { h: number[]; out: number[] } {
    const z1 = this.dot(x, this.w1).map((v, i) => v + this.b1[i]);
    const h = this.relu(z1);
    const z2 = this.dot(h, this.w2).map((v, i) => v + this.b2[i]);
    const out = this.softmax(z2);
    return { h, out };
  }

  train(x: number[], y: number) {
    // Forward
    const { h, out } = this.forward(x);

    // Cross-entropy loss gradient
    const target = new Array(this.outputSize).fill(0);
    target[y] = 1;
    const delta2 = out.map((v, i) => v - target[i]); // output error

    // Gradients for w2, b2
    const gradW2 = this.w2.map((_, i) => h[i] * delta2[i] || 0); // fix below
    const gradB2 = delta2;

    // Fix gradW2 calculation:
    const gradW2_corrected = this.w2.map((col, i) =>
      delta2.map((d, j) => h[i] * d)
    ); // w2 is hiddenSize x outputSize

    // Compute gradient for hidden layer
    const delta1 = new Array(this.hiddenSize).fill(0);
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = 0;
      for (let j = 0; j < this.outputSize; j++) {
        sum += delta2[j] * this.w2[i][j];
      }
      delta1[i] = h[i] > 0 ? sum : 0;
    }

    // Gradients for w1, b1
    const gradW1 = this.w1.map((col, i) =>
      x.map((xi, j) => delta1[i] * xi)
    ); // w1 is inputSize x hiddenSize
    const gradB1 = delta1;

    // Update weights and biases
    // w1 update
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.w1[i][j] -= this.learningRate * gradW1[i][j];
      }
    }
    // b1 update
    for (let j = 0; j < this.hiddenSize; j++) {
      this.b1[j] -= this.learningRate * gradB1[j];
    }
    // w2 update
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        this.w2[i][j] -= this.learningRate * h[i] * delta2[j];
      }
    }
    // b2 update
    for (let j = 0; j < this.outputSize; j++) {
      this.b2[j] -= this.learningRate * delta2[j];
    }

    // Return loss (cross-entropy)
    const epsilon = 1e-6;
    const prob = Math.max(out[y], epsilon);
    const loss = -Math.log(prob);
    return loss;
  }

  predict(x: number[]): number {
    const { out } = this.forward(x);
    return out.indexOf(Math.max(...out));
  }
}

// Strateji fonksiyonu
export async function mlStrategy(
  candles: Candle[]
): Promise<("BUY" | "SELL" | "HOLD")[]> {
  const features = prepareFeatures(candles);
  const labels = prepareLabels(candles);

  const nn = new SimpleNN(4, 16, 3, 0.01);

  const epochs = 100;
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    for (let i = 0; i < features.length; i++) {
      totalLoss += nn.train(features[i], labels[i]);
    }
    if (epoch % 10 === 0) {
      // Epoch başı 10’da bir loss göster
      console.log(`Epoch ${epoch}, Loss: ${(totalLoss / features.length).toFixed(4)}`);
    }
  }

  // Eğitimi tamamla, tahmin üret
  const signals: ("BUY" | "SELL" | "HOLD")[] = [];
  for (let i = 0; i < features.length; i++) {
    const pred = nn.predict(features[i]);
    if (pred === 0) signals.push("BUY");
    else if (pred === 1) signals.push("SELL");
    else signals.push("HOLD");
  }
  return signals;
}
