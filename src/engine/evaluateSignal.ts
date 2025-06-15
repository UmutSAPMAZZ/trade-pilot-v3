import { emaCross } from '../strategies/emaCross';
import { rsiOversold } from '../strategies/rsiOversold';

export function evaluateSignal(indicators: any) {
  const results = [
    emaCross(indicators),
    rsiOversold(indicators),
  ];

  const hasSignal = (s: any): s is { signal: string; confidence: number } => 'signal' in s;

  const buys = results.filter(hasSignal).filter(s => s.signal === 'buy');
  const sells = results.filter(hasSignal).filter(s => s.signal === 'sell');

  if (buys.length >= 2) return { action: 'buy', confidence: 80 };
  if (sells.length >= 2) return { action: 'sell', confidence: 80 };

  return { action: 'wait', confidence: 0 };
}