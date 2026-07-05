const root = getComputedStyle(document.documentElement);
const color = (name) => root.getPropertyValue(name).trim();

function formatNumber(n) {
  if (n === null || n === undefined) return "–";
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function loadJson(pathName, fallback) {
  try {
    const res = await fetch(pathName, { cache: "no-store" });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

async function loadHistory() {
  return loadJson("data/history.json", []);
}

function renderStats(latest, previous) {
  document.getElementById("account-name").textContent = latest.account.name || "Dashboard Instagram";
  document.getElementById("account-username").textContent = latest.account.username
    ? `@${latest.account.username}`
    : "";
  document.getElementById("last-update").innerHTML =
    `<i class="bi bi-arrow-repeat"></i> Mis à jour le ${new Date(latest.fetched_at).toLocaleString("fr-FR")}`;

  document.getElementById("stat-followers").textContent = formatNumber(latest.account.followers_count);
  document.getElementById("stat-media").textContent = formatNumber(latest.account.media_count);
  document.getElementById("stat-reach").textContent = formatNumber(latest.insights?.reach);
  document.getElementById("stat-profile-views").textContent = formatNumber(latest.insights?.profile_views);

  const deltaEl = document.getElementById("stat-followers-delta");
  if (previous) {
    const delta = latest.account.followers_count - previous.account.followers_count;
    if (delta !== 0) {
      deltaEl.textContent = `${delta > 0 ? "+" : ""}${delta} depuis hier`;
      deltaEl.classList.toggle("positive", delta > 0);
    }
  }
}

function renderFollowersChart(history) {
  new Chart(document.getElementById("chart-followers"), {
    type: "line",
    data: {
      labels: history.map((h) => formatDate(h.date)),
      datasets: [
        {
          label: "Abonnés",
          data: history.map((h) => h.account.followers_count),
          borderColor: color("--series-1"),
          backgroundColor: color("--series-1"),
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.25,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: color("--gridline") }, ticks: { color: color("--text-muted") } },
        y: {
          grid: { color: color("--gridline") },
          ticks: { color: color("--text-muted") },
          beginAtZero: false,
        },
      },
    },
  });
}

function renderEngagementChart(media) {
  const items = [...media].reverse();
  new Chart(document.getElementById("chart-engagement"), {
    type: "bar",
    data: {
      labels: items.map((m) => formatDate(m.timestamp)),
      datasets: [
        {
          label: "Taux d'engagement (%)",
          data: items.map((m) => m.engagement_rate),
          backgroundColor: color("--series-1"),
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: color("--text-muted") } },
        y: { grid: { color: color("--gridline") }, ticks: { color: color("--text-muted") } },
      },
    },
  });
}

function renderLikesCommentsChart(media) {
  const items = [...media].reverse();
  new Chart(document.getElementById("chart-likes-comments"), {
    type: "bar",
    data: {
      labels: items.map((m) => formatDate(m.timestamp)),
      datasets: [
        {
          label: "Likes",
          data: items.map((m) => m.likes),
          backgroundColor: color("--series-1"),
          borderRadius: 4,
        },
        {
          label: "Commentaires",
          data: items.map((m) => m.comments),
          backgroundColor: color("--series-2"),
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom", labels: { color: color("--text-secondary") } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: color("--text-muted") } },
        y: { grid: { color: color("--gridline") }, ticks: { color: color("--text-muted") } },
      },
    },
  });
}

function engagementBadgeClass(rate) {
  if (rate >= 5) return "status-badge published";
  if (rate >= 2) return "status-badge pending";
  return "status-badge failed";
}

function renderTable(media) {
  const tbody = document.querySelector("#media-table tbody");
  tbody.innerHTML = "";
  for (const m of media) {
    const tr = document.createElement("tr");
    const thumb = m.thumbnail
      ? `<img src="${encodeURI(m.thumbnail)}" alt="" class="media-thumb" />`
      : `<div class="media-thumb media-thumb-placeholder"><i class="bi bi-image"></i></div>`;
    tr.innerHTML = `
      <td>${thumb}</td>
      <td>${formatDate(m.timestamp)}</td>
      <td>${escapeHtml(m.type)}</td>
      <td class="text-truncate" style="max-width: 220px;">${escapeHtml(m.caption)}</td>
      <td class="text-end">${formatNumber(m.likes)}</td>
      <td class="text-end">${formatNumber(m.comments)}</td>
      <td class="text-end"><span class="${engagementBadgeClass(m.engagement_rate)}">${m.engagement_rate}%</span></td>
      <td><a href="${encodeURI(m.permalink ?? "#")}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i></a></td>
    `;
    tbody.appendChild(tr);
  }
}

function renderPlan(plan) {
  const emptyEl = document.getElementById("plan-empty");
  const contentEl = document.getElementById("plan-content");

  if (!plan) {
    emptyEl.classList.remove("d-none");
    contentEl.classList.add("d-none");
    return;
  }
  emptyEl.classList.add("d-none");
  contentEl.classList.remove("d-none");

  const pct = plan.total_days ? Math.round((plan.posted_count / plan.total_days) * 100) : 0;
  document.getElementById("plan-progress-label").textContent =
    `${plan.posted_count} / ${plan.total_days} publications envoyées`;
  document.getElementById("plan-progress-pct").textContent = `${pct}%`;
  document.getElementById("plan-progress-bar").style.width = `${pct}%`;

  const lastEl = document.getElementById("plan-last");
  if (plan.last_posted) {
    lastEl.innerHTML = `
      <div class="text-muted small mb-1">Dernière publication</div>
      <div class="d-flex justify-content-between align-items-center gap-2">
        <span>Jour ${escapeHtml(String(plan.last_posted.jour))} — ${plan.last_posted.posted_at ? formatDateTime(plan.last_posted.posted_at) : ""}</span>
        ${plan.last_posted.permalink ? `<a href="${encodeURI(plan.last_posted.permalink)}" target="_blank" rel="noopener" class="status-badge published"><i class="bi bi-check-circle-fill"></i>Voir</a>` : ""}
      </div>
    `;
  } else {
    lastEl.innerHTML = `<div class="text-muted small">Aucune publication envoyée pour le moment.</div>`;
  }

  const nextEl = document.getElementById("plan-next");
  nextEl.innerHTML = plan.next_slot_at
    ? `<div class="text-muted small mb-1">Prochaine publication</div><div>${formatDateTime(plan.next_slot_at)}</div>`
    : "";

  const upcomingList = document.getElementById("plan-upcoming");
  upcomingList.innerHTML = "";
  for (const item of plan.upcoming ?? []) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div class="schedule-caption text-truncate" style="max-width: 320px;">${escapeHtml(item.phrase)}</div>
        <span class="status-badge pending"><i class="bi bi-hourglass-split"></i>Jour ${escapeHtml(String(item.jour))}</span>
      </div>
      <small class="text-muted">${escapeHtml(item.pilier)}</small>
    `;
    upcomingList.appendChild(li);
  }
}

function renderMessages(conversations) {
  const list = document.getElementById("messages-list");
  const emptyEl = document.getElementById("messages-empty");
  list.innerHTML = "";

  if (!conversations.length) {
    emptyEl.classList.remove("d-none");
    return;
  }
  emptyEl.classList.add("d-none");

  for (const conv of conversations) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="message-participant">${escapeHtml(conv.participant)}</div>
      <div class="message-preview text-truncate" style="max-width: 320px;">${escapeHtml(conv.last_message?.text)}</div>
      <small class="text-muted">${conv.updated_time ? formatDateTime(conv.updated_time) : ""}</small>
    `;
    list.appendChild(li);
  }
}

async function init() {
  const history = await loadHistory();
  if (!history.length) {
    document.getElementById("empty-state").classList.remove("d-none");
    return;
  }

  document.getElementById("dashboard").classList.remove("d-none");

  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;

  renderStats(latest, previous);
  renderFollowersChart(history);
  renderEngagementChart(latest.recent_media ?? []);
  renderLikesCommentsChart(latest.recent_media ?? []);
  renderTable(latest.recent_media ?? []);

  const [plan, messages] = await Promise.all([
    loadJson("data/content-plan.json", null),
    loadJson("data/messages.json", { conversations: [] }),
  ]);
  renderPlan(plan);
  renderMessages(messages.conversations ?? []);
}

init();
