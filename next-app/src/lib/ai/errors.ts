export type AIErrorReason =
  | "INVALID_API_KEY"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_REQUEST"
  | "EMPTY_RESPONSE"
  | "INTERNAL_ERROR"
  | "PAYMENT_REQUIRED"
  | "MODEL_NOT_FOUND"
  | "SAFETY_BLOCK"
  | "MALFORMED_JSON"
  | "UNKNOWN";

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly reason: AIErrorReason,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
