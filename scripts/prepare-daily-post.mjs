import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { renderHookImage } from "./render-hook-image.mjs";
import { hashtagsForPilier } from "./hashtag-pool.mjs";

const EXCEL_PATH = path.join(process.cwd(), "texte.xlsx");
const STATE_PATH = path.join(process.cwd(), "data", "content-state.json");
const PENDING_PATH = path.join(process.cwd(), "data", ".pending-post.json");
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

function parisSlot(now) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour").value);
  const minute = Number(parts.find((p) => p.type === "minute").value);
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  if (hour === 12 && minute < 15) return { slot: "midi", dateKey };
  if (hour === 18 && minute < 15) return { slot: "soir", dateKey };
  return null;
}

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf-8"));
  } catch {
    return { next_row_index: 0, last_posted_slot_key: null };
  }
}

function setOutput(name, value) {
  if (GITHUB_OUTPUT) {
    return writeFile(GITHUB_OUTPUT, `${name}=${value}\n`, { flag: "a" });
  }
}

async function main() {
  const slotInfo = parisSlot(new Date());
  if (!slotInfo) {
    console.log("Hors créneau (12h ou 18h heure de Paris). Rien à faire.");
    await setOutput("due", "false");
    return;
  }

  const state = await loadState();
  const slotKey = `${slotInfo.dateKey}_${slotInfo.slot}`;
  if (state.last_posted_slot_key === slotKey) {
    console.log(`Créneau ${slotKey} déjà traité.`);
    await setOutput("due", "false");
    return;
  }

  const workbook = XLSX.read(readFileSync(EXCEL_PATH), { type: "buffer" });
  const sheet = workbook.Sheets["Contenus 200 jours"];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const row = rows[state.next_row_index];
  if (!row) {
    console.log("Toutes les phrases du fichier ont été publiées.");
    await setOutput("due", "false");
    return;
  }

  const hookCourt = String(row["Hook court"] ?? "").trim();
  const phrasePrincipale = String(row["Phrase principale"] ?? "").trim();
  const cta = String(row["CTA"] ?? "").trim();
  const pilier = String(row["Pilier"] ?? "").trim();
  const jour = row["Jour"];

  const hashtags = hashtagsForPilier(pilier);
  const caption = [phrasePrincipale, cta, hashtags.join(" ")].filter(Boolean).join("\n\n");

  const imageBuffer = await renderHookImage(hookCourt || phrasePrincipale);
  const mediaDir = path.join(process.cwd(), "schedule", "media", "generated");
  await mkdir(mediaDir, { recursive: true });
  const imageRelPath = `schedule/media/generated/jour-${jour}.jpg`;
  await writeFile(path.join(process.cwd(), imageRelPath), imageBuffer);

  await mkdir(path.dirname(PENDING_PATH), { recursive: true });
  await writeFile(
    PENDING_PATH,
    JSON.stringify(
      {
        jour,
        pilier,
        slot_key: slotKey,
        image_path: imageRelPath,
        caption,
        next_row_index: state.next_row_index + 1,
      },
      null,
      2
    )
  );

  console.log(`Post préparé pour le jour ${jour} (${pilier}) — créneau ${slotInfo.slot}.`);
  await setOutput("due", "true");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
