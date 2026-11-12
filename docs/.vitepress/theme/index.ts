import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import LiveCard from "./LiveCard.vue";
import DashboardGrid from "./DashboardGrid.vue";
import Playground from "./playground/Playground.vue";
import ChangelogPager from "./ChangelogPager.vue";
import FeatureRows from "./FeatureRows.vue";
import DashboardLinks from "./DashboardLinks.vue";
import Marketplace from "./Marketplace.vue";
import Layout from "./Layout.vue";
import { holdAnchorSoon } from "./anchor.ts";
import "./ha.css";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router }) {
    // a link to a section keeps it in view while the examples above it mount (anchor.ts)
    if (typeof window !== "undefined") {
      const after = router.onAfterRouteChange;
      router.onAfterRouteChange = async (to) => {
        await after?.(to);
        holdAnchorSoon();
      };
      window.addEventListener("load", holdAnchorSoon, { once: true });
    }
    app.component("LiveCard", LiveCard);
    app.component("DashboardGrid", DashboardGrid);
    app.component("Playground", Playground);
    app.component("ChangelogPager", ChangelogPager);
    app.component("FeatureRows", FeatureRows);
    app.component("DashboardLinks", DashboardLinks);
    app.component("Marketplace", Marketplace);
  },
} satisfies Theme;
