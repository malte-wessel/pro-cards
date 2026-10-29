// The Home Assistant weather pictures and image icons (the weather card, the poster's weather
// kind): the pictures' parts take Home Assistant's weather icon colours, with its defaults.
export const STYLE_WEATHER_PICTURES = `
  /* the Home Assistant weather pictures and image icons */
  .wpic { display: block; width: var(--fe-icon, 100%); height: var(--fe-icon, 100%); object-fit: contain; }
  .lead.picture .shape { background: transparent; }
  .lead.picture .wpic { width: 100%; height: 100%; }
  .wpic .rain { fill: var(--weather-icon-rain-color, #30b3ff); }
  .wpic .sun { fill: var(--weather-icon-sun-color, #fdd93c); }
  .wpic .moon { fill: var(--weather-icon-moon-color, #fcf497); }
  .wpic .cloud-back { fill: var(--weather-icon-cloud-back-color, #d4d4d4); }
  .wpic .cloud-front { fill: var(--weather-icon-cloud-front-color, #f9f9f9); }
  .wpic .snow { fill: var(--weather-icon-snow-color, #f9f9f9); stroke: var(--weather-icon-snow-stroke-color, #d4d4d4); stroke-width: 1; paint-order: stroke; }
`;
