<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";

// the params of docs/changelog/[page].paths.ts: this page's index and every page's version range
const { params } = useData();
const index = computed(() => (params.value?.index as number) ?? 0);
const ranges = computed(() => (params.value?.ranges as string[]) ?? []);
const href = (i: number) => withBase(i === 0 ? "/changelog/" : `/changelog/${i + 1}`);
</script>

<template>
  <nav v-if="ranges.length > 1" class="changelog-pager" aria-label="Changelog pages">
    <ol class="pages">
      <li v-for="(range, i) in ranges" :key="i">
        <a
          :href="href(i)"
          :class="{ current: i === index }"
          :aria-current="i === index ? 'page' : undefined"
        >
          <span class="number">{{ i + 1 }}</span>
          <span class="range">{{ range }}</span>
        </a>
      </li>
    </ol>
    <div class="steps">
      <a v-if="index > 0" class="step prev" :href="href(index - 1)">
        <span class="desc">Newer releases</span>
        <span class="title">{{ ranges[index - 1] }}</span>
      </a>
      <a v-if="index < ranges.length - 1" class="step next" :href="href(index + 1)">
        <span class="desc">Older releases</span>
        <span class="title">{{ ranges[index + 1] }}</span>
      </a>
    </div>
  </nav>
</template>

<style scoped>
.changelog-pager {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}
.pages {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.pages li {
  margin: 0;
}
.pages a {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  text-decoration: none;
  transition: border-color 0.25s;
}
.pages a:hover {
  border-color: var(--vp-c-brand-1);
}
.pages a.current {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.number {
  font-weight: 600;
}
.range {
  font-size: 12px;
}
.steps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}
.step {
  display: flex;
  flex-direction: column;
  padding: 11px 16px 13px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.25s;
}
.step:hover {
  border-color: var(--vp-c-brand-1);
}
.step.next {
  grid-column: 2;
  text-align: right;
}
.desc {
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
.title {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}
@media (max-width: 639px) {
  .steps {
    grid-template-columns: 1fr;
  }
  .step.next {
    grid-column: 1;
  }
}
</style>
