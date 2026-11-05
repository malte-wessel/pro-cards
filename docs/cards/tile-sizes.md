---
title: Moved to Sizes
search: false
---

<script setup>
// this page moved: the tile and the poster share their topic pages now
import { onMounted } from "vue";
import { withBase } from "vitepress";
onMounted(() => location.replace(withBase("/cards/sizes") + location.hash));
</script>

# Moved to Sizes

This page is now part of [Sizes](/cards/sizes), which covers the tile and the poster together.
