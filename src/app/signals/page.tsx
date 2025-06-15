import { scanCoins } from "@/engine/scanCoins";
import { runQuickBacktest } from "@/backtest/runQuickBacktest";

export default async function SignalsPage() {
  const signals = await scanCoins();

  const results = await Promise.all(
    signals.map(async (s) => {
      const backtest = await runQuickBacktest(s.symbol);
      return { ...s, ...backtest };
    })
  );

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Coin Sinyalleri & Başarı Oranı</h1>
      <table className="w-full border text-sm border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Coin</th>
            <th className="p-2 border">Sinyal</th>
            <th className="p-2 border">Win Rate (%)</th>
            <th className="p-2 border">Total Profit ($)</th>
          </tr>
        </thead>
        <tbody>
          {results.map((s) => (
            <tr key={s.symbol}>
              <td className="p-2 border">{s.symbol}</td>
              <td className={`p-2 border font-bold ${colorClass(s.signal)}`}>{s.signal}</td>
              <td className="p-2 border text-center">{s.winRate}</td>
              <td className={`p-2 border text-right ${profitClass(s.totalProfit)}`}>
                {s.totalProfit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function colorClass(signal: string) {
  if (signal === "BUY") return "text-green-600";
  if (signal === "SELL") return "text-red-600";
  return "text-gray-600";
}

function profitClass(p: number) {
  return p >= 0 ? "text-green-700" : "text-red-700";
}
