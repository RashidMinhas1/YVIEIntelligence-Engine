# Provider Capability Matrix

This matrix outlines the capabilities, constraints, and cost/performance profiles of the supported and planned AI providers for the application. It serves as a reference for deciding which provider to configure for specific environments.

| Feature / Provider | OpenAI (`gpt-4o-mini`) | Gemini (`gemini-1.5-flash`) | OpenRouter | Claude (`claude-3-haiku`) | Grok (`grok-2`) | DeepSeek (`deepseek-coder`) | Ollama (Local) |
|--------------------|------------------------|-----------------------------|------------|---------------------------|-----------------|-----------------------------|----------------|
| **Streaming** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **JSON Mode** | ✅ Yes | ✅ Yes | ⚠️ Varies by model | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **Function/Tool Calling** | ✅ Yes | ✅ Yes | ⚠️ Varies by model | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Varies by model |
| **Context Window** | 128k tokens | 1M - 2M tokens | Varies (up to 2M) | 200k tokens | 128k tokens | 128k tokens | Depends on RAM |
| **Max Output Tokens** | 16,384 | 8,192 | Varies by upstream | 8,192 | 4,096 | 8,192 | Hardware bound |
| **Vision Support** | ✅ Yes | ✅ Yes | ⚠️ Varies by model | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **File Support** | ✅ Yes (File API) | ✅ Yes (File API) | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Cost** | Medium | Low | Varies (Often Low) | Medium | Medium | Very Low | Free (Compute Cost) |
| **Typical Latency** | Low | Very Low | Medium | Low | Low | Medium | Hardware bound |

### Key Considerations for Integration:
- **OpenRouter** acts as a unified proxy; capabilities depend entirely on the underlying model routed through their API.
- **Gemini** boasts a massive context window (1M+ tokens), making it the only viable provider for analyzing full hours of YouTube transcripts concurrently in a single prompt.
- **Ollama** ensures absolute data privacy and zero API costs but introduces massive variance in latency and capability depending on the local machine's specs.
- **DeepSeek** offers unparalleled cost efficiency for coding/structured data tasks but may lack robust multi-modal/file API features natively.
