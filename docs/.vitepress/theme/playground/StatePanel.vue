<script setup lang="ts">
// The states of the entities the card names, set by hand: a switch for what turns on and off, a
// number for a numeric state, a select for a select's options or a thermostat's mode, text else.
// The demo home's own drift can be paused, and Reset puts back what was changed here.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { loadRuntime } from "../mount.ts";
import { entitiesOf } from "./store.ts";

const props = defineProps<{ cards: unknown[] }>();

type Entity = { entity_id: string; state: string; attributes: Record<string, unknown> };
interface World {
  get(id: string): Entity | undefined;
  set(id: string, state?: string | number, attributes?: Record<string, unknown>): void;
  subscribe(fn: () => void): () => void;
  start(): void;
  stop(): void;
}
const world = ref<World | null>(null);
const tick = ref(0);
const frozen = ref(false);
// the states as they were before this panel changed them
const before = new Map<string, Entity>();
let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  await loadRuntime();
  const w = (await import("../ha-shim/world.ts")).world as unknown as World;
  world.value = w;
  unsubscribe = w.subscribe(() => tick.value++);
});
onBeforeUnmount(() => {
  unsubscribe?.();
  if (frozen.value) world.value?.start();
});

const ids = computed(() => {
  void tick.value;
  const w = world.value;
  return w ? entitiesOf(props.cards, (id) => !!w.get(id)) : [];
});
const ON_OFF = new Set([
  "light", "switch", "fan", "input_boolean", "binary_sensor", "automation", "siren", "humidifier",
]);
const domain = (id: string) => id.split(".")[0];
const stateOf = (id: string) => {
  void tick.value;
  return world.value?.get(id);
};
const kindOf = (id: string): "switch" | "number" | "select" | "text" => {
  const st = stateOf(id);
  if (!st) return "text";
  if (ON_OFF.has(domain(id)) && (st.state === "on" || st.state === "off")) return "switch";
  if (optionsOf(id).length) return "select";
  if (st.state !== "" && Number.isFinite(Number(st.state))) return "number";
  return "text";
};
const optionsOf = (id: string): string[] => {
  const a = stateOf(id)?.attributes ?? {};
  const list = domain(id) === "climate" ? a.hvac_modes : a.options;
  return Array.isArray(list) ? list.map(String) : [];
};
const nameOf = (id: string) => String(stateOf(id)?.attributes.friendly_name ?? id);

const set = (id: string, value: string | number) => {
  const w = world.value;
  const st = w?.get(id);
  if (!w || !st) return;
  if (!before.has(id)) before.set(id, st);
  w.set(id, value);
  changed.value = before.size;
};
const changed = ref(0);
const reset = () => {
  for (const [id, st] of before) world.value?.set(id, st.state, st.attributes);
  before.clear();
  changed.value = 0;
};
const freeze = (on: boolean) => {
  frozen.value = on;
  if (on) world.value?.stop();
  else world.value?.start();
};
</script>

<template>
  <div class="states">
    <div class="head">
      <label class="freeze" title="Stop the demo home's values from drifting">
        <input
          type="checkbox"
          :checked="frozen"
          @change="freeze(($event.target as HTMLInputElement).checked)"
        />
        Freeze the demo home
      </label>
      <button type="button" class="tb-btn small" :disabled="!changed" @click="reset">Reset</button>
    </div>
    <p v-if="!ids.length" class="empty">The card names no entity of the demo home.</p>
    <div v-for="id in ids" :key="id" class="row">
      <div class="name">
        <span class="label">{{ nameOf(id) }}</span>
        <code>{{ id }}</code>
      </div>
      <div class="control">
        <label v-if="kindOf(id) === 'switch'" class="switch">
          <input
            type="checkbox"
            :checked="stateOf(id)?.state === 'on'"
            @change="set(id, ($event.target as HTMLInputElement).checked ? 'on' : 'off')"
          />
          <span class="track"></span>
        </label>
        <select
          v-else-if="kindOf(id) === 'select'"
          :value="stateOf(id)?.state"
          @change="set(id, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="o in optionsOf(id)" :key="o" :value="o">{{ o }}</option>
        </select>
        <input
          v-else-if="kindOf(id) === 'number'"
          type="number"
          step="any"
          :value="stateOf(id)?.state"
          @change="set(id, Number(($event.target as HTMLInputElement).value))"
        />
        <input
          v-else
          type="text"
          :value="stateOf(id)?.state"
          @change="set(id, ($event.target as HTMLInputElement).value)"
        />
        <span v-if="stateOf(id)?.attributes.unit_of_measurement" class="unit">{{
          stateOf(id)?.attributes.unit_of_measurement
        }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.states {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 8px;
}
.freeze {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.empty {
  margin: 4px 0;
  color: var(--vp-c-text-2);
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-top: 1px solid var(--vp-c-divider);
}
.name {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.name .label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.name code {
  font-size: 11px;
  color: var(--vp-c-text-3);
  background: none;
  padding: 0;
}
.control {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}
.control input[type="number"],
.control input[type="text"],
.control select {
  width: 120px;
  font: 13px var(--vp-font-family-base);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.unit {
  color: var(--vp-c-text-2);
  min-width: 28px;
}
.switch {
  position: relative;
  width: 36px;
  height: 20px;
  cursor: pointer;
}
.switch input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}
.switch .track {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: var(--vp-c-default-3);
  transition: background 0.15s;
}
.switch .track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s;
}
.switch input:checked + .track {
  background: var(--vp-c-brand-1);
}
.switch input:checked + .track::after {
  transform: translateX(16px);
}
</style>
