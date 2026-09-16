<script lang="ts" setup>
import PopupControlCenter from "@/components/PopupControlCenter.vue";
</script>

<template>
  <div class="popup-container">
    <PopupControlCenter />
  </div>
</template>

<style scoped>
.popup-container {
  width: 380px;
  min-height: 240px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  background: #090d16;
}
</style>
