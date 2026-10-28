<script setup lang="ts">
// The home page's way to the Showcase: the dashboards of `dashboards` in docs/index.md, each a
// link to its page with a line on what it shows.
import { computed } from "vue";
import { useData, withBase } from "vitepress";

interface Dashboard {
  title: string;
  text?: string;
  link: string;
}

const { frontmatter } = useData();
const dashboards = computed(() => {
  const d = frontmatter.value.dashboards;
  return Array.isArray(d) ? (d as Dashboard[]) : [];
});
</script>

<template>
  <section v-if="dashboards.length" class="dashboards">
    <header class="head">
      <h2 class="headline">See it all together.</h2>
      <p class="lead">
        Whole dashboards built from Pro Cards, running against the same simulated home.
      </p>
    </header>
    <div class="grid">
      <a v-for="d in dashboards" :key="d.link" class="item" :href="withBase(d.link)">
        <span class="title">{{ d.title }}</span>
        <span v-if="d.text" class="text">{{ d.text }}</span>
        <span class="open">Open dashboard →</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.dashboards {
  margin: 0 0 96px;
}
/* .vp-doc styles every h2 / p / a on the page; these reset what they set */
.head {
  max-width: 720px;
  margin: 0 auto 40px;
  text-align: center;
}
.head .headline {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 36px;
  line-height: 44px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
}
.head .lead {
  margin: 16px 0 0;
  font-size: 18px;
  line-height: 28px;
  color: var(--vp-c-text-2);
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.vp-doc .item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  text-decoration: none;
  transition: border-color 0.2s;
}
.vp-doc .item:hover {
  border-color: var(--vp-c-brand-1);
}
.title {
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.text {
  flex: 1;
  font-size: 15px;
  line-height: 22px;
  color: var(--vp-c-text-2);
}
.open {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}
@media (max-width: 959px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 639px) {
  .head .headline {
    font-size: 28px;
    line-height: 34px;
  }
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
