import { reactive } from "vue";

export interface ScreenshotState {
  dataUrl: string | null;
  timestamp: string | null;
  isCapturing: boolean;
}

export const screenshotState = reactive<ScreenshotState>({
  dataUrl: null,
  timestamp: null,
  isCapturing: false,
});

export const setScreenshot = (dataUrl: string) => {
  screenshotState.dataUrl = dataUrl;
  screenshotState.timestamp = new Date().toLocaleTimeString();
};

export const clearScreenshot = () => {
  screenshotState.dataUrl = null;
  screenshotState.timestamp = null;
};

export const downloadScreenshot = (filename?: string) => {
  if (!screenshotState.dataUrl) return;
  const link = document.createElement("a");
  const timeSlug = new Date().toISOString().replace(/[:.]/g, "-");
  link.download = filename || `catchbug-screenshot-${timeSlug}.png`;
  link.href = screenshotState.dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
