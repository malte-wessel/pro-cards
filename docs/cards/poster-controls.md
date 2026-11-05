---
title: Moved to Controls
search: false
---

<script setup>
// this page moved: the tile and the poster share their topic pages now
import { onMounted } from "vue";
import { withBase } from "vitepress";
onMounted(() => location.replace(withBase("/cards/controls") + location.hash));
</script>

# Moved to Controls

This page is now part of [Controls](/cards/controls), which covers the tile and the poster together.
