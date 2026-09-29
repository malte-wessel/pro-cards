<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import BrandHero from "./BrandHero.vue";
import BrandVisual from "./BrandVisual.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-info><BrandHero /></template>
    <template #home-hero-image><BrandVisual /></template>
  </Layout>
</template>
