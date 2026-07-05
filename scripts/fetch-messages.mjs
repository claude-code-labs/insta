import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createGraphClient } from "./graph-client.mjs";

const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID } = process.env;

if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
  console.error("INSTAGRAM_ACCESS_TOKEN et INSTAGRAM_ACCOUNT_ID sont requis.");
  process.exit(1);
}

const { graphGet } = createGraphClient(INSTAGRAM_ACCESS_TOKEN);

async function findPageForAccount() {
  const accounts = await graphGet("me/accounts", {
    fields: "id,name,access_token,instagram_business_account",
  });
  const page = (accounts.data ?? []).find(
    (p) => p.instagram_business_account?.id === INSTAGRAM_ACCOUNT_ID
  );
  if (!page) {
    throw new Error("Aucune Page Facebook liée à ce compte Instagram trouvée sur ce token.");
  }
  return page;
}

async function fetchConversations(page) {
  const { graphGet: graphGetAsPage } = createGraphClient(page.access_token);
  const conversations = await graphGetAsPage(`${page.id}/conversations`, {
    platform: "instagram",
    fields: "participants,updated_time",
    limit: "20",
  });

  const results = [];
  for (const conv of conversations.data ?? []) {
    try {
      const detail = await graphGetAsPage(conv.id, {
        fields: "messages.limit(1){message,from,created_time}",
      });
      const lastMessage = detail.messages?.data?.[0];
      const participant = conv.participants?.data?.find((p) => p.id !== page.id);
      results.push({
        id: conv.id,
        participant: participant?.username ?? participant?.name ?? "Utilisateur Instagram",
        updated_time: conv.updated_time,
        last_message: lastMessage
          ? {
              text: lastMessage.message ?? "",
              from: lastMessage.from?.username ?? lastMessage.from?.id,
              created_time: lastMessage.created_time,
            }
          : null,
      });
    } catch (err) {
      console.warn(`Impossible de lire la conversation ${conv.id}: ${err.message}`);
    }
  }
  return results;
}

async function main() {
  let conversations = [];
  try {
    const page = await findPageForAccount();
    conversations = await fetchConversations(page);
  } catch (err) {
    console.warn(`Messages indisponibles : ${err.message}`);
  }

  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, "messages.json"),
    JSON.stringify({ fetched_at: new Date().toISOString(), conversations }, null, 2)
  );

  console.log(`${conversations.length} conversation(s) enregistrée(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
