/**
 * Konfigurasi LLM (UC-09). Key hanya di server.
 * Mode tiruan dipakai bila SEMAR_LLM_MODE=tiruan atau ANTHROPIC_API_KEY kosong; hasilnya berlabel "tiruan".
 */
import Anthropic from "@anthropic-ai/sdk";

export type ModeLlm = "nyata" | "tiruan";

export function modeLlm(): ModeLlm {
  if (process.env.SEMAR_LLM_MODE === "tiruan") return "tiruan";
  if (!process.env.ANTHROPIC_API_KEY) return "tiruan";
  return "nyata";
}

export const modelLlm = () => process.env.SEMAR_LLM_MODEL || "claude-opus-5-5";

/** Batas waktu per permintaan (NFR 2.4) dan percobaan ulang (NFR 4.4). */
export const BATAS_WAKTU_LLM_MS = 15_000;
export const PERCOBAAN_ULANG_LLM = 2;

export function getAnthropic(): Anthropic {
  if (modeLlm() === "tiruan") throw new Error("LLM dalam mode tiruan; tidak ada klien Anthropic");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: BATAS_WAKTU_LLM_MS, maxRetries: 0 });
}
