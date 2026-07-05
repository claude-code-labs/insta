/* Aura — dashboard Instagram.
   Mode démo par défaut (données fictives), mode réel après déchiffrement
   de data/vault.enc (AES-256-GCM, clé dérivée du mot de passe via PBKDF2). */

const PW_STORAGE_KEY = "aura_pw";
const state = { mode: "demo", bundle: null, charts: {}, countdownTimer: null, refreshTimer: null };

/* ---------- Utilitaires ---------- */
const $ = (id) => document.getElementById(id);
const fmt = (n) => (n === null || n === undefined ? "–" : new Intl.NumberFormat("fr-FR").format(n));
const fmtDate = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ---------- Déchiffrement du vault (WebCrypto) ---------- */
async function decryptVault(password, vaultText) {
  const vault = JSON.parse(vaultText);
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64(vault.salt), iterations: vault.iter, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(vault.iv) }, key, b64(vault.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

async function fetchVaultText() {
  const res = await fetch("data/vault.enc", { cache: "no-store" });
  if (!res.ok) throw new Error("vault indisponible");
  return res.text();
}

/* ---------- Graphiques ---------- */
function destroyCharts() {
  for (const c of Object.values(state.charts)) c.destroy();
  state.charts = {};
}

function baseScales() {
  return {
    x: { grid: { display: false }, ticks: { color: cssVar("--text-muted"), font: { family: "Inter" } } },
    y: {
      grid: { color: cssVar("--gridline") },
      border: { display: false },
      ticks: { color: cssVar("--text-muted"), font: { family: "Inter" } },
    },
  };
}

function tooltipStyle() {
  return {
    backgroundColor: "#211c14",
    borderColor: cssVar("--border-strong"),
    borderWidth: 1,
    titleColor: cssVar("--text"),
    bodyColor: cssVar("--text-secondary"),
    padding: 10,
    cornerRadius: 10,
    displayColors: false,
  };
}

function renderFollowersChart(history) {
  const ctx = $("chart-followers").getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, "rgba(186, 133, 38, 0.32)");
  gradient.addColorStop(1, "rgba(186, 133, 38, 0)");
  state.charts.followers = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map((h) => fmtDate(h.date)),
      datasets: [{
        label: "Abonnés",
        data: history.map((h) => h.account.followers_count),
        borderColor: cssVar("--series-1"),
        backgroundColor: gradient,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: cssVar("--gold-strong"),
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false }, tooltip: tooltipStyle() },
      scales: {
        ...baseScales(),
        x: { grid: { display: false }, ticks: { color: cssVar("--text-muted"), font: { family: "Inter" }, maxTicksLimit: 10, maxRotation: 0 } },
      },
    },
  });
}

function renderEngagementChart(media) {
  const items = [...media].reverse();
  state.charts.engagement = new Chart($("chart-engagement"), {
    type: "bar",
    data: {
      labels: items.map((m) => fmtDate(m.timestamp)),
      datasets: [{
        label: "Taux d'engagement (%)",
        data: items.map((m) => m.engagement_rate),
        backgroundColor: cssVar("--series-1"),
        borderRadius: 4,
        maxBarThickness: 34,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipStyle(), callbacks: { label: (c) => ` ${c.parsed.y} % d'engagement` } },
      },
      scales: baseScales(),
    },
  });
}

function renderLikesCommentsChart(media) {
  const items = [...media].reverse();
  state.charts.likes = new Chart($("chart-likes-comments"), {
    type: "bar",
    data: {
      labels: items.map((m) => fmtDate(m.timestamp)),
      datasets: [
        { label: "Likes", data: items.map((m) => m.likes), backgroundColor: cssVar("--series-1"), borderRadius: 4, maxBarThickness: 22 },
        { label: "Commentaires", data: items.map((m) => m.comments), backgroundColor: cssVar("--series-2"), borderRadius: 4, maxBarThickness: 22 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom", labels: { color: cssVar("--text-secondary"), usePointStyle: true, pointStyle: "circle", font: { family: "Inter" } } },
        tooltip: tooltipStyle(),
      },
      scales: baseScales(),
    },
  });
}

/* ---------- KPI ---------- */
function renderStats(latest, previous) {
  $("account-name").textContent = latest.account.name || "Aura";
  $("account-username").textContent = latest.account.username ? `@${latest.account.username}` : "";
  $("last-update").innerHTML = `<i class="bi bi-arrow-repeat"></i> Mis à jour ${fmtDateTime(latest.fetched_at)}`;

  $("stat-followers").textContent = fmt(latest.account.followers_count);
  $("stat-media").textContent = fmt(latest.account.media_count);
  $("stat-reach").textContent = fmt(latest.insights?.reach);
  $("stat-interactions").textContent = fmt(latest.insights?.total_interactions);
  $("stat-profile-views").textContent = fmt(latest.insights?.profile_views);

  const deltaEl = $("stat-followers-delta");
  deltaEl.textContent = "";
  deltaEl.className = "kpi-delta";
  if (previous) {
    const delta = latest.account.followers_count - previous.account.followers_count;
    if (delta !== 0) {
      deltaEl.innerHTML = `<i class="bi bi-arrow-${delta > 0 ? "up" : "down"}-short"></i>${delta > 0 ? "+" : ""}${fmt(delta)} depuis la veille`;
      deltaEl.classList.add(delta > 0 ? "positive" : "negative");
    }
  }
  const mediaDelta = $("stat-media-delta");
  mediaDelta.textContent = "";
  if (previous) {
    const d = latest.account.media_count - previous.account.media_count;
    if (d > 0) { mediaDelta.textContent = `+${d} récemment`; mediaDelta.className = "kpi-delta positive"; }
  }
}

/* ---------- Analyse ---------- */
function renderInsights(history, media) {
  const first = history[0];
  const last = history[history.length - 1];
  const growth = last.account.followers_count - first.account.followers_count;
  const days = Math.max(history.length - 1, 1);
  $("ins-growth").textContent = `${growth >= 0 ? "+" : ""}${fmt(growth)}`;
  $("ins-growth").style.color = growth >= 0 ? cssVar("--positive") : cssVar("--negative");
  $("ins-growth-sub").textContent = `abonnés en ${days} jour${days > 1 ? "s" : ""} (${(growth / days).toFixed(1)}/jour)`;

  const avg = media.length ? media.reduce((s, m) => s + m.engagement_rate, 0) / media.length : 0;
  $("ins-avg-engagement").textContent = `${avg.toFixed(2)} %`;

  const interactions = media.reduce((s, m) => s + m.likes + m.comments, 0);
  $("ins-interactions").textContent = fmt(interactions);
  $("ins-interactions-sub").textContent = `sur les ${media.length} dernières publications`;

  const best = media.length ? media.reduce((a, b) => (b.engagement_rate > a.engagement_rate ? b : a)) : null;
  if (best) {
    $("ins-best-rate").textContent = `${best.engagement_rate} % · ${fmt(best.likes)} likes`;
    $("ins-best-caption").textContent = (best.caption || "").slice(0, 60) + ((best.caption || "").length > 60 ? "…" : "");
    const thumb = $("ins-best-thumb");
    if (best.thumbnail) { thumb.src = best.thumbnail; thumb.classList.remove("hidden"); }
    else thumb.classList.add("hidden");
    $("ins-best").onclick = () => openPostModal(best);
    $("ins-best").onkeydown = (e) => { if (e.key === "Enter") openPostModal(best); };
  }

  // Meilleur créneau : moyenne d'engagement par heure de publication (heure de Paris)
  const byHour = {};
  for (const m of media) {
    const h = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" })
      .format(new Date(m.timestamp));
    (byHour[h] ??= []).push(m.engagement_rate);
  }
  const slots = Object.entries(byHour).map(([h, rates]) => [h, rates.reduce((a, b) => a + b, 0) / rates.length]);
  if (slots.length) {
    slots.sort((a, b) => b[1] - a[1]);
    $("ins-best-slot").textContent = `${slots[0][0]} h`;
    $("ins-best-slot-sub").textContent = `${slots[0][1].toFixed(2)} % d'engagement moyen à cette heure`;
  }
}

function startCountdown(plan) {
  clearInterval(state.countdownTimer);
  const el = $("ins-countdown");
  const sub = $("ins-countdown-sub");
  if (!plan?.next_slot_at) { el.textContent = "–"; sub.textContent = ""; return; }
  const target = new Date(plan.next_slot_at);
  sub.textContent = fmtDateTime(plan.next_slot_at);
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) { el.textContent = "imminente"; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  tick();
  state.countdownTimer = setInterval(tick, 1000);
}

/* ---------- Galerie + tableau ---------- */
function renderGallery(media, avgRate) {
  const grid = $("post-grid");
  grid.innerHTML = "";
  for (const m of media) {
    const card = document.createElement("article");
    card.className = "post-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.innerHTML = `
      <span class="badge-type">${m.type === "VIDEO" ? "Reel" : m.type === "CAROUSEL_ALBUM" ? "Carrousel" : "Post"}</span>
      <span class="po-rate">${m.engagement_rate} %</span>
      <div class="post-overlay">
        <div class="po-stats">
          <span><i class="bi bi-heart-fill"></i>${fmt(m.likes)}</span>
          <span><i class="bi bi-chat-fill"></i>${fmt(m.comments)}</span>
        </div>
        <div class="po-date">${fmtDateTime(m.timestamp)}</div>
      </div>`;
    if (m.thumbnail) {
      const img = document.createElement("img");
      img.src = m.thumbnail;
      img.alt = `Publication du ${fmtDate(m.timestamp)}`;
      img.loading = "lazy";
      card.prepend(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "no-img";
      ph.innerHTML = '<i class="bi bi-image"></i>';
      card.prepend(ph);
    }
    const open = () => openPostModal(m, avgRate);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
    grid.appendChild(card);
  }

  const tbody = document.querySelector("#media-table tbody");
  tbody.innerHTML = "";
  for (const m of media) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmtDateTime(m.timestamp)}</td>
      <td>${escapeHtml(m.type)}</td>
      <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(m.caption)}</td>
      <td class="num">${fmt(m.likes)}</td>
      <td class="num">${fmt(m.comments)}</td>
      <td class="num">${m.engagement_rate} %</td>`;
    tbody.appendChild(tr);
  }
}

/* ---------- Modal publication ---------- */
function openPostModal(m, avgRate) {
  $("pm-image").src = m.thumbnail || "";
  $("pm-type").textContent = m.type === "VIDEO" ? "Reel" : m.type === "CAROUSEL_ALBUM" ? "Carrousel" : "Post";
  $("pm-date").textContent = fmtDateTime(m.timestamp);
  $("pm-likes").textContent = fmt(m.likes);
  $("pm-comments").textContent = fmt(m.comments);
  $("pm-rate").textContent = `${m.engagement_rate} %`;
  $("pm-caption").textContent = m.caption || "—";

  const cmp = $("pm-compare");
  if (avgRate && m.engagement_rate != null) {
    const diff = ((m.engagement_rate - avgRate) / avgRate) * 100;
    cmp.innerHTML = Number.isFinite(diff)
      ? `Performance : <span class="${diff >= 0 ? "positive" : "negative"}">${diff >= 0 ? "+" : ""}${diff.toFixed(0)} %</span> par rapport à la moyenne du compte (${avgRate.toFixed(2)} %).`
      : "";
  } else cmp.textContent = "";

  openModal("post-modal");
}

/* ---------- Plan & messages ---------- */
function renderPlan(plan) {
  const emptyEl = $("plan-empty");
  const contentEl = $("plan-content");
  if (!plan) { emptyEl.classList.remove("hidden"); contentEl.classList.add("hidden"); return; }
  emptyEl.classList.add("hidden");
  contentEl.classList.remove("hidden");

  const pct = plan.total_days ? Math.round((plan.posted_count / plan.total_days) * 100) : 0;
  $("plan-progress-label").textContent = `${plan.posted_count} / ${plan.total_days} publications envoyées`;
  $("plan-progress-pct").textContent = `${pct} %`;
  $("plan-progress-bar").style.width = `${pct}%`;

  const lastEl = $("plan-last");
  if (plan.last_posted) {
    lastEl.innerHTML = `
      <div class="pb-label">Dernière publication</div>
      <div class="pb-row">
        <span>Jour ${escapeHtml(String(plan.last_posted.jour))}${plan.last_posted.posted_at ? " — " + fmtDateTime(plan.last_posted.posted_at) : ""}</span>
        <span class="chip ok link-view" id="plan-last-view"><i class="bi bi-eye-fill"></i> Voir</span>
      </div>`;
    $("plan-last-view").addEventListener("click", () => openLastPostedModal(plan));
  } else {
    lastEl.innerHTML = `<div class="pb-label">Dernière publication</div><span class="empty-note">Aucune pour le moment.</span>`;
  }

  const list = $("plan-upcoming");
  list.innerHTML = "";
  for (const item of plan.upcoming ?? []) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <div class="upcoming-phrase">${escapeHtml(item.phrase)}</div>
        <div class="upcoming-pilier">${escapeHtml(item.pilier)}</div>
      </div>
      <span class="chip">Jour ${escapeHtml(String(item.jour))}</span>`;
    list.appendChild(li);
  }
}

// "Voir" la dernière publication planifiée : tout se passe dans le dashboard.
// On retrouve la publication correspondante dans les médias récents (posté à ±24 h),
// sinon on affiche l'image générée stockée dans le repo.
function openLastPostedModal(plan) {
  const media = state.bundle?.latest?.recent_media ?? [];
  const postedAt = plan.last_posted.posted_at ? new Date(plan.last_posted.posted_at).getTime() : null;
  let match = null;
  if (postedAt) {
    match = media
      .filter((m) => Math.abs(new Date(m.timestamp).getTime() - postedAt) < 24 * 3600 * 1000)
      .sort((a, b) => Math.abs(new Date(a.timestamp) - postedAt) - Math.abs(new Date(b.timestamp) - postedAt))[0];
  }
  if (match) {
    const avg = media.length ? media.reduce((s, m) => s + m.engagement_rate, 0) / media.length : null;
    openPostModal(match, avg);
    return;
  }
  openPostModal({
    thumbnail: state.mode === "live" ? `schedule/media/generated/jour-${plan.last_posted.jour}.jpg` : null,
    type: "IMAGE",
    timestamp: plan.last_posted.posted_at ?? new Date().toISOString(),
    likes: null,
    comments: null,
    engagement_rate: null,
    caption: `Publication automatique — jour ${plan.last_posted.jour}. Les statistiques apparaîtront à la prochaine synchronisation.`,
  });
}

function renderMessages(conversations) {
  const list = $("messages-list");
  const emptyEl = $("messages-empty");
  list.innerHTML = "";
  if (!conversations.length) { emptyEl.classList.remove("hidden"); return; }
  emptyEl.classList.add("hidden");
  for (const conv of conversations) {
    const initial = (conv.participant || "?").charAt(0).toUpperCase();
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="msg-avatar">${escapeHtml(initial)}</div>
      <div style="min-width:0">
        <div class="msg-participant">${escapeHtml(conv.participant)}</div>
        <div class="msg-preview">${escapeHtml(conv.last_message?.text ?? "")}</div>
        <div class="msg-time">${conv.updated_time ? fmtDateTime(conv.updated_time) : ""}</div>
      </div>`;
    list.appendChild(li);
  }
}

/* ---------- Rendu global ---------- */
function renderBundle(bundle, mode) {
  state.bundle = bundle;
  state.mode = mode;

  const history = bundle.history ?? [];
  if (!history.length) return;
  const latest = bundle.latest ?? history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const media = latest.recent_media ?? [];
  const avgRate = media.length ? media.reduce((s, m) => s + m.engagement_rate, 0) / media.length : null;

  const pill = $("mode-pill");
  pill.textContent = mode === "live" ? "LIVE" : "DÉMO";
  pill.classList.toggle("live", mode === "live");
  $("demo-banner").classList.toggle("hidden", mode === "live");
  $("login-btn").classList.toggle("hidden", mode === "live");
  $("logout-btn").classList.toggle("hidden", mode !== "live");
  $("live-label").textContent = mode === "live" ? "temps réel" : "aperçu démo";

  const pic = $("profile-pic");
  if (latest.account.profile_picture_url) { pic.src = latest.account.profile_picture_url; pic.classList.remove("hidden"); }
  else pic.classList.add("hidden");

  destroyCharts();
  renderStats(latest, previous);
  renderInsights(history, media);
  startCountdown(bundle.plan);
  renderFollowersChart(history);
  renderEngagementChart(media);
  renderLikesCommentsChart(media);
  renderGallery(media, avgRate);
  renderPlan(bundle.plan);
  renderMessages(bundle.messages?.conversations ?? []);
}

/* ---------- Mode réel ---------- */
async function tryLive(password) {
  const vaultText = await fetchVaultText();
  const bundle = await decryptVault(password, vaultText);
  renderBundle(bundle, "live");
  sessionStorage.setItem(PW_STORAGE_KEY, password);
  startAutoRefresh(password);
}

function startAutoRefresh(password) {
  clearInterval(state.refreshTimer);
  state.refreshTimer = setInterval(async () => {
    try {
      const bundle = await decryptVault(password, await fetchVaultText());
      if (bundle.built_at !== state.bundle?.built_at) renderBundle(bundle, "live");
    } catch { /* réseau indisponible : on garde l'affichage actuel */ }
  }, 5 * 60 * 1000);
}

function logout() {
  sessionStorage.removeItem(PW_STORAGE_KEY);
  clearInterval(state.refreshTimer);
  renderBundle(window.DEMO_BUNDLE, "demo");
}

/* ---------- Modals ---------- */
function openModal(id) { $(id).classList.remove("hidden"); }
function closeModal(id) { $(id).classList.add("hidden"); }

document.addEventListener("click", (e) => {
  const closeId = e.target.closest("[data-close]")?.dataset.close;
  if (closeId) closeModal(closeId);
  if (e.target.classList.contains("modal-backdrop")) e.target.classList.add("hidden");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.add("hidden"));
});

$("login-btn").addEventListener("click", () => {
  $("login-error").classList.add("hidden");
  $("login-password").value = "";
  openModal("login-modal");
  setTimeout(() => $("login-password").focus(), 60);
});
$("logout-btn").addEventListener("click", logout);

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("login-submit");
  btn.disabled = true;
  btn.textContent = "Déchiffrement…";
  try {
    await tryLive($("login-password").value);
    closeModal("login-modal");
  } catch {
    const modal = document.querySelector(".login-modal");
    $("login-error").classList.remove("hidden");
    modal.classList.remove("shake");
    void modal.offsetWidth;
    modal.classList.add("shake");
  } finally {
    btn.disabled = false;
    btn.textContent = "Déverrouiller";
  }
});

$("toggle-table").addEventListener("click", () => {
  const card = $("table-card");
  const hidden = card.classList.toggle("hidden");
  $("toggle-table").innerHTML = hidden
    ? '<i class="bi bi-table"></i> Vue tableau'
    : '<i class="bi bi-grid-3x3-gap"></i> Vue galerie';
});

/* ---------- Démarrage ---------- */
(async function init() {
  renderBundle(window.DEMO_BUNDLE, "demo");
  const saved = sessionStorage.getItem(PW_STORAGE_KEY);
  if (saved) {
    try { await tryLive(saved); } catch { sessionStorage.removeItem(PW_STORAGE_KEY); }
  }
})();
