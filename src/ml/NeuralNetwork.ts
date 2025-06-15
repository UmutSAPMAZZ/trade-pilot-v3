// src/ml/NeuralNetwork.ts
// Basit 1 gizli katmanlı Neural Network (MLP) sınıfı

import { Matrix, dot, add, relu, reluDerivative, softmax } from "./matrix";

function createRandomMatrix(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() - 0.5) * 2)
  );
}

export class NeuralNetwork {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;

  // Ağırlıklar ve biaslar
  W1: Matrix;
  b1: Matrix;
  W2: Matrix;
  b2: Matrix;

  learningRate: number;

  constructor(inputSize: number, hiddenSize: number, outputSize: number, learningRate = 0.01) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.learningRate = learningRate;

    this.W1 = createRandomMatrix(inputSize, hiddenSize);
    this.b1 = createRandomMatrix(1, hiddenSize);
    this.W2 = createRandomMatrix(hiddenSize, outputSize);
    this.b2 = createRandomMatrix(1, outputSize);
  }

  forward(input: number[]): { hidden: Matrix; output: number[] } {
    // input: [inputSize]
    const inputMatrix: Matrix = [input]; // 1 x inputSize

    const z1 = add(dot(inputMatrix, this.W1), this.b1); // 1 x hiddenSize
    const a1 = relu(z1); // aktivasyon

    const z2 = add(dot(a1, this.W2), this.b2); // 1 x outputSize
    const output = softmax(z2[0]); // 1D array outputSize

    return { hidden: a1, output };
  }

  train(input: number[], targetIndex: number) {
    // İleri yayılım
    const inputMatrix: Matrix = [input];
    const z1 = add(dot(inputMatrix, this.W1), this.b1);
    const a1 = relu(z1);
    const z2 = add(dot(a1, this.W2), this.b2);
    const output = softmax(z2[0]);

    // Hata (loss gradient) - cross entropy ve softmax birleşik türev
    const target = Array(this.outputSize).fill(0);
    target[targetIndex] = 1;

    const outputError = output.map((o, i) => o - target[i]); // dL/dz2

    // W2 ve b2 için gradyanlar
    const a1T = this.transpose(a1);
    const dW2 = this.multiplyMatrices(a1T, [outputError]); // hiddenSize x outputSize
    const db2 = [outputError]; // 1 x outputSize

    // Gizli katman hatası
    const W2T = this.transpose(this.W2);
    const hiddenErrorRaw = this.multiplyMatrices([outputError], W2T); // 1 x hiddenSize
    const hiddenError = this.applyElementWise(hiddenErrorRaw, (val, idxRow, idxCol) => {
      return val * reluDerivative(z1)[idxRow][idxCol];
    });

    // W1 ve b1 için gradyanlar
    const inputT = this.transpose(inputMatrix);
    const dW1 = this.multiplyMatrices(inputT, hiddenError); // inputSize x hiddenSize
    const db1 = hiddenError; // 1 x hiddenSize

    // Ağırlıkları güncelle
    this.W2 = this.subtractMatrices(this.W2, this.scalarMultiply(dW2, this.learningRate));
    this.b2 = this.subtractMatrices(this.b2, this.scalarMultiply(db2, this.learningRate));
    this.W1 = this.subtractMatrices(this.W1, this.scalarMultiply(dW1, this.learningRate));
    this.b1 = this.subtractMatrices(this.b1, this.scalarMultiply(db1, this.learningRate));
  }

  predict(input: number[]): number {
    const { output } = this.forward(input);
    return output.indexOf(Math.max(...output));
  }

  // Matris işlemleri yardımcı fonksiyonlar

  transpose(m: Matrix): Matrix {
    return m[0].map((_, i) => m.map(row => row[i]));
  }

  multiplyMatrices(a: Matrix, b: Matrix): Matrix {
    const rowsA = a.length,
      colsA = a[0].length,
      rowsB = b.length,
      colsB = b[0].length;
    if (colsA !== rowsB) throw new Error("Matris boyutları uyumsuz");

    const result: Matrix = [];
    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  scalarMultiply(m: Matrix, scalar: number): Matrix {
    return m.map(row => row.map(val => val * scalar));
  }

  subtractMatrices(a: Matrix, b: Matrix): Matrix {
    return a.map((row, i) => row.map((val, j) => val - b[i][j]));
  }

  applyElementWise(m: Matrix, fn: (val: number, row: number, col: number) => number): Matrix {
    return m.map((row, i) => row.map((val, j) => fn(val, i, j)));
  }
}
