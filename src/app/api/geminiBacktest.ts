// src/pages/api/geminiBacktest.ts
// Basit bir API route örneği — tarihseldatanızı burada alıp Gemini sinyal dizisi alıp geri dönebilir

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchBinanceCandles } from "@/data/fetchCandles"; // senin tarihi veri çekme fonksiyonun
import { getGeminiSignals } from "@/signals/geminiSignal";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { symbol = "BTCUSDT", step = "10" } = req.query;

    // Tarihi mum verisi çek (örn. 1000 mum)
    const candles = await fetchBinanceCandles(symbol as string, '1h', 1000);

    // Gemini sinyalleri al (step kadar aralıkla)
    const signals = await getGeminiSignals(candles, Number(step));

    // Burada sinyalleri kullanarak backtest sonuçlarını hesaplayabilirsin
    // Şimdilik sadece sinyalleri döndürüyoruz
    res.status(200).json({ signals });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
