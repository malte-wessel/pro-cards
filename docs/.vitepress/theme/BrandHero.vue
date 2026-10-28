<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";

// The home hero's name, text and tagline stay in docs/index.md. The name is a small brand row on
// top (the logo and the wordmark, Ink, white in dark mode); the text is the headline.
const { frontmatter } = useData();
const hero = computed(() => frontmatter.value.hero ?? {});
</script>

<template>
  <div class="brand-hero">
    <div v-if="hero.name" class="brand">
      <img class="mark" :src="withBase('/logo.svg')" alt="" />
      <span class="name">{{ hero.name }}</span>
    </div>
    <h1 v-if="hero.text" class="headline">{{ hero.text }}</h1>
    <p v-if="hero.tagline" class="tagline">{{ hero.tagline }}</p>
  </div>
</template>

<style scoped>
/* VPHero's scoped styles do not reach slot content. */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.mark {
  width: 28px;
  height: 28px;
}
.name {
  line-height: 28px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0e1a2b;
}
.dark .name {
  color: #ffffff;
}
.headline {
  max-width: 392px;
  line-height: 44px;
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-wrap: balance;
  color: var(--vp-c-text-1);
}
.tagline {
  padding-top: 16px;
  max-width: 392px;
  line-height: 24px;
  font-size: 16px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
@media (min-width: 640px) {
  .brand {
    margin-bottom: 20px;
  }
  .mark {
    width: 32px;
    height: 32px;
  }
  .name {
    line-height: 32px;
    font-size: 22px;
  }
  .headline {
    max-width: 560px;
    line-height: 54px;
    font-size: 48px;
  }
  .tagline {
    padding-top: 20px;
    max-width: 576px;
    line-height: 28px;
    font-size: 18px;
  }
}
@media (min-width: 960px) {
  .headline {
    max-width: 640px;
    line-height: 62px;
    font-size: 56px;
  }
}
</style>
