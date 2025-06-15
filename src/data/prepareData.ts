export interface PreparedData {
    inputs: number[][];
    targets: number[][];
  }
  
  /**
   * rawData: Binance kline datası
   * windowSize: input feature için kapanış fiyatlarından alınacak ardışık sayı
   */
  export function prepareData(
    rawData: any[][],
    windowSize: number
  ): PreparedData {
    const closes = rawData.map((candle) => parseFloat(candle[4]));
  
    // Min-max normalize
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const normCloses = closes.map((c) => (c - min) / (max - min));
  
    const inputs: number[][] = [];
    const targets: number[][] = [];
  
    for (let i = 0; i < normCloses.length - windowSize - 1; i++) {
      const inputWindow = normCloses.slice(i, i + windowSize);
      const targetPrice = normCloses[i + windowSize];
  
      inputs.push(inputWindow);
  
      // Basit binary sınıflandırma: fiyat artarsa [1,0], azarsa [0,1]
      const target = targetPrice > inputWindow[inputWindow.length - 1] ? [1, 0] : [0, 1];
      targets.push(target);
    }
  
    return { inputs, targets };
  }