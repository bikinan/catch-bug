import OverlayPanel from "@/components/OverlayPanel.vue";
import { addBreadcrumb } from "@/utils/breadcrumbStore";
import { addLog, enforceLogLimit } from "@/utils/logStore";
import {
  settingsState,
  loadSettings,
  isDomainAllowed,
  initSettingsListener,
} from "@/utils/settingsStore";
import type { PostMessagePayload } from "@/utils/types";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // 1. Muat preferensi pengaturan (Master switch, domain whitelist, masking)
    await loadSettings();

    const isSiteAllowed = () => {
      if (typeof window === "undefined") return true;
      return settingsState.isEnabled && isDomainAllowed(window.location.href, settingsState);
    };

    // 2. Tangkap log & breadcrumb hanya jika ekstensi aktif pada halaman ini
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      const data = event.data as PostMessagePayload;
      if (data?.source === "CATCHBUG_INTERCEPTOR") {
        if (!isSiteAllowed()) return;

        if (data.kind === "breadcrumb") {
          addBreadcrumb(data.payload);
        } else {
          addLog(data.payload);
        }
      }
    });

    let shadowContainer: HTMLElement | null = null;

    const updateOverlayVisibility = () => {
      if (shadowContainer) {
        shadowContainer.style.display = isSiteAllowed() ? "" : "none";
      }
    };

    // 3. Pasang listener storage untuk sinkronisasi instan saat user mengubah setting di Popup
    initSettingsListener((newSettings) => {
      updateOverlayVisibility();
      enforceLogLimit(newSettings.maxLogs);
    });

    // 4. Inisialisasi Shadow Root UI
    const ui = await createShadowRootUi(ctx, {
      name: "catchbug-overlay-root",
      position: "inline",
      anchor: "body",
      append: "first",
      onMount: (container) => {
        shadowContainer = container;
        updateOverlayVisibility();

        const app = createApp(OverlayPanel);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
        shadowContainer = null;
      },
    });

    ui.mount();
  },
});
