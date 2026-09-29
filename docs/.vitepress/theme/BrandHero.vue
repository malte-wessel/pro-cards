<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

// The home hero's name, text and tagline stay in docs/index.md; this only renders the name
// as the two-tone wordmark: the first word in Signal Blue, the rest in Ink (white in dark mode).
const { frontmatter } = useData();
const hero = computed(() => frontmatter.value.hero ?? {});
const words = computed(() => String(hero.value.name ?? "").split(" "));
const first = computed(() => words.value[0]);
const rest = computed(() => (words.value.length > 1 ? " " + words.value.slice(1).join(" ") : ""));
</script>

<template>
  <div class="brand-hero">
    <h1 class="heading">
      <span v-if="hero.name" class="name"
        ><span class="pro">{{ first }}</span
        >{{ rest }}</span
      >
      <span v-if="hero.text" class="text">{{ hero.text }}</span>
    </h1>
    <p v-if="hero.tagline" class="tagline">{{ hero.tagline }}</p>
  </div>
</template>

<style scoped>
/* Mirrors VPHero's .heading/.name/.text/.tagline, whose scoped styles do not reach slot content. */
.heading {
  display: flex;
  flex-direction: column;
}
.name,
.text {
  width: fit-content;
  max-width: 392px;
  letter-spacing: -0.4px;
  line-height: 40px;
  font-size: 32px;
  font-weight: 700;
  white-space: pre-wrap;
}
.name {
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0e1a2b;
}
.name .pro {
  color: #2f5bf5;
}
.dark .name {
  color: #ffffff;
}
.dark .name .pro {
  color: #4fb4ff;
}
.tagline {
  padding-top: 8px;
  max-width: 392px;
  line-height: 28px;
  font-size: 18px;
  font-weight: 500;
  white-space: pre-wrap;
  color: var(--vp-c-text-2);
}
.VPHero.has-image .name,
.VPHero.has-image .text,
.VPHero.has-image .tagline {
  margin: 0 auto;
}
@media (min-width: 640px) {
  .name,
  .text {
    max-width: 576px;
    line-height: 56px;
    font-size: 48px;
  }
  .tagline {
    padding-top: 12px;
    max-width: 576px;
    line-height: 32px;
    font-size: 20px;
  }
}
@media (min-width: 960px) {
  .name,
  .text {
    line-height: 64px;
    font-size: 56px;
  }
  .tagline {
    line-height: 36px;
    font-size: 24px;
  }
  .VPHero.has-image .name,
  .VPHero.has-image .text,
  .VPHero.has-image .tagline {
    margin: 0;
  }
}
</style>
