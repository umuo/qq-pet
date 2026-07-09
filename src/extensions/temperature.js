// 采样参数注入扩展（pi-coding-agent ExtensionAPI）
//
// createAgentSession 的 model 字段不支持运行时传入 temperature / top_p /
// max_tokens，而 onPayload 又被扩展事件 before_provider_request 占用。
// 因此这里用扩展事件把用户在对话设置里选的采样参数写回请求体。

let params = { temperature: 0.7, topP: 1.0, maxTokens: 16384 };

function setParams(p) {
  if (p && typeof p === "object") {
    if (typeof p.temperature === "number") params.temperature = p.temperature;
    if (typeof p.topP === "number") params.topP = p.topP;
    if (typeof p.maxTokens === "number") params.maxTokens = p.maxTokens;
  }
}

function factory(pi) {
  pi.on("before_provider_request", (event) => {
    const payload = event && event.payload ? event.payload : event;
    if (!payload || typeof payload !== "object") return event;
    if (params.temperature != null) payload.temperature = params.temperature;
    if (params.topP != null) payload.top_p = params.topP;
    if (payload.max_tokens !== undefined && params.maxTokens != null) payload.max_tokens = params.maxTokens;
    return payload;
  });
}

module.exports = { default: factory, setParams };
