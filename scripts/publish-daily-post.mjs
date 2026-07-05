import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { createGraphClient } from "./graph-client.mjs";

const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID, GITHUB_REPOSITORY } = process.env;

if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
  console.error("INSTAGRAM_ACCESS_TOKEN et INSTAGRAM_ACCOUNT_ID sont requis.");
  process.exit(1);
}

const PENDING_PATH = path.join(process.cwd(), "data", ".pending-post.json");
const STATE_PATH = path.join(process.cwd(), "data", "content-state.json");

const { graphPost, graphGet } = createGraphClient(INSTAGRAM_ACCESS_TOKEN);

function publicImageUrl(relativePath) {
  return `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/${relativePath}`;
}

async function main() {
  const pending = JSON.parse(await readFile(PENDING_PATH, "utf-8"));

  const imageUrl = publicImageUrl(pending.image_path);
  console.log(`Publication du jour ${pending.jour} avec l'image ${imageUrl}`);

  const container = await graphPost(`${INSTAGRAM_ACCOUNT_ID}/media`, {
    image_url: imageUrl,
    caption: pending.caption,
  });
  const published = await graphPost(`${INSTAGRAM_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
  });
  const permalinkData = await graphGet(published.id, { fields: "permalink" });

  console.log(`Publié : ${permalinkData.permalink}`);

  await writeFile(
    STATE_PATH,
    JSON.stringify(
      {
        next_row_index: pending.next_row_index,
        last_posted_slot_key: pending.slot_key,
        last_jour_posted: pending.jour,
        last_permalink: permalinkData.permalink,
        last_posted_at: new Date().toISOString(),
      },
      null,
      2
    )
  );

  await unlink(PENDING_PATH);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
