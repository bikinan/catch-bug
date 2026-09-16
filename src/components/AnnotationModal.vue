<template>
  <div class="annotation-modal-backdrop" @click.self="emit('close')">
    <div class="annotation-modal-card">
      <!-- TOP TOOLBAR -->
      <div class="modal-header">
        <div class="tool-group">
          <span class="modal-title">🎨 Annotate Bug Screenshot</span>
          <div class="tool-buttons">
            <button
              type="button"
              :class="['btn-tool', { active: activeTool === 'rect' }]"
              @click="activeTool = 'rect'"
              title="Draw Box / Rectangle"
            >
              ⬜ Box
            </button>
            <button
              type="button"
              :class="['btn-tool', { active: activeTool === 'arrow' }]"
              @click="activeTool = 'arrow'"
              title="Draw Arrow Pointer"
            >
              ➔ Arrow
            </button>
            <button
              type="button"
              :class="['btn-tool', { active: activeTool === 'pen' }]"
              @click="activeTool = 'pen'"
              title="Freehand Pen"
            >
              ✏️ Pen
            </button>
          </div>
        </div>

        <!-- COLOR SELECTOR -->
        <div class="color-picker-group">
          <button
            v-for="color in strokeColors"
            :key="color.value"
            type="button"
            :class="['color-dot', { active: activeColor === color.value }]"
            :style="{ backgroundColor: color.value }"
            :title="color.name"
            @click="activeColor = color.value"
          />
        </div>

        <!-- ACTIONS -->
        <div class="header-actions">
          <button
            type="button"
            @click="handleUndo"
            :disabled="history.length === 0"
            class="btn-tool-action"
            title="Undo stroke"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            @click="handleReset"
            class="btn-tool-action"
            title="Reset annotations"
          >
            Reset
          </button>
          <button
            type="button"
            @click="handleSave"
            class="btn-tool-action btn-save"
            title="Save annotated screenshot"
          >
            ✓ Save
          </button>
          <button
            type="button"
            @click="emit('close')"
            class="btn-modal-close"
            title="Close without saving"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- CANVAS WORKSPACE -->
      <div class="canvas-viewport" ref="viewportRef">
        <canvas
          ref="canvasRef"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          class="annotation-canvas"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{
  imageSrc: string;
}>();

const emit = defineEmits<{
  (e: "save", dataUrl: string): void;
  (e: "close"): void;
}>();

type ToolType = "rect" | "arrow" | "pen";

const activeTool = ref<ToolType>("rect");
const activeColor = ref("#f43f5e"); // Default Bug Crimson
const strokeColors = [
  { name: "Bug Crimson", value: "#f43f5e" },
  { name: "Telemetry Amber", value: "#f59e0b" },
  { name: "Signal Emerald", value: "#10b981" },
  { name: "White Highlight", value: "#ffffff" },
];

const canvasRef = ref<HTMLCanvasElement | null>(null);
const viewportRef = ref<HTMLDivElement | null>(null);
const isDrawing = ref(false);
const startX = ref(0);
const startY = ref(0);

const baseImage = new Image();
const history = ref<ImageData[]>([]);
let snapshotBeforeStroke: ImageData | null = null;

onMounted(() => {
  baseImage.crossOrigin = "anonymous";
  baseImage.onload = () => {
    initCanvas();
  };
  baseImage.src = props.imageSrc;
});

const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  canvas.width = baseImage.naturalWidth;
  canvas.height = baseImage.naturalHeight;

  ctx.drawImage(baseImage, 0, 0);
  saveState();
};

const saveState = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  history.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
};

const handleUndo = () => {
  if (history.value.length <= 1) return;
  history.value.pop(); // Buang state terakhir
  const prevState = history.value[history.value.length - 1];
  const canvas = canvasRef.value;
  if (!canvas || !prevState) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.putImageData(prevState, 0, 0);
};

const handleReset = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0);
  history.value = [];
  saveState();
};

const getCanvasCoordinates = (e: MouseEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};

const startDrawing = (e: MouseEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  isDrawing.value = true;
  const coords = getCanvasCoordinates(e);
  startX.value = coords.x;
  startY.value = coords.y;

  snapshotBeforeStroke = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (activeTool.value === "pen") {
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = activeColor.value;
    ctx.lineWidth = Math.max(4, Math.round(canvas.width / 350));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
};

const draw = (e: MouseEvent) => {
  if (!isDrawing.value) return;
  const canvas = canvasRef.value;
  if (!canvas || !snapshotBeforeStroke) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const coords = getCanvasCoordinates(e);
  const strokeWidth = Math.max(4, Math.round(canvas.width / 350));

  if (activeTool.value === "pen") {
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  } else if (activeTool.value === "rect") {
    ctx.putImageData(snapshotBeforeStroke, 0, 0);
    ctx.strokeStyle = activeColor.value;
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(
      startX.value,
      startY.value,
      coords.x - startX.value,
      coords.y - startY.value,
    );
  } else if (activeTool.value === "arrow") {
    ctx.putImageData(snapshotBeforeStroke, 0, 0);
    drawArrow(ctx, startX.value, startY.value, coords.x, coords.y, strokeWidth);
  }
};

const drawArrow = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  width: number,
) => {
  const headLen = width * 4;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.strokeStyle = activeColor.value;
  ctx.fillStyle = activeColor.value;
  ctx.lineWidth = width;
  ctx.lineCap = "round";

  // Line body
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
};

const stopDrawing = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  snapshotBeforeStroke = null;
  saveState();
};

const handleSave = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dataUrl = canvas.toDataURL("image/png");
  emit("save", dataUrl);
  emit("close");
};
</script>

<style scoped>
.annotation-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 10, 0.88);
  backdrop-filter: blur(4px);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.annotation-modal-card {
  background: #090d16;
  border: 1px solid #374151;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  max-width: 95vw;
  max-height: 92vh;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.85);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #111827;
  border-bottom: 1px solid #1f2937;
  gap: 16px;
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title {
  font-family: Inter, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #f9fafb;
}

.tool-buttons {
  display: flex;
  gap: 4px;
}

.btn-tool {
  background: #1f293d;
  color: #9ca3af;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-tool:hover {
  background: #28354f;
  color: #f9fafb;
}

.btn-tool.active {
  background: #f43f5e;
  color: #ffffff;
  border-color: #e11d48;
}

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.12s;
  padding: 0;
}

.color-dot:hover {
  transform: scale(1.2);
}

.color-dot.active {
  border-color: #ffffff;
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-tool-action {
  background: #1f293d;
  color: #f9fafb;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-tool-action:hover:not(:disabled) {
  background: #28354f;
}

.btn-tool-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-save {
  background: #10b981;
  border-color: #059669;
  color: #ffffff;
}

.btn-save:hover {
  background: #059669;
}

.btn-modal-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-modal-close:hover {
  color: #ffffff;
  background: #374151;
}

.canvas-viewport {
  overflow: auto;
  padding: 16px;
  background: #090d16;
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: calc(92vh - 60px);
}

.annotation-canvas {
  max-width: 100%;
  max-height: calc(92vh - 90px);
  object-fit: contain;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  border: 1px solid #1f2937;
  cursor: crosshair;
  background: #000;
}
</style>
