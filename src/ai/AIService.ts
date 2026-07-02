// ──────────────────────────────────────────────
// AIService — Phase 6.2
// Central service die een provider selecteert,
// aanroept en de output door de parser haalt.
// ──────────────────────────────────────────────

import { type ProviderId, type AIProvider } from "./AIProvider";
import { MockProvider } from "./providers/MockProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { GoogleProvider } from "./providers/GoogleProvider";
import { DeepSeekProvider } from "./providers/DeepSeekProvider";
import { LocalAIProvider } from "./providers/LocalAIProvider";
import { OpenRouterProvider } from "./providers/OpenRouterProvider";
import { parseProjectDefinitionJson } from "../lib/projectDefinitionParser";
import type { ParseResult } from "../lib/projectDefinitionParser";

/** Registry van beschikbare providers */
const providers: Record<ProviderId, AIProvider> = {
  mock: MockProvider,
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  google: GoogleProvider,
  deepseek: DeepSeekProvider,
  local: LocalAIProvider,
  openrouter: OpenRouterProvider,
};

/** Haal een provider op basis van ID */
export function getProvider(id: ProviderId): AIProvider {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Unknown provider: "${id}". Valid options: ${Object.keys(providers).join(", ")}`);
  }
  return provider;
}

/** Lijst van beschikbare provider IDs */
export function getProviderIds(): ProviderId[] {
  return Object.keys(providers) as ProviderId[];
}

/**
 * Genereer een ProjectDefinition uit ruwe tekst via een AI provider.
 *
 * 1. Roept de provider aan met de ruwe input
 * 2. Parseert de JSON output naar een genormaliseerde ProjectDefinition
 * 3. Geeft een ParseResult terug (nooit een throw — errors zitten in het result)
 */
export async function generateProjectDefinition(
  rawIdea: string,
  providerId: ProviderId,
  apiKey?: string,
): Promise<ParseResult> {
  try {
    // 1. Valideer input
    if (!rawIdea || rawIdea.trim().length === 0) {
      return {
        success: false,
        data: null as unknown as never,
        error: "Input is empty. Please describe your project idea.",
        schemaType: "unknown",
        warnings: [],
        missingFields: [],
      };
    }

    // 2. Kies provider en genereer
    const provider = getProvider(providerId);
    const rawJson = await provider.generate(rawIdea.trim(), apiKey);

    // 3. Parse de output
    const parseResult = parseProjectDefinitionJson(rawJson);

    // 4. Voeg een warning toe als de provider geen API key nodig had (mock)
    if (!provider.config.requiresApiKey) {
      parseResult.warnings.push(
        "Generated with Mock provider — review the output carefully and adjust as needed.",
      );
    }

    return parseResult;
  } catch (err) {
    return {
      success: false,
      data: null as unknown as never,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
      schemaType: "unknown",
      warnings: [],
      missingFields: [],
    };
  }
}
