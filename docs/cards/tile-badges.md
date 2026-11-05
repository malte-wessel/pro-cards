---
title: Moved to Badges
search: false
---

<script setup>
// this page moved: the tile and the poster share their topic pages now
import { onMounted } from "vue";
import { withBase } from "vitepress";
onMounted(() => location.replace(withBase("/cards/badges") + location.hash));
</script>

# Moved to Badges

This page is now part of [Badges](/cards/badges), which covers the tile and the poster together.
