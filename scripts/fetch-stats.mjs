import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createGraphClient } from "./graph-client.mjs";
import { decryptVault } from "./vault.mjs";

const {
  INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_ACCOUNT_ID,
} = process.env;

if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
  console.error("INSTAGRAM_ACCESS_TOKEN et INSTAGRAM_ACCOUNT_ID sont requis.");
  process.exit(1);
}

const { graphGet } = createGraphClient(INSTAGRAM_ACCESS_TOKEN);

async function fetchAccountInfo() {
  return graphGet(INSTAGRAM_ACCOUNT_ID, {
    fields: "name,username,biography,followers_count,follows_count,media_count,profile_picture_url",
  });
}

async function fetchMetricGroup(metric, extraParams = {}) {
  try {
    const data = await graphGet(`${INSTAGRAM_ACCOUNT_ID}/insights`, {
      metric,
      period: "day",
      ...extraParams,
    });
    const values = {};
    for (const entry of data.data ?? []) {
      values[entry.name] = entry.values?.at(-1)?.value ?? entry.total_value?.value ?? null;
    }
    return values;
  } catch (err) {
    console.warn(`Insights indisponibles pour "${metric}": ${err.message}`);
    return {};
  }
}

async function fetchInsights() {
  // "reach" est une metric time-series classique ; profile_views/accounts_engaged/
  // total_interactions exigent metric_type=total_value depuis la mise à jour de l'API.
  const [timeSeries, totalValue] = await Promise.all([
    fetchMetricGroup("reach"),
    fetchMetricGroup("profile_views,accounts_engaged,total_interactions", {
      metric_type: "total_value",
    }),
  ]);
  return { ...timeSeries, ...totalValue };
}

async function fetchRecentMedia(limit = 12) {
  const data = await graphGet(`${INSTAGRAM_ACCOUNT_ID}/media`, {
    fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
    limit: String(limit),
  });
  return data.data ?? [];
}

async function main() {
  const [account, insights, media] = await Promise.all([
    fetchAccountInfo(),
    fetchInsights(),
    fetchRecentMedia(),
  ]);

  const engagementPerPost = media.map((m) => ({
    id: m.id,
    type: m.media_type,
    timestamp: m.timestamp,
    permalink: m.permalink,
    thumbnail: m.media_type === "VIDEO" ? m.thumbnail_url ?? null : m.media_url ?? null,
    caption: (m.caption ?? "").slice(0, 120),
    likes: m.like_count ?? 0,
    comments: m.comments_count ?? 0,
    engagement_rate: account.followers_count
      ? Number((((m.like_count ?? 0) + (m.comments_count ?? 0)) / account.followers_count * 100).toFixed(2))
      : 0,
  }));

  const snapshot = {
    date: new Date().toISOString().slice(0, 10),
    fetched_at: new Date().toISOString(),
    account: {
      name: account.name,
      username: account.username,
      followers_count: account.followers_count,
      follows_count: account.follows_count,
      media_count: account.media_count,
      profile_picture_url: account.profile_picture_url ?? null,
    },
    insights,
    recent_media: engagementPerPost,
  };

  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });

  // L'historique en clair n'est plus commité : on le récupère depuis le
  // vault chiffré du repo, avec repli sur le fichier local s'il existe.
  const historyPath = path.join(dataDir, "history.json");
  let history = [];
  try {
    history = JSON.parse(await readFile(historyPath, "utf-8"));
  } catch {
    try {
      const vaultContent = await readFile(path.join(dataDir, "vault.enc"), "utf-8");
      history = decryptVault(process.env.DASHBOARD_PASSWORD, vaultContent).history ?? [];
    } catch {
      history = [];
    }
  }

  history = history.filter((entry) => entry.date !== snapshot.date);
  history.push(snapshot);
  history.sort((a, b) => a.date.localeCompare(b.date));

  await writeFile(historyPath, JSON.stringify(history, null, 2));
  await writeFile(path.join(dataDir, "latest.json"), JSON.stringify(snapshot, null, 2));

  console.log(`Snapshot du ${snapshot.date} enregistré (${history.length} jours d'historique).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
