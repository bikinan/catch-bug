export interface MaskingOptions {
  enabled?: boolean;
  maskEmails?: boolean;
  customKeywords?: string[];
}

/**
 * Sanitizes sensitive information (passwords, tokens, credit cards, emails, and custom keys)
 * from captured console and network log messages.
 */
export function maskSensitiveData(
  input: string,
  options: MaskingOptions = { enabled: true },
): string {
  if (!input || options.enabled === false) {
    return input;
  }

  let result = input;

  // 1. Bearer Tokens: Bearer eyJ... or alphanumeric tokens
  result = result.replace(/Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi, "Bearer [REDACTED_TOKEN]");

  // 2. Basic Auth: Basic dXNlcjpwYXNz
  result = result.replace(/Basic\s+[A-Za-z0-9+/=]{8,}/gi, "Basic [REDACTED_AUTH]");

  // 3. URL Query Parameter Credentials: ?password=secret&token=abc123
  result = result.replace(
    /([?&](?:password|passwd|pass|secret|token|apiKey|api_key|auth|access_token|id_token|credential)=)([^&\s#]+)/gi,
    "$1[REDACTED]",
  );

  // 4. JSON Key/Value Credentials: {"password": "123", "secret": "abc"}
  result = result.replace(
    /(["']?(?:password|passwd|pass|secret|apiKey|api_key|accessToken|access_token|authToken|auth_token|id_token|private_key|client_secret)["']?\s*:\s*["'])([^"']*)(["'])/gi,
    "$1[REDACTED_SECRET]$3",
  );

  // 5. Credit Card Numbers: 16 digits, with optional spaces or dashes
  result = result.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, "[REDACTED_CARD]");

  // 6. Email Addresses (if enabled)
  if (options.maskEmails) {
    result = result.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[REDACTED_EMAIL]",
    );
  }

  // 7. Custom Keywords
  if (options.customKeywords && options.customKeywords.length > 0) {
    for (const rawKeyword of options.customKeywords) {
      const keyword = rawKeyword.trim();
      if (!keyword) continue;

      // Escape special regex characters in keyword
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Match JSON or key-value format: keyword: "value" or keyword=value
      const jsonRegex = new RegExp(
        `(["']?${escaped}["']?\\s*:\\s*["'])([^"']*)(["'])`,
        "gi",
      );
      result = result.replace(jsonRegex, "$1[REDACTED_CUSTOM]$3");

      const queryRegex = new RegExp(`([?&]${escaped}=)([^&\\s#]+)`, "gi");
      result = result.replace(queryRegex, "$1[REDACTED_CUSTOM]");
    }
  }

  return result;
}
