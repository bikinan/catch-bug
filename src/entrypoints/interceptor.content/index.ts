import type { Breadcrumb, CapturedLog, PostMessagePayload } from "@/utils/types";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  world: "MAIN",
  runAt: "document_start",

  main() {
    const SOURCE_ID = "CATCHBUG_INTERCEPTOR";

    const emitLog = (log: CapturedLog) => {
      const message: PostMessagePayload = {
        source: SOURCE_ID,
        kind: "log",
        payload: log,
      };
      window.postMessage(message, "*");
    };

    const emitBreadcrumb = (crumb: Breadcrumb) => {
      const message: PostMessagePayload = {
        source: SOURCE_ID,
        kind: "breadcrumb",
        payload: crumb,
      };
      window.postMessage(message, "*");
    };

    // =========================================================================
    // 1. CONSOLE ERROR INTERCEPTION
    // =========================================================================
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      originalConsoleError.apply(console, args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg),
        )
        .join(" ");

      emitLog({
        id: crypto.randomUUID(),
        type: "console",
        timestamp: new Date().toLocaleTimeString(),
        message,
      });
    };

    // =========================================================================
    // 2. NETWORK INTERCEPTION (FETCH & XHR with Request & Response Body)
    // =========================================================================
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const method = config?.method?.toUpperCase() || "GET";
      const url =
        typeof resource === "string"
          ? resource
          : resource instanceof Request
            ? resource.url
            : String(resource);

      // Serialize request body if available
      let requestBody: string | undefined;
      if (config?.body) {
        if (typeof config.body === "string") {
          requestBody = config.body.slice(0, 2500);
        } else if (config.body instanceof FormData || config.body instanceof URLSearchParams) {
          requestBody = config.body.toString().slice(0, 2500);
        } else {
          try {
            requestBody = JSON.stringify(config.body).slice(0, 2500);
          } catch {
            requestBody = "[Non-serializable payload]";
          }
        }
      }

      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          let responseBody: string | undefined;
          try {
            const clone = response.clone();
            const text = await clone.text();
            responseBody = text.slice(0, 2500);
          } catch {
            responseBody = "[Unable to read response body]";
          }

          emitLog({
            id: crypto.randomUUID(),
            type: "network",
            timestamp: new Date().toLocaleTimeString(),
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            requestBody,
            responseBody,
          });
        }

        return response;
      } catch (error) {
        emitLog({
          id: crypto.randomUUID(),
          type: "network",
          timestamp: new Date().toLocaleTimeString(),
          method,
          url,
          status: 0,
          statusText: "Network Error / Blocked",
          requestBody,
          responseBody: String(error),
        });

        throw error;
      }
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ) {
      this._stagebugMethod = method.toUpperCase();
      this._stagebugUrl = String(url);

      // @ts-expect-error override bawaan open
      return originalXhrOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function (body?: unknown) {
      if (body) {
        if (typeof body === "string") {
          this._stagebugRequestBody = body.slice(0, 2500);
        } else {
          try {
            this._stagebugRequestBody = JSON.stringify(body).slice(0, 2500);
          } catch {
            this._stagebugRequestBody = "[Non-serializable payload]";
          }
        }
      }

      this.addEventListener("loadend", () => {
        if (this.status >= 400 || this.status === 0) {
          let responseBody: string | undefined;
          try {
            if (this.responseType === "" || this.responseType === "text") {
              responseBody = this.responseText ? this.responseText.slice(0, 2500) : undefined;
            } else if (this.responseType === "json" && this.response) {
              responseBody = JSON.stringify(this.response).slice(0, 2500);
            }
          } catch {
            responseBody = "[Binary or unreadable payload]";
          }

          emitLog({
            id: crypto.randomUUID(),
            type: "network",
            timestamp: new Date().toLocaleTimeString(),
            method: this._stagebugMethod || "GET",
            url: this._stagebugUrl || "Unknown",
            status: this.status,
            statusText:
              this.statusText || (this.status === 0 ? "Network Error" : ""),
            requestBody: this._stagebugRequestBody,
            responseBody,
          });
        }
      });

      return originalXhrSend.apply(this, arguments as unknown as [Document | XMLHttpRequestBodyInit | null | undefined]);
    };

    // =========================================================================
    // 3. ACTION BREADCRUMBS TRACKING (Clicks, Inputs, Navigation)
    // =========================================================================
    const isCatchBugElement = (e: Event): boolean => {
      const path = e.composedPath();
      return path.some(
        (node) =>
          node instanceof Element &&
          (node.tagName.toLowerCase() === "catchbug-overlay-root" ||
            node.id === "catchbug-overlay-root" ||
            node.classList.contains("catchbug-overlay-root")),
      );
    };

    // Click tracking
    window.addEventListener(
      "click",
      (e) => {
        if (isCatchBugElement(e)) return;
        const target = e.target;
        if (!(target instanceof Element)) return;

        // Cari elemen interaktif terdekat (button, a, input, atau elemen itu sendiri)
        const interactiveEl = target.closest("button, a, input, [role='button'], select, textarea") || target;

        const tagName = interactiveEl.tagName.toLowerCase();
        const id = interactiveEl.id ? `#${interactiveEl.id}` : "";
        const testId = interactiveEl.getAttribute("data-testid")
          ? `[data-testid="${interactiveEl.getAttribute("data-testid")}"]`
          : "";
        const className =
          interactiveEl.classList.length > 0
            ? `.${Array.from(interactiveEl.classList).slice(0, 2).join(".")}`
            : "";

        const selector = `${tagName}${id || testId || className}`;

        let detail: string | undefined;
        if (interactiveEl instanceof HTMLElement) {
          const label =
            interactiveEl.getAttribute("aria-label") ||
            interactiveEl.innerText ||
            interactiveEl.textContent ||
            "";
          const trimmed = label.trim().replace(/\s+/g, " ");
          if (trimmed) {
            detail = trimmed.length > 30 ? `"${trimmed.slice(0, 30)}..."` : `"${trimmed}"`;
          }
        }

        emitBreadcrumb({
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString(),
          category: "click",
          target: selector,
          detail,
        });
      },
      true, // Capture phase
    );

    // Input tracking (Zero-credential leak: only records target name & length)
    let inputDebounceTimer: number | undefined;
    window.addEventListener(
      "input",
      (e) => {
        if (isCatchBugElement(e)) return;
        const target = e.target;
        if (
          !(target instanceof HTMLInputElement) &&
          !(target instanceof HTMLTextAreaElement) &&
          !(target instanceof HTMLSelectElement)
        ) {
          return;
        }

        const tagName = target.tagName.toLowerCase();
        const nameAttr = target.name ? `[name="${target.name}"]` : "";
        const id = target.id ? `#${target.id}` : "";
        const typeAttr = target instanceof HTMLInputElement ? `[type="${target.type}"]` : "";
        const selector = `${tagName}${id || nameAttr || typeAttr}`;
        const length = target.value ? target.value.length : 0;
        const detail = `(length: ${length})`;

        // Debounce input to avoid flooding per keystroke
        if (inputDebounceTimer) clearTimeout(inputDebounceTimer);
        inputDebounceTimer = window.setTimeout(() => {
          emitBreadcrumb({
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            category: "input",
            target: selector,
            detail,
          });
        }, 500);
      },
      true,
    );

    // Navigation tracking (SPA routing & history)
    const trackNavigation = (url: string) => {
      try {
        const parsed = new URL(url, window.location.origin);
        emitBreadcrumb({
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString(),
          category: "navigation",
          target: parsed.pathname || "/",
          detail: parsed.search ? `query: ${parsed.search.slice(0, 25)}` : undefined,
        });
      } catch {
        emitBreadcrumb({
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString(),
          category: "navigation",
          target: url,
        });
      }
    };

    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      const url = args[2];
      if (url) trackNavigation(String(url));
      return originalPushState.apply(this, args);
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      const url = args[2];
      if (url) trackNavigation(String(url));
      return originalReplaceState.apply(this, args);
    };

    window.addEventListener("popstate", () => {
      trackNavigation(window.location.href);
    });

    window.addEventListener("hashchange", () => {
      trackNavigation(window.location.href);
    });
  },
});

declare global {
  interface XMLHttpRequest {
    _stagebugMethod?: string;
    _stagebugUrl?: string;
    _stagebugRequestBody?: string;
  }
}
