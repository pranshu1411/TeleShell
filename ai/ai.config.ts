import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function getAgentModel() {
    const provider = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    const modelId = process.env.OPENROUTER_DEFAULT_MODEL || 'x-ai/grok-4.1-fast:free';

    return provider(modelId);
}
