import type {
  AiSettings,
  ChatMessage,
  Client,
  BusinessProfile,
  DocType,
  DocContext,
} from "../types";
import { buildSystemPrompt, buildChatSystemPrompt } from "./prompt";
import { callProvider, DEFAULT_MODELS, PROVIDER_LABELS, PROVIDER_HINTS, PROVIDER_MODELS } from "./providers";
import { parseAiResponse, type AiResponse } from "./parseResponse";

export { DEFAULT_MODELS, PROVIDER_LABELS, PROVIDER_HINTS, PROVIDER_MODELS };
export type { AiResponse };
export { AiResponseParseError } from "./parseResponse";

// Conversational turn: returns the assistant's plain-text reply.
export async function chatReply(params: {
  settings: AiSettings;
  history: ChatMessage[];
  profile: BusinessProfile;
  client: Client | null;
  docType: DocType;
  contexts: DocContext[];
}): Promise<string> {
  const systemPrompt = buildChatSystemPrompt({
    profile: params.profile,
    client: params.client,
    docType: params.docType,
    contexts: params.contexts,
  });

  return callProvider(
    params.settings.provider,
    params.history,
    systemPrompt,
    params.settings.apiKey,
    params.settings.model
  );
}

export async function generateDocument(params: {
  settings: AiSettings;
  history: ChatMessage[];
  profile: BusinessProfile;
  client: Client | null;
  docType: DocType;
  contexts: DocContext[];
}): Promise<AiResponse> {
  const systemPrompt = buildSystemPrompt({
    profile: params.profile,
    client: params.client,
    docType: params.docType,
    contexts: params.contexts,
  });

  const raw = await callProvider(
    params.settings.provider,
    params.history,
    systemPrompt,
    params.settings.apiKey,
    params.settings.model
  );

  return parseAiResponse(raw);
}
