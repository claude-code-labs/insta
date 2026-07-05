import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGraphClient } from "./graph-client.mjs";

const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID, GITHUB_REPOSITORY } = process.env;

if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
  console.error("INSTAGRAM_ACCESS_TOKEN et INSTAGRAM_ACCOUNT_ID sont requis.");
  process.exit(1);
}

const { graphPost, graphGet } = createGraphClient(INSTAGRAM_ACCESS_TOKEN);
const queuePath = path.join(process.cwd(), "schedule", "queue.json");

function publicImageUrl(relativePath) {
  return `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/${relativePath}`;
}

async function publishEntry(entry) {
  const imageUrl = publicImageUrl(entry.image);
  const container = await graphPost(`${INSTAGRAM_ACCOUNT_ID}/media`, {
    image_url: imageUrl,
    caption: entry.caption ?? "",
  });
  const published = await graphPost(`${INSTAGRAM_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
  });
  const permalinkData = await graphGet(published.id, { fields: "permalink" });
  return { mediaId: published.id, permalink: permalinkData.permalink };
}

async function main() {
  let queue = [];
  try {
    queue = JSON.parse(await readFile(queuePath, "utf-8"));
  } catch {
    console.log("Aucune file de publication (schedule/queue.json absent ou vide).");
    return;
  }

  const now = new Date();
  let changed = false;

  for (const entry of queue) {
    if (entry.status !== "pending") continue;
    if (new Date(entry.scheduled_for) > now) continue;

    console.log(`Publication de "${entry.id}"...`);
    try {
      const result = await publishEntry(entry);
      entry.status = "published";
      entry.published_at = now.toISOString();
      entry.permalink = result.permalink;
    } catch (err) {
      entry.status = "failed";
      entry.error = err.message;
      console.error(`Échec pour "${entry.id}": ${err.message}`);
    }
    changed = true;
  }

  if (changed) {
    await writeFile(queuePath, JSON.stringify(queue, null, 2));
    console.log("File de publication mise à jour.");
  } else {
    console.log("Rien à publier pour le moment.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
