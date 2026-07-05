// Construit data/vault.enc : reprend le contenu du vault existant puis
// superpose les fichiers JSON en clair présents localement (produits par
// fetch-stats, fetch-messages ou prepare-daily-post). Seul le vault chiffré
// est commité dans le repo ; les JSON en clair restent locaux (gitignore).
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { encryptVault, decryptVault } from "./vault.mjs";

const password = process.env.DASHBOARD_PASSWORD;
if (!password) {
  console.error("DASHBOARD_PASSWORD est requis.");
  process.exit(1);
}

const dataDir = path.join(process.cwd(), "data");
const VAULT_PATH = path.join(dataDir, "vault.enc");

const SOURCES = {
  history: "history.json",
  latest: "latest.json",
  messages: "messages.json",
  plan: "content-plan.json",
};

let bundle = {};
try {
  bundle = decryptVault(password, await readFile(VAULT_PATH, "utf-8"));
} catch {
  bundle = {};
}

const updated = [];
for (const [key, file] of Object.entries(SOURCES)) {
  try {
    bundle[key] = JSON.parse(await readFile(path.join(dataDir, file), "utf-8"));
    updated.push(key);
  } catch {
    // fichier absent localement : on garde la version du vault
  }
}

bundle.built_at = new Date().toISOString();
await writeFile(VAULT_PATH, encryptVault(password, bundle));
console.log(`Vault chiffré écrit (sections mises à jour : ${updated.join(", ") || "aucune"}).`);
