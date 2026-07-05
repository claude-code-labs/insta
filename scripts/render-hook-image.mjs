import sharp from "sharp";
import path from "node:path";

const HOOK_IMAGE_PATH = path.join(process.cwd(), "hook", "hook.png");

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text, maxCharsPerLine) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function pickSizing(text) {
  if (text.length <= 40) return { fontSize: 58, maxCharsPerLine: 20 };
  if (text.length <= 80) return { fontSize: 46, maxCharsPerLine: 26 };
  return { fontSize: 38, maxCharsPerLine: 32 };
}

export async function renderHookImage(text) {
  const baseMeta = await sharp(HOOK_IMAGE_PATH).metadata();

  const width = baseMeta.width;
  const height = baseMeta.height;

  const { fontSize, maxCharsPerLine } = pickSizing(text);
  const lines = wrapText(text, maxCharsPerLine);
  const lineHeight = fontSize * 1.3;

  // La police "Playfair Display" doit être installée au niveau système
  // (fontconfig) : le rendu SVG de sharp ignore les @font-face embarquées.
  const bandTop = height * 0.24;
  const bandBottom = height * 0.52;
  const bandCenter = (bandTop + bandBottom) / 2;
  const totalTextHeight = lines.length * lineHeight;
  const startY = bandCenter - totalTextHeight / 2 + fontSize * 0.8;

  const tspans = lines
    .map((line, i) => `<tspan x="${width / 2}" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <text
        font-family="Playfair Display"
        font-weight="700"
        font-size="${fontSize}"
        fill="#f0c862"
        text-anchor="middle"
        letter-spacing="0.5"
        filter="url(#softShadow)"
      >${tspans}</text>
    </svg>
  `;

  return sharp(HOOK_IMAGE_PATH)
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
