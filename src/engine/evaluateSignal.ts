import { emaCross } from '../strategies/emaCross';
import { rsiOversold } from '../strategies/rsiOversold';

export function evaluateSignal(indicators: any) {
  const results = [
    emaCross(indicators),
    rsiOversold(indicators),
  ];

  const buys = results.filter(s => s.signal === 'buy');
  const sells = results.filter(s => s.signal === 'sell');

  if (buys.length >= 2) return { action: 'buy', confidence: 80 };
  if (sells.length >= 2) return { action: 'sell', confidence: 80 };

  return { action: 'wait', confidence: 0 };
}