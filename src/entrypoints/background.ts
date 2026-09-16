export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "CAPTURE_SCREENSHOT") {
      (async () => {
        try {
          // 1. Tentukan target windowId dari tab pengirim
          let targetWindowId = sender.tab?.windowId;

          if (targetWindowId === undefined) {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            targetWindowId = tabs[0]?.windowId;
          }

          // 2. Potret viewport visible area
          const dataUrl =
            typeof targetWindowId === "number"
              ? await browser.tabs.captureVisibleTab(targetWindowId, { format: "png" })
              : await browser.tabs.captureVisibleTab({ format: "png" });

          sendResponse({ success: true, dataUrl });
        } catch (error) {
          console.error("CatchBug: Failed to capture tab viewport:", error);
          sendResponse({ success: false, error: String(error) });
        }
      })();

      return true; // Menandakan response dikirim secara asinkron
    }

    // 3. GitHub: Uji Koneksi Repositori & Token
    if (message?.type === "TEST_GITHUB_CONNECTION") {
      (async () => {
        try {
          const { token, repo } = message.payload || {};
          if (!token || !repo) {
            sendResponse({ success: false, error: "Missing GitHub Token or Repository (owner/repo)" });
            return;
          }

          const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
          const res = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${token.trim()}`,
              "X-GitHub-Api-Version": "2022-11-28",
            },
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            sendResponse({
              success: false,
              error: errData.message || `GitHub API error (HTTP ${res.status})`,
            });
            return;
          }

          const data = await res.json();
          sendResponse({
            success: true,
            fullName: data.full_name,
            private: data.private,
          });
        } catch (error) {
          console.error("CatchBug: Failed to test GitHub connection:", error);
          sendResponse({ success: false, error: String(error) });
        }
      })();

      return true;
    }

    // 4. GitHub: Buat Issue Baru Langsung
    if (message?.type === "DISPATCH_GITHUB_ISSUE") {
      (async () => {
        try {
          const { token, repo, title, body, labels } = message.payload || {};
          if (!token || !repo || !title) {
            sendResponse({ success: false, error: "Missing required fields (token, repo, or title)" });
            return;
          }

          const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
          const res = await fetch(`https://api.github.com/repos/${cleanRepo}/issues`, {
            method: "POST",
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${token.trim()}`,
              "Content-Type": "application/json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
              title,
              body,
              labels: Array.isArray(labels) && labels.length > 0 ? labels : ["bug", "catch-bug"],
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            sendResponse({
              success: false,
              error: errData.message || `Failed to create issue (HTTP ${res.status})`,
            });
            return;
          }

          const data = await res.json();
          sendResponse({
            success: true,
            issueUrl: data.html_url,
            issueNumber: data.number,
          });
        } catch (error) {
          console.error("CatchBug: Failed to dispatch GitHub issue:", error);
          sendResponse({ success: false, error: String(error) });
        }
      })();

      return true;
    }

    // 5. Webhook: Uji Ping
    if (message?.type === "TEST_WEBHOOK_PING") {
      (async () => {
        try {
          const { webhookUrl } = message.payload || {};
          if (!webhookUrl) {
            sendResponse({ success: false, error: "Missing Webhook URL" });
            return;
          }

          const isDiscord = webhookUrl.includes("discord.com/api/webhooks");
          const payload = isDiscord
            ? { content: "👋 **[CatchBug]** Webhook connection test successful! Telemetry dispatch is operational." }
            : { text: "👋 *[CatchBug]* Webhook connection test successful! Telemetry dispatch is operational." };

          const res = await fetch(webhookUrl.trim(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            sendResponse({
              success: false,
              error: `Webhook returned HTTP ${res.status}: ${errText.slice(0, 100)}`,
            });
            return;
          }

          sendResponse({ success: true });
        } catch (error) {
          console.error("CatchBug: Failed to test webhook ping:", error);
          sendResponse({ success: false, error: String(error) });
        }
      })();

      return true;
    }

    // 6. Webhook: Dispatch Payload Laporan
    if (message?.type === "DISPATCH_WEBHOOK") {
      (async () => {
        try {
          const { webhookUrl, payload } = message.payload || {};
          if (!webhookUrl || !payload) {
            sendResponse({ success: false, error: "Missing Webhook URL or payload" });
            return;
          }

          const res = await fetch(webhookUrl.trim(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            sendResponse({
              success: false,
              error: `Webhook dispatch failed (HTTP ${res.status}): ${errText.slice(0, 100)}`,
            });
            return;
          }

          sendResponse({ success: true });
        } catch (error) {
          console.error("CatchBug: Failed to dispatch webhook:", error);
          sendResponse({ success: false, error: String(error) });
        }
      })();

      return true;
    }

    // 7. Gemini API: Uji API Key
    if (message?.type === "TEST_GEMINI_KEY") {
      (async () => {
        try {
          const { apiKey, model } = message.payload || {};
          if (!apiKey) {
            sendResponse({ success: false, error: "Missing Gemini API Key" });
            return;
          }

          const targetModel = model || "gemini-2.5-flash";
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}?key=${apiKey.trim()}`
          );

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            sendResponse({
              success: false,
              error: errData.error?.message || `Gemini API error (HTTP ${res.status})`,
            });
            return;
          }

          const data = await res.json();
          sendResponse({
            success: true,
            displayName: data.displayName || data.name,
          });
        } catch (error) {
          console.error("CatchBug: Failed to test Gemini API key:", error);
          sendResponse({ success: false, error: String(error) });
        }
      })();

      return true;
    }

    // 8. Gemini API: Analisis Diagnostik Cerdas
    if (message?.type === "DISPATCH_GEMINI_DIAGNOSE") {
      (async () => {
        try {
          const { apiKey, model, prompt, systemInstruction } = message.payload || {};
          if (!apiKey || !prompt) {
            sendResponse({ success: false, error: "Missing Gemini API Key or prompt" });
            return;
          }

          const targetModel = model || "gemini-2.5-flash";
          const bodyPayload: Record<string, unknown> = {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          };

          if (systemInstruction) {
            bodyPayload.systemInstruction = {
              parts: [{ text: systemInstruction }],
            };
          }

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyPayload),
            }
          );

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            sendResponse({
              success: false,
              error: errData.error?.message || `Gemini API request failed (HTTP ${res.status})`,
            });
            return;
          }

          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) {
            sendResponse({ success: false, error: "No response text returned by Gemini" });
            return;
          }

          try {
            const parsed = JSON.parse(rawText);
            sendResponse({ success: true, result: parsed });
          } catch {
            sendResponse({ success: true, result: { raw: rawText } });
          }
        } catch (error) {
          console.error("CatchBug: Failed to generate diagnosis with Gemini:", error);
          sendResponse({ success: false, error: String(error) });
        }
      })();

      return true;
    }
  });
});
