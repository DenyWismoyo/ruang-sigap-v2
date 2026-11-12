import 'server-only';
import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';

export const CANDIDATE_FLASH_LITE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
] as const;

export const ALLOWED_AI_DOMAINS = [
  'sigap-opd.web.app',
  'sigap-opd.firebaseapp.com',
  'sgp.omnifit.cloud',
  'sigap.solo-technopark.id',
  'localhost',
  '127.0.0.1',
] as const;

/**
 * Memvalidasi apakah request yang memanggil API AI berasal dari domain resmi SIGAP
 * (sigap-opd.web.app atau sgp.omnifit.cloud) untuk mencegah penyerang luar/bot menembak endpoint kita.
 */
export function isAllowedOrigin(req: Request): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  const check = (urlStr: string | null): boolean => {
    if (!urlStr) return false;
    try {
      const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return ALLOWED_AI_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`));
    } catch {
      return false;
    }
  };

  return check(origin) || check(referer) || check(host);
}

/**
 * Mengambil daftar API Key Gemini yang tersedia (Primary + Backup) secara berurutan.
 * Mendukung pemisahan koma pada GEMINI_API_KEY maupun variabel GEMINI_API_KEY_BACKUP.
 */
export function getGeminiApiKeys(explicitRawKey?: string): string[] {
  const rawSources = [
    explicitRawKey,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ];

  const keys: string[] = [];
  for (const src of rawSources) {
    if (!src) continue;
    for (const part of src.split(',')) {
      const cleaned = part.replace(/^["']|["']$/g, '').trim();
      if (cleaned && !keys.includes(cleaned)) {
        keys.push(cleaned);
      }
    }
  }
  return keys;
}

/**
 * Memanggil REST Endpoint Google Generative Language API (v1beta)
 * dengan failover otomatis lintas API Key (Primary -> Backup) dan lintas model Flash-Lite.
 */
export async function fetchGeminiWithFailover(
  payload: Record<string, any>,
  explicitRawKey?: string,
  models: readonly string[] = CANDIDATE_FLASH_LITE_MODELS
): Promise<{ ok: boolean; status: number; data: any; text: string; usedModel: string; usedKeyIndex: number }> {
  const apiKeys = getGeminiApiKeys(explicitRawKey);
  if (apiKeys.length === 0) {
    throw new Error('API Key Gemini belum dikonfigurasi pada server (GEMINI_API_KEY).');
  }

  let lastStatus = 500;
  let lastData: any = null;
  let lastErrorMsg = 'Gagal menghubungi layanan Gemini Flash-Lite.';

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const apiKey = apiKeys[keyIdx];

    for (const modelName of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Referer': 'https://sigap-opd.web.app/',
              'Origin': 'https://sigap-opd.web.app',
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json().catch(() => ({}));
        lastStatus = response.status;
        lastData = data;

        if (response.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
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

        const errMessage: string = data?.error?.message || `HTTP ${response.status}`;
        lastErrorMsg = errMessage;

        // Jika error berasal dari level API Key / Project Billing / Spend Cap (400, 402, 403, atau 429 project cap),
        // langsung lompat ke API Key cadangan berikutnya tanpa mengulang model lain di key yang sama.
        const isKeyOrProjectLevelError =
          response.status === 400 ||
          response.status === 402 ||
          response.status === 403 ||
          (response.status === 429 &&
            (errMessage.toLowerCase().includes('spending cap') ||
              errMessage.toLowerCase().includes('prepayment') ||
              errMessage.toLowerCase().includes('billing')));

        if (isKeyOrProjectLevelError) {
          break;
        }
      } catch (err: any) {
        lastErrorMsg = err.message || lastErrorMsg;
      }
    }
  }

  return {
    ok: false,
    status: lastStatus,
    data: lastData || { error: { message: lastErrorMsg } },
    text: '',
    usedModel: models[0],
    usedKeyIndex: -1,
  };
}

/**
 * Menjalankan SDK `@google/generative-ai` (`generateContent`) dengan failover otomatis
 * lintas API Key (Primary -> Backup) dan lintas model Flash-Lite.
 */
export async function generateContentWithSdkFailover(
  promptOrContents: any,
  modelParams?: Omit<ModelParams, 'model'>,
  explicitRawKey?: string,
  models: readonly string[] = CANDIDATE_FLASH_LITE_MODELS
): Promise<{ text: string; usedModel: string; usedKeyIndex: number }> {
  const apiKeys = getGeminiApiKeys(explicitRawKey);
  if (apiKeys.length === 0) {
    throw new Error('API Key Gemini tidak ditemukan.');
  }

  let lastError: any = null;

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const genAI = new GoogleGenerativeAI(apiKeys[keyIdx]);

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({
          ...modelParams,
          model: modelName,
        });
        const result = await model.generateContent(promptOrContents);
        const text = result.response.text();
        if (text) {
          return { text, usedModel: modelName, usedKeyIndex: keyIdx };
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '').toLowerCase();
        if (
          msg.includes('spending cap') ||
          msg.includes('prepayment') ||
          msg.includes('api key not valid') ||
          msg.includes('402') ||
          msg.includes('403')
        ) {
          break; // Ganti ke API Key berikutnya
        }
      }
    }
  }

  throw lastError || new Error('Gagal mendapatkan respons dari seluruh API Key & model Gemini Flash-Lite.');
}

