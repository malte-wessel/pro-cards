<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import BrandHero from "./BrandHero.vue";
import HeroDashboard from "./HeroDashboard.vue";
import HeroSwipe from "./HeroSwipe.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-info-before><HeroDashboard /></template>
    <template #home-hero-info><BrandHero /></template>
    <template #home-hero-actions-after><HeroSwipe /></template>
  </Layout>
</template>
