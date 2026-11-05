---
title: Moved to Look
search: false
---

<script setup>
// this page moved: the tile and the poster share their topic pages now
import { onMounted } from "vue";
import { withBase } from "vitepress";
onMounted(() => location.replace(withBase("/cards/look") + location.hash));
</script>

# Moved to Look

This page is now part of [Look](/cards/look), which covers the tile and the poster together.
