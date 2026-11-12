import * as logger from "firebase-functions/logger";

export const CANDIDATE_FLASH_LITE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
] as const;

/**
 * Mengurai daftar API Key Gemini (Primary + Backup) dari nilai Secret Manager atau environment.
 * Mendukung format pemisahan koma pada secret `GEMINI_API_KEY` (misal: "key1,key2")
 * serta fallback otomatis ke key backup via env.
 */
export function resolveGeminiApiKeys(rawSecretValue?: string): string[] {
  const sources = [
    rawSecretValue,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP,
  ];

  const keys: string[] = [];
  for (const src of sources) {
    if (!src) continue;
    for (const part of src.split(",")) {
      const cleaned = part.replace(/^["']|["']$/g, "").trim();
      if (cleaned && !keys.includes(cleaned)) {
        keys.push(cleaned);
      }
    }
  }
  return keys;
}

export interface GeminiFailoverResult {
  ok: boolean;
  status: number;
  data: any;
  text: string;
  usedModel: string;
  usedKeyIndex: number;
  errorMessage?: string;
}

/**
 * Memanggil Google Generative Language REST API (v1beta) dengan failover otomatis:
 * 1. Mencoba Primary API Key terlebih dahulu.
 * 2. Jika terkena limit/habis kuota/spend cap (400/402/403/429), otomatis berpindah ke Backup API Key.
 * 3. Jika model utama mengalami gangguan (404/503), mencoba fallback antar lini Flash-Lite.
 */
export async function callGeminiFlashLiteWithFailover(
  rawSecretValue: string,
  payload: Record<string, any>,
  models: readonly string[] = CANDIDATE_FLASH_LITE_MODELS
): Promise<GeminiFailoverResult> {
  const apiKeys = resolveGeminiApiKeys(rawSecretValue);
  if (apiKeys.length === 0) {
    return {
      ok: false,
      status: 500,
      data: null,
      text: "",
      usedModel: models[0],
      usedKeyIndex: -1,
      errorMessage: "API Key untuk Gemini tidak ditemukan di Secret Manager.",
    };
  }

  let lastStatus = 500;
  let lastData: any = null;
  let lastErrorMsg = "Gagal menghubungi AI Server.";

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const apiKey = apiKeys[keyIdx];

    for (const modelName of models) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Referer": "https://sigap-opd.web.app/",
            "Origin": "https://sigap-opd.web.app",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        lastStatus = response.status;
        lastData = data;

        if (response.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (text) {
            if (keyIdx > 0 || modelName !== models[0]) {
              logger.info(
                `[Gemini Failover] Berhasil menggunakan Key #${keyIdx + 1} pada model ${modelName}`
              );
            }
            return {
              ok: true,
              status: response.status,
              data,
              text,
              usedModel: modelName,
              usedKeyIndex: keyIdx,
            };
          }
        }

        const errMsg: string = data?.error?.message || `HTTP ${response.status}`;
        lastErrorMsg = `Error AI: ${errMsg}`;
        logger.warn(
          `[Gemini Failover] Percobaan gagal pada Key #${keyIdx + 1} (${modelName}) [HTTP ${response.status}]: ${errMsg}`
        );

        const isKeyOrProjectLevelError =
          response.status === 400 ||
          response.status === 402 ||
          response.status === 403 ||
          (response.status === 429 &&
            (errMsg.toLowerCase().includes("spending cap") ||
              errMsg.toLowerCase().includes("prepayment") ||
              errMsg.toLowerCase().includes("billing")));

        if (isKeyOrProjectLevelError) {
          // Langsung pindah ke API Key cadangan berikutnya
          break;
        }
      } catch (err: any) {
        lastErrorMsg = err.message || lastErrorMsg;
        logger.warn(
          `[Gemini Failover] Network/Fetch Error pada Key #${keyIdx + 1} (${modelName}):`,
          err
        );
      }
    }
  }

  return {
    ok: false,
    status: lastStatus,
    data: lastData,
    text: "",
    usedModel: models[0],
    usedKeyIndex: -1,
    errorMessage: lastErrorMsg,
  };
}

