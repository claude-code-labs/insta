import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { renderHookImage } from "./render-hook-image.mjs";
import { hashtagsForPilier, developmentForPilier } from "./caption-content.mjs";

const EXCEL_PATH = path.join(process.cwd(), "texte.xlsx");
const STATE_PATH = path.join(process.cwd(), "data", "content-state.json");
const PENDING_PATH = path.join(process.cwd(), "data", ".pending-post.json");
const PLAN_PATH = path.join(process.cwd(), "data", "content-plan.json");
// Légendes personnalisées depuis le dashboard : { "<jour>": { "caption": "..." } }
const OVERRIDES_PATH = path.join(process.cwd(), "data", "caption-overrides.json");
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

const SLOT_HOURS = { midi: 12, soir: 19 };

function parisPartsOf(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute") };
}

function parisInstant(y, mo, d, h, mi) {
  let guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  for (let i = 0; i < 3; i++) {
    const parts = parisPartsOf(new Date(guess));
    const guessedUTC = Date.UTC(parts.y, parts.mo - 1, parts.d, parts.h, parts.mi, 0);
    const target = Date.UTC(y, mo - 1, d, h, mi, 0);
    guess += target - guessedUTC;
  }
  return new Date(guess);
}

// Rattrapage : un créneau est dû dès que son heure est passée aujourd'hui,
// même si le run part en retard. On retient le créneau dû le plus récent ;
// l'anti-doublon (slot_key déjà traité) est vérifié par l'appelant.
function parisSlot(now) {
  const { y, mo, d, h } = parisPartsOf(now);
  const dateKey = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (h >= SLOT_HOURS.soir) return { slot: "soir", dateKey };
  if (h >= SLOT_HOURS.midi) return { slot: "midi", dateKey };
  return null;
}

function nextSlotAt(now) {
  const { y, mo, d } = parisPartsOf(now);
  const todayMidi = parisInstant(y, mo, d, SLOT_HOURS.midi, 0);
  const todaySoir = parisInstant(y, mo, d, SLOT_HOURS.soir, 0);
  const tomorrow = new Date(Date.UTC(y, mo - 1, d + 1));
  const tParts = parisPartsOf(tomorrow);
  const tomorrowMidi = parisInstant(tParts.y, tParts.mo, tParts.d, SLOT_HOURS.midi, 0);
  return [todayMidi, todaySoir, tomorrowMidi].find((dt) => dt.getTime() > now.getTime());
}

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf-8"));
  } catch {
    return { next_row_index: 0, last_posted_slot_key: null };
  }
}

async function loadOverrides() {
  try {
    return JSON.parse(await readFile(OVERRIDES_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function composeCaption(rows, rowIndex, overrides) {
  const row = rows[rowIndex];
  const jour = row["Jour"];
  const override = overrides?.[String(jour)]?.caption;
  if (override) return { caption: override, overridden: true };

  const phrasePrincipale = String(row["Phrase principale"] ?? "").trim();
  const cta = String(row["CTA"] ?? "").trim();
  const pilier = String(row["Pilier"] ?? "").trim();
  const rowIndexWithinPilier = rows
    .slice(0, rowIndex)
    .filter((r) => String(r["Pilier"] ?? "").trim() === pilier).length;
  const development = developmentForPilier(pilier, rowIndexWithinPilier);
  const hashtags = hashtagsForPilier(pilier);
  const caption = [phrasePrincipale, development, cta, hashtags.join(" ")]
    .filter(Boolean)
    .join("\n\n");
  return { caption, overridden: false };
}

function setOutput(name, value) {
  if (GITHUB_OUTPUT) {
    return writeFile(GITHUB_OUTPUT, `${name}=${value}\n`, { flag: "a" });
  }
}

async function writePlan(now, state, rows, overrides) {
  const upcoming = rows.slice(state.next_row_index, state.next_row_index + 4).map((r, i) => {
    const rowIndex = state.next_row_index + i;
    const { caption, overridden } = composeCaption(rows, rowIndex, overrides);
    return {
      jour: r["Jour"],
      pilier: String(r["Pilier"] ?? "").trim(),
      phrase: String(r["Phrase principale"] ?? "").trim(),
      hook: String(r["Hook court"] ?? "").trim(),
      caption,
      caption_overridden: overridden,
    };
  });

  const plan = {
    generated_at: now.toISOString(),
    total_days: rows.length,
    posted_count: state.next_row_index,
    remaining: Math.max(rows.length - state.next_row_index, 0),
    last_posted:
      state.last_jour_posted != null
        ? {
            jour: state.last_jour_posted,
            permalink: state.last_permalink ?? null,
            posted_at: state.last_posted_at ?? null,
          }
        : null,
    next_slot_at: nextSlotAt(now)?.toISOString() ?? null,
    upcoming,
  };

  await mkdir(path.dirname(PLAN_PATH), { recursive: true });
  await writeFile(PLAN_PATH, JSON.stringify(plan, null, 2));
}

async function main() {
  const now = new Date();
  const forced = process.env.FORCE_POST === "true";
  const slotInfo = parisSlot(now);

  const state = await loadState();
  const overrides = await loadOverrides();
  const workbook = XLSX.read(readFileSync(EXCEL_PATH), { type: "buffer" });
  const sheet = workbook.Sheets["Contenus 200 jours"];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  await writePlan(now, state, rows, overrides);

  if (!forced && !slotInfo) {
    console.log("Aucun créneau dû (avant 12h heure de Paris). Rien à faire.");
    await setOutput("due", "false");
    return;
  }

  const slotKey = forced ? `force_${Date.now()}` : `${slotInfo.dateKey}_${slotInfo.slot}`;
  if (!forced && state.last_posted_slot_key === slotKey) {
    console.log(`Créneau ${slotKey} déjà traité.`);
    await setOutput("due", "false");
    return;
  }

  const row = rows[state.next_row_index];
  if (!row) {
    console.log("Toutes les phrases du fichier ont été publiées.");
    await setOutput("due", "false");
    return;
  }

  const hookCourt = String(row["Hook court"] ?? "").trim();
  const phrasePrincipale = String(row["Phrase principale"] ?? "").trim();
  const pilier = String(row["Pilier"] ?? "").trim();
  const jour = row["Jour"];

  const { caption, overridden } = composeCaption(rows, state.next_row_index, overrides);
  if (overridden) console.log(`Légende personnalisée depuis le dashboard appliquée pour le jour ${jour}.`);

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

  console.log(`Post préparé pour le jour ${jour} (${pilier}) — créneau ${slotInfo?.slot ?? "forcé"}.`);
  await setOutput("due", "true");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
