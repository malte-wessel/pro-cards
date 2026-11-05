---
title: Moved to Kinds
search: false
---

<script setup>
// this page moved: the tile and the poster share their topic pages now
import { onMounted } from "vue";
import { withBase } from "vitepress";
onMounted(() => location.replace(withBase("/cards/kinds") + location.hash));
</script>

# Moved to Kinds

This page is now part of [Kinds](/cards/kinds), which covers the tile and the poster together.
