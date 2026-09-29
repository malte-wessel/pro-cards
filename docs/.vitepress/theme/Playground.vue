<script setup lang="ts">
import { ref, watch } from "vue";
import LiveCard from "./LiveCard.vue";
import { PRESETS } from "./presets.ts";

const preset = ref(Object.keys(PRESETS)[0]);
const text = ref(PRESETS[preset.value]);
const live = ref(text.value);
let t: ReturnType<typeof setTimeout> | undefined;
watch(text, (v) => { clearTimeout(t); t = setTimeout(() => { live.value = v; }, 350); });
watch(preset, (k) => { text.value = PRESETS[k]; });
</script>

<template>
  <div class="playground">
    <div>
      <div class="bar">
        <label
          >Preset
          <select v-model="preset">
            <option v-for="k in Object.keys(PRESETS)" :key="k" :value="k">{{ k }}</option>
          </select></label
        >
        <span style="font-size:12px;color:var(--vp-c-text-2)"
          >Edit the YAML, the card re-renders as you type.</span
        >
      </div>
      <textarea v-model="text" spellcheck="false"></textarea>
    </div>
    <LiveCard :yaml="live" width="full" />
  </div>
</template>
