// First-time setup of the dev Home Assistant, idempotent: finishes onboarding with the dev user and
// registers the bundle (dist/, mounted at /config/www/pro-cards) as a dashboard resource, through
// the same REST and websocket calls the frontend uses. Node 22, no deps.
const BASE = process.env.HA_URL ?? "http://localhost:8123";
const USERNAME = process.env.HASS_USERNAME ?? "dev";
const PASSWORD = process.env.HASS_PASSWORD ?? "dev";
const CLIENT_ID = `${BASE}/`;
const RESOURCE = "/local/pro-cards/pro-cards.js";

async function call(path, { method = "GET", body, token, form } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body && !form) headers["content-type"] = "application/json";
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: form ? new URLSearchParams(body) : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function tokenFromCode(code) {
  const res = await call("/auth/token", {
    method: "POST",
    form: true,
    body: { grant_type: "authorization_code", code, client_id: CLIENT_ID },
  });
  return res.access_token;
}

async function onboard() {
  // Home Assistant removes the onboarding endpoint once onboarding is complete.
  const steps = await call("/api/onboarding").catch((err) => {
    if (String(err.message).includes("404")) return [];
    throw err;
  });
  const pending = new Set(steps.filter((s) => !s.done).map((s) => s.step));
  if (pending.size === 0) return null;
  let token;
  if (pending.has("user")) {
    const res = await call("/api/onboarding/users", {
      method: "POST",
      body: {
        client_id: CLIENT_ID,
        name: USERNAME,
        username: USERNAME,
        password: PASSWORD,
        language: "en",
      },
    });
    token = await tokenFromCode(res.auth_code);
    console.log(`created user ${USERNAME}`);
  } else {
    token = await login();
  }
  if (pending.has("core_config"))
    await call("/api/onboarding/core_config", { method: "POST", token, body: {} });
  if (pending.has("analytics"))
    await call("/api/onboarding/analytics", { method: "POST", token, body: {} });
  if (pending.has("integration")) {
    await call("/api/onboarding/integration", {
      method: "POST",
      token,
      body: { client_id: CLIENT_ID, redirect_uri: CLIENT_ID },
    });
  }
  console.log("onboarding done");
  return token;
}

async function login() {
  const flow = await call("/auth/login_flow", {
    method: "POST",
    body: { client_id: CLIENT_ID, handler: ["homeassistant", null], redirect_uri: CLIENT_ID },
  });
  const res = await call(`/auth/login_flow/${flow.flow_id}`, {
    method: "POST",
    body: { client_id: CLIENT_ID, username: USERNAME, password: PASSWORD },
  });
  if (res.type !== "create_entry")
    throw new Error(`login failed: ${JSON.stringify(res).slice(0, 200)}`);
  return tokenFromCode(res.result);
}

/** A websocket session: `send(message)` resolves with the result. */
async function connect(token) {
  const ws = new WebSocket(BASE.replace(/^http/, "ws") + "/api/websocket");
  const queue = [];
  const waiters = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (waiters.length) waiters.shift()(m);
    else queue.push(m);
  };
  const next = () =>
    queue.length ? Promise.resolve(queue.shift()) : new Promise((r) => waiters.push(r));
  await new Promise((r) => (ws.onopen = r));
  await next(); // auth_required
  ws.send(JSON.stringify({ type: "auth", access_token: token }));
  await next(); // auth_ok
  let id = 1;
  return {
    async send(message) {
      ws.send(JSON.stringify({ id: id++, ...message }));
      const res = await next();
      if (res.success === false) throw new Error(`${message.type}: ${res.error?.message}`);
      return res.result;
    },
    close: () => ws.close(),
  };
}

// the bundle as a dashboard resource (Settings → Dashboards → Resources), once
async function ensureResource(token) {
  const c = await connect(token);
  const resources = await c.send({ type: "lovelace/resources" });
  if (resources.some((r) => r.url.split("?")[0] === RESOURCE)) {
    console.log(`resource ${RESOURCE}: present`);
  } else {
    await c.send({ type: "lovelace/resources/create", res_type: "module", url: RESOURCE });
    console.log(`resource ${RESOURCE}: added`);
  }
  c.close();
}

const onboarded = await onboard();
const token = onboarded ?? (await login());
await ensureResource(token);
console.log(`ready: ${BASE}  (user ${USERNAME} / ${PASSWORD})`);
