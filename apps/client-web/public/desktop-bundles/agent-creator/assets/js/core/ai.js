(() => {
  const AI = {
    _currentAbort: null,
    async getActiveConfig(type = "text") {
      if (!App.isDbReady()) {
        console.warn("DB \u672A\u5C31\u7EEA\uFF0C\u65E0\u6CD5\u83B7\u53D6 API \u914D\u7F6E");
        return null;
      }
      const configs = await DB.getAll(`${type}_api_pool`);
      return configs && configs.find((c) => c.is_active === 1) || configs && configs[0] || null;
    },
    abort() {
      if (AI._currentAbort) {
        AI._currentAbort.abort();
        AI._currentAbort = null;
      }
    },
    async generate(prompt, config = {}, onChunk) {
      if (!onChunk) {
        let fullText = "";
        await AI.generate(prompt, config, (c) => {
          fullText += c;
        });
        return fullText;
      }
      const apiConfig = config.useModel ? config.useModel : await AI.getActiveConfig("text");
      if (!apiConfig) {
        const errMsg = "\u26A0\uFE0F \u672A\u914D\u7F6EAPI\u6D41\u91CF\u6C60\uFF0C\u8BF7\u5148\u5728\u300C\u7CFB\u7EDF\u8BBE\u7F6E\u300D\u2192\u300CAPI\u6D41\u91CF\u6C60\u300D\u4E2D\u6DFB\u52A0API\u5BC6\u94A5";
        if (typeof UI !== "undefined") UI.toast(errMsg, "error");
        throw new Error("\u672A\u914D\u7F6EAPI\uFF0C\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u6DFB\u52A0API\u5BC6\u94A5");
      }
      const abortCtrl = new AbortController();
      AI._currentAbort = abortCtrl;
      const maxRetries = 5;
      if (typeof UI !== "undefined") UI.toast("\u6B63\u5728\u8FDE\u63A5API...", "info");
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (abortCtrl.signal.aborted) throw new Error("\u5DF2\u4E2D\u6B62");
        try {
          const { url, headers, body } = AI.buildRequest(apiConfig, prompt, true);
          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: abortCtrl.signal
          });
          if (!res.ok) {
            let errorDetail = "";
            try {
              const errorData = await res.json();
              errorDetail = errorData.error?.message || errorData.message || JSON.stringify(errorData);
            } catch (parseErr) {
              errorDetail = await res.text() || res.statusText;
            }
            throw new Error(`API Error ${res.status}: ${errorDetail}`);
          }
          if (attempt > 1 && typeof UI !== "undefined") UI.toast("API\u8FDE\u63A5\u6210\u529F \u2713", "success");
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          while (true) {
            if (abortCtrl.signal.aborted) {
              reader.cancel();
              throw new Error("\u5DF2\u4E2D\u6B62");
            }
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = dec.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const json = JSON.parse(line.slice(6));
                  const txt = AI.parseStreamChunk(apiConfig.provider, json);
                  if (txt) onChunk(txt);
                } catch (e) {
                }
              }
            }
          }
          AI._currentAbort = null;
          return;
        } catch (e) {
          if (abortCtrl.signal.aborted) {
            AI._currentAbort = null;
            throw new Error("\u5DF2\u4E2D\u6B62");
          }
          const errorMessage = e.message || "";
          if (errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorMessage.includes("\u8EAB\u4EFD\u9A8C\u8BC1")) {
            AI._currentAbort = null;
            const authError = "\u26A0\uFE0F API\u5BC6\u94A5\u65E0\u6548\u6216\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u5728\u300C\u7CFB\u7EDF\u8BBE\u7F6E\u300D\u2192\u300CAPI\u6D41\u91CF\u6C60\u300D\u4E2D\u68C0\u67E5\u914D\u7F6E";
            if (typeof UI !== "undefined") UI.toast(authError, "error");
            onChunk(`
[Error: ${authError}]
`);
            return;
          }
          if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests") || errorMessage.includes("Rate limit")) {
            const retryAfter = 3e4;
            if (attempt < maxRetries) {
              const retryMsg = `API\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C${retryAfter / 1e3}\u79D2\u540E\u91CD\u8BD5 (${attempt}/${maxRetries})...`;
              if (typeof UI !== "undefined") UI.toast(retryMsg, "warning");
              onChunk(`
[\u8BF7\u6C42\u8FC7\u591A\uFF0C${retryAfter / 1e3}\u79D2\u540E\u91CD\u8BD5...]
`);
              await new Promise((r) => setTimeout(r, retryAfter));
              continue;
            }
          }
          if (attempt < maxRetries) {
            const delay = Math.min(1e3 * Math.pow(2, attempt - 1), 1e4);
            const retryMsg = `API\u91CD\u8BD5\u4E2D (${attempt}/${maxRetries})... ${(delay / 1e3).toFixed(0)}\u79D2\u540E\u91CD\u8BD5`;
            if (typeof UI !== "undefined") UI.toast(retryMsg, "warning");
            onChunk(`
[\u8FDE\u63A5\u5931\u8D25\uFF0C${(delay / 1e3).toFixed(0)}\u79D2\u540E\u7B2C${attempt + 1}\u6B21\u91CD\u8BD5 (\u6700\u591A${maxRetries}\u6B21)...]
`);
            await new Promise((r) => setTimeout(r, delay));
          } else {
            AI._currentAbort = null;
            if (typeof UI !== "undefined") UI.toast(`API\u5931\u8D25: ${e.message}`, "error");
            onChunk(`
[Error: \u91CD\u8BD5${maxRetries}\u6B21\u540E\u4ECD\u5931\u8D25 - ${e.message}]`);
          }
        }
      }
    },
    buildRequest(config, prompt, stream) {
      const { provider, api_key, base_url, model_name } = config;
      let url;
      let headers = { "Content-Type": "application/json" };
      let body;
      if (provider === "gemini") {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || "gemini-1.5-flash"}:${stream ? "streamGenerateContent" : "generateContent"}?key=${api_key}`;
        body = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 16384 }
        };
      } else if (provider === "claude") {
        url = `${base_url || "https://api.anthropic.com"}/v1/messages`;
        headers["x-api-key"] = api_key;
        headers["anthropic-version"] = "2023-06-01";
        body = { model: model_name, max_tokens: 16384, messages: [{ role: "user", content: prompt }], stream };
      } else {
        url = `${base_url}/chat/completions`;
        if (api_key) headers["Authorization"] = `Bearer ${api_key}`;
        body = { model: model_name, messages: [{ role: "user", content: prompt }], stream, max_tokens: 16384 };
      }
      return { url, headers, body };
    },
    parseStreamChunk(provider, data) {
      if (provider === "gemini") return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (provider === "claude") return data.delta?.text || "";
      return data.choices?.[0]?.delta?.content || "";
    }
  };
  window.AI = AI;
})();
