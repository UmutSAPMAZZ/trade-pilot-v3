// src/ml/mlpModel.ts

export class MLPModel {
    private weights1: number[][];
    private biases1: number[];
    private weights2: number[][];
    private biases2: number[];
  
    constructor(inputSize: number, hiddenSize: number, outputSize: number) {
      this.weights1 = Array.from({ length: hiddenSize }, () =>
        Array.from({ length: inputSize }, () => Math.random() * 0.1 - 0.05)
      );
      this.biases1 = Array(hiddenSize).fill(0);
  
      this.weights2 = Array.from({ length: outputSize }, () =>
        Array.from({ length: hiddenSize }, () => Math.random() * 0.1 - 0.05)
      );
      this.biases2 = Array(outputSize).fill(0);
    }
  
    private relu(x: number): number {
      return Math.max(0, x);
    }
  
    private reluDerivative(x: number): number {
      return x > 0 ? 1 : 0;
    }
  
    private softmax(logits: number[]): number[] {
      const maxLogit = Math.max(...logits);
      const exps = logits.map((v) => Math.exp(v - maxLogit));
      const sumExps = exps.reduce((a, b) => a + b, 0);
      return exps.map((v) => v / sumExps);
    }

    // Cross-entropy loss hesaplama (target ve output softmax sonrası)
    private crossEntropyLoss(output: number[], target: number[]): number {
        const epsilon = 1e-15;
        return -target.reduce((sum, t, i) => sum + t * Math.log(output[i] + epsilon), 0);
    }
  
    public forward(input: number[]): number[] {
      const hidden = this.weights1.map((weights, i) =>
        this.relu(weights.reduce((sum, w, j) => sum + w * input[j], this.biases1[i]))
      );
  
      const output = this.weights2.map((weights, i) =>
        weights.reduce((sum, w, j) => sum + w * hidden[j], this.biases2[i])
      );
  
      return this.softmax(output);
    }
  
    public backward(input: number[], output: number[], target: number[], learningRate: number) {
        const hidden = this.weights1.map((weights, i) =>
          this.relu(weights.reduce((sum, w, j) => sum + w * input[j], this.biases1[i]))
        );
      
        // output layer error
        const outputError = output.map((o, i) => o - target[i]);
      
        // gradient for weights2 and biases2
        for (let i = 0; i < this.weights2.length; i++) {
          for (let j = 0; j < this.weights2[i].length; j++) {
            this.weights2[i][j] -= learningRate * outputError[i] * hidden[j];
          }
          this.biases2[i] -= learningRate * outputError[i];
        }
      
        // hidden layer error
        const hiddenError = new Array(this.biases1.length).fill(0).map((_, j) => {
          let sum = 0;
          for (let i = 0; i < this.weights2.length; i++) {
            sum += this.weights2[i][j] * outputError[i];
          }
          return sum * this.reluDerivative(hidden[j]);
        });
      
        // gradient for weights1 and biases1
        for (let i = 0; i < this.weights1.length; i++) {
          for (let j = 0; j < this.weights1[i].length; j++) {
            this.weights1[i][j] -= learningRate * hiddenError[i] * input[j];
          }
          this.biases1[i] -= learningRate * hiddenError[i];
        }
      }
      /**
     * 
     * @param inputs Eğitim verisi: number[][] (örnek sayısı x inputSize)
     * @param targets Eğitim etiketleri: number[][] (örnek sayısı x outputSize) (one-hot encoded)
     * @param epochs Eğitim döngüsü sayısı
     * @param learningRate Öğrenme hızı
     */
    public train(
        inputs: number[][],
        targets: number[][],
        epochs: number,
        learningRate: number
    ) {
        for (let epoch = 1; epoch <= epochs; epoch++) {
        let totalLoss = 0;

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const target = targets[i];

            const output = this.forward(input);
            this.backward(input, output, target, learningRate);

            totalLoss += this.crossEntropyLoss(output, target);
        }

        const avgLoss = totalLoss / inputs.length;
        console.log(`Epoch ${epoch}, Average Loss: ${avgLoss.toFixed(4)}`);
        }
    }
}

  
  