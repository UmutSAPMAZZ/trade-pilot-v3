// src/ml/matrix.ts
// Matris ve vektör işlemleri: dot product, toplama, vb.

export type Matrix = number[][];

export function dot(a: Matrix, b: Matrix): Matrix {
  const result: Matrix = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < b.length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export function add(a: Matrix, b: Matrix): Matrix {
  return a.map((row, i) => row.map((val, j) => val + b[i][j]));
}

export function relu(x: Matrix): Matrix {
  return x.map(row => row.map(val => Math.max(0, val)));
}

export function reluDerivative(x: Matrix): Matrix {
  return x.map(row => row.map(val => (val > 0 ? 1 : 0)));
}

export function softmax(x: number[]): number[] {
  const max = Math.max(...x);
  const exps = x.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}
