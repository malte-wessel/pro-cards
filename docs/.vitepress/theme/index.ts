import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import LiveCard from "./LiveCard.vue";
import DashboardGrid from "./DashboardGrid.vue";
import Playground from "./Playground.vue";
import ChangelogPager from "./ChangelogPager.vue";
import FeatureRows from "./FeatureRows.vue";
import DashboardLinks from "./DashboardLinks.vue";
import Layout from "./Layout.vue";
import "./ha.css";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("LiveCard", LiveCard);
    app.component("DashboardGrid", DashboardGrid);
    app.component("Playground", Playground);
    app.component("ChangelogPager", ChangelogPager);
    app.component("FeatureRows", FeatureRows);
    app.component("DashboardLinks", DashboardLinks);
  },
} satisfies Theme;
