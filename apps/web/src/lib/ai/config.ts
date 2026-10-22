const clean = (value: string | undefined) => value?.trim() || "";

export function programAiConfig() {
  const apiKey = clean(process.env.OPENCODE_GO_API_KEY);
  const baseUrl = clean(process.env.OPENCODE_GO_BASE_URL).replace(/\/+$/, "");
  const mainModel = clean(process.env.OPENCODE_GO_MODEL_MAIN);
  const fastModel = clean(process.env.OPENCODE_GO_MODEL_FAST);

  return {
    enabled:
      Boolean(apiKey && baseUrl && mainModel) &&
      process.env.AI_ENABLED !== "false" &&
      process.env.AI_PROGRAM_ENABLED !== "false",
    apiKey,
    baseUrl,
    mainModel,
    fastModel,
    timeoutMs: Number(process.env.OPENCODE_GO_TIMEOUT_MS) || 45_000
  };
}

export function modelPrices() {
  return {
    mainIn: Number(process.env.OPENCODE_GO_PRICE_MAIN_IN) || 0,
    mainOut: Number(process.env.OPENCODE_GO_PRICE_MAIN_OUT) || 0,
    fastIn: Number(process.env.OPENCODE_GO_PRICE_FAST_IN) || 0,
    fastOut: Number(process.env.OPENCODE_GO_PRICE_FAST_OUT) || 0
  };
}
