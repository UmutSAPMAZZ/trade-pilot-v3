// src/signals/geminiSignal.ts

import axios from "axios";
import { Candle } from "../backtest/types";
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateCCI,
  calculateIchimokuCloud,
  calculateATR,
  calculateBollingerBands,
} from "../indicators/calculateIndicators";

export async function generateSignalWithGemini(candles: Candle[]): Promise<"BUY" | "SELL" | "HOLD"> {
  const lastIndex = candles.length - 1;
  const recentCandles = candles.slice(-100); // Son 100 mumu al

  const indicators = {
    ema20: calculateEMA(recentCandles, 20).at(-1),
    ema50: calculateEMA(recentCandles, 50).at(-1),
    rsi: calculateRSI(recentCandles, 14).at(-1),
    macd: calculateMACD(recentCandles),
    adx: calculateADX(recentCandles, 14).at(-1),
    cci: calculateCCI(recentCandles, 20).at(-1),
    ichimoku: calculateIchimokuCloud(recentCandles),
    atr: calculateATR(recentCandles, 14).at(-1),
    bollinger: calculateBollingerBands(recentCandles, 20, 2),
    price: recentCandles.at(-1)?.close,
  };

  const payload = {
    prompt: `
Aşağıda kripto para için teknik göstergeler verilmiştir. Tüm verileri göz önüne alarak sadece tek bir işlem sinyali öner: "BUY", "SELL", ya da "HOLD". Açıklama istemiyorum. Cevap büyük harflerle olsun. Şu veriler:

${JSON.stringify(indicators, null, 2)}
`,
  };
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    contents: [{ parts: [{ text: payload.prompt }] }]
  });

  console.log(res.data.candidates?.[0]?.content?.parts?.[0]?.text)
  const raw = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "HOLD";

  if (raw.includes("BUY")) return "BUY";
  if (raw.includes("SELL")) return "SELL";
  return "HOLD";
}

// src/services/geminiSignalService.ts
// Gemini API çağrılarını zaman serisi mumlara göre yapar ve sinyal dizisi döner

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""; // API key'i .env dosyandan çek
const GEMINI_MODEL = "gemini-2.0-flash"; // Örnek model adı

interface GeminiResponse {
  candidates: { content: {parts: {text: string}[]} }[];
}

// Her mum için değil, mesela her 'step' mumda 1 çağrı yapılacak
export async function getGeminiSignals(
  candles: Candle[],
  step: number = 10
): Promise<("BUY" | "SELL" | "HOLD")[]> {
  const signals: ("BUY" | "SELL" | "HOLD")[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i % step !== 0) {
      // Aralıklı mumlar için "HOLD" diyelim, API çağrısı yapmıyoruz
      signals.push("HOLD");
      continue;
    }

    // O ana kadarki mumları prompt için JSON'a çevir
    const promptData = candles.slice(0, i + 1).map(c => ({
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      time: c.time,
    }));

    // Prompt oluştur (örnek, sadeleştirilebilir)
    const prompt = `
Aşağıdaki mum verilerine göre Bitcoin (BTCUSDT) için işlem kararı ver. 
Her mum şunları içerir: open, high, low, close, volume, time.
Karar sadece "BUY", "SELL" veya "HOLD" olabilir.
Mum verileri: ${JSON.stringify(promptData)}
Lütfen sadece bir kelime ile cevap ver.
`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: {
              parts: [{text: prompt }],
            },
            // maxTokens, stopSequences vb. eklenebilir
          }),
        }
      );

      if (!res.ok) {
        console.error("Gemini API hata:", await res.text());
        signals.push("HOLD");
        continue;
      }

      const json: GeminiResponse = await res.json();

      const rawSignal = json.candidates[0]?.content.parts[0].text.trim().toUpperCase();

      // Sinyal doğru mu kontrol et
      if (rawSignal === "BUY" || rawSignal === "SELL" || rawSignal === "HOLD") {
        signals.push(rawSignal);
      } else {
        signals.push("HOLD"); // Beklenmeyen cevapta HOLD
      }
    } catch (error) {
      console.error("Gemini çağrısında hata:", error);
      signals.push("HOLD");
    }
  }

  return signals;
}
