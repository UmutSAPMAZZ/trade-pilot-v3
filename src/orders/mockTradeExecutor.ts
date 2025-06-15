export function mockTradeExecutor(signal: 'buy' | 'sell') {
  console.log(`📦 [MOCK TRADE] ${signal.toUpperCase()} @ ${new Date().toISOString()}`);
  // gerçek sistemde: DB, log, post, vs. burada devreye girer
}