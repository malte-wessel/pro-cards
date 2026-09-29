import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import LiveCard from "./LiveCard.vue";
import DashboardGrid from "./DashboardGrid.vue";
import Playground from "./Playground.vue";
import "./ha.css";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("LiveCard", LiveCard);
    app.component("DashboardGrid", DashboardGrid);
    app.component("Playground", Playground);
  },
} satisfies Theme;
