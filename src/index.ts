// Pro Cards – bundle entry. Each card registers its own custom element(s) on import.
import "./entity-card.ts";
import "./entity-group-card.ts";
import "./entity-sections-card.ts";
import "./multi-trend-card.ts";
import "./sun-path-card.ts";
import "./illuminance-card.ts";
import "./weather-card.ts";
import "./wind-card.ts";
import "./rain-card.ts";
import "./power-flow-card.ts";

console.info(
  `%c PRO-CARDS %c v${__VERSION__} `,
  "color: white; background: #2f5bf5; font-weight: 700; border-radius: 4px 0 0 4px;",
  "color: #2f5bf5; background: white; font-weight: 700; border-radius: 0 4px 4px 0;",
);
