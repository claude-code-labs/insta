// Échange le token longue durée actuel contre un nouveau token de 60 jours.
// Nécessite : FB_APP_ID, FB_APP_SECRET, INSTAGRAM_ACCESS_TOKEN en variables d'environnement.
// Écrit le nouveau token sur stdout (rien d'autre ne doit être loggé ici).

import { GRAPH_BASE } from "./graph-client.mjs";

const appId = process.env.FB_APP_ID;
const appSecret = process.env.FB_APP_SECRET;
const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN;

if (!appId || !appSecret || !currentToken) {
  console.error("FB_APP_ID, FB_APP_SECRET et INSTAGRAM_ACCESS_TOKEN sont requis.");
  process.exit(1);
}

const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
url.searchParams.set("grant_type", "fb_exchange_token");
url.searchParams.set("client_id", appId);
url.searchParams.set("client_secret", appSecret);
url.searchParams.set("fb_exchange_token", currentToken);

const res = await fetch(url);
const body = await res.json();
if (!res.ok || !body.access_token) {
  console.error(`Échec du refresh du token: ${JSON.stringify(body.error ?? body)}`);
  process.exit(1);
}

process.stdout.write(body.access_token);
