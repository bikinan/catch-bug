import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  srcDir: "src",
  manifest: {
    name: "CatchBug",
    description: "Lightweight staging bug reporter and diagnostics companion",
    permissions: ["activeTab", "storage"],
    host_permissions: ["<all_urls>"],
    web_accessible_resources: [
      {
        resources: ["icon/*"],
        matches: ["<all_urls>"],
      },
    ],
  },
});
