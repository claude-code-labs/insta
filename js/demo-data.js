// Données fictives affichées en mode démo (visiteurs non connectés).
// Aucune donnée réelle ici : tout est inventé pour présenter le projet.
(function () {
  function demoThumb(label, seed) {
    const hues = [
      ["#2a2118", "#4a3418"],
      ["#231c12", "#54401d"],
      ["#1d1810", "#3d2e14"],
      ["#262015", "#5c4a22"],
    ];
    const [c1, c2] = hues[seed % hues.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient></defs>
      <rect width="600" height="600" fill="url(#g)"/>
      <circle cx="300" cy="480" r="150" fill="#0d0a06" stroke="#c9a44c" stroke-width="3" opacity="0.9"/>
      <text x="300" y="270" font-family="Georgia, serif" font-size="42" fill="#e8c06a" text-anchor="middle" font-weight="bold">${label}</text>
    </svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  const today = new Date();
  const day = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };
  const dayTime = (offset, h) => `${day(offset)}T${String(h).padStart(2, "0")}:00:00+0000`;

  // 30 jours de croissance fictive : 1 240 → 1 618 abonnés
  const followersCurve = [];
  let f = 1240;
  for (let i = 29; i >= 0; i--) {
    f += Math.round(6 + 10 * Math.abs(Math.sin(i * 1.7)) + (i % 7 === 0 ? 14 : 0));
    followersCurve.push({ offset: i, followers: f });
  }

  const captions = [
    "La régularité bat le talent quand le talent ne se lève pas.",
    "Ce que tu fais chaque jour compte plus que ce que tu fais parfois.",
    "Ton avenir se construit dans les heures que personne ne voit.",
    "La discipline est un cadeau que tu te fais à toi-même.",
    "Un petit pas par jour, et dans un an tu ne te reconnais plus.",
    "Le succès aime le silence et le travail bien fait.",
    "Chaque matin est une nouvelle chance de progresser.",
    "Vise la constance, la motivation suivra.",
  ];

  const recentMedia = captions.map((caption, i) => {
    const likes = 210 - i * 14 + (i % 3) * 9;
    const comments = 26 - i * 2;
    const followers = followersCurve[followersCurve.length - 1].followers;
    return {
      id: `demo-${i}`,
      type: i % 4 === 1 ? "VIDEO" : "IMAGE",
      timestamp: dayTime(i * 2 + 1, i % 2 === 0 ? 12 : 19),
      permalink: null,
      thumbnail: demoThumb(`Jour ${180 - i * 2}`, i),
      caption,
      likes,
      comments,
      engagement_rate: Number((((likes + comments) / followers) * 100).toFixed(2)),
    };
  });

  const history = followersCurve.map(({ offset, followers }, idx) => ({
    date: day(offset),
    fetched_at: `${day(offset)}T06:00:00.000Z`,
    account: {
      name: "Mindset Doré",
      username: "mindset.dore_demo",
      followers_count: followers,
      follows_count: 180,
      media_count: 140 + Math.floor((29 - offset) / 2),
    },
    insights: {
      reach: 900 + Math.round(400 * Math.abs(Math.sin(idx))),
      profile_views: 60 + Math.round(30 * Math.abs(Math.cos(idx))),
      accounts_engaged: 150 + idx * 3,
      total_interactions: 240 + idx * 5,
    },
    recent_media: recentMedia,
  }));

  const nextSlot = new Date(today);
  nextSlot.setHours(nextSlot.getHours() >= 12 ? 19 : 12, 0, 0, 0);
  if (nextSlot < today) nextSlot.setDate(nextSlot.getDate() + 1);

  window.DEMO_BUNDLE = {
    demo: true,
    history,
    latest: history[history.length - 1],
    messages: {
      fetched_at: new Date().toISOString(),
      conversations: [
        {
          id: "demo-c1",
          participant: "sarah.entrepreneure",
          updated_time: dayTime(0, 10),
          last_message: { text: "J'adore tes visuels, tu utilises quel outil ?", from: "sarah.entrepreneure" },
        },
        {
          id: "demo-c2",
          participant: "karim_invest",
          updated_time: dayTime(1, 21),
          last_message: { text: "Le post d'hier m'a vraiment parlé 🙏", from: "karim_invest" },
        },
        {
          id: "demo-c3",
          participant: "leila.mindset",
          updated_time: dayTime(2, 14),
          last_message: { text: "Est-ce que tu proposes du coaching ?", from: "leila.mindset" },
        },
      ],
    },
    plan: {
      generated_at: new Date().toISOString(),
      total_days: 200,
      posted_count: 62,
      remaining: 138,
      last_posted: { jour: 62, permalink: null, posted_at: dayTime(0, 12).replace("+0000", "Z") },
      next_slot_at: nextSlot.toISOString(),
      upcoming: [
        {
          jour: 63, pilier: "Discipline",
          phrase: "La discipline commence quand l'envie s'arrête.",
          hook: "La discipline commence quand l'envie s'arrête.",
          caption: "La discipline commence quand l'envie s'arrête.\n\nLa motivation va et vient, mais c'est la régularité qui construit des résultats durables.\n\nEnregistre ce rappel.\n\n#discipline #mindset #motivation",
          caption_overridden: false,
        },
        {
          jour: 64, pilier: "Vision",
          phrase: "Une vision claire transforme l'effort en direction.",
          hook: "Une vision claire transforme l'effort en direction.",
          caption: "Une vision claire transforme l'effort en direction.\n\nAvoir une direction claire aide à tenir bon dans les moments difficiles.\n\nPartage à quelqu'un qui en a besoin.\n\n#vision #objectifs #mindset",
          caption_overridden: false,
        },
        {
          jour: 65, pilier: "Patience",
          phrase: "Ce qui pousse lentement porte des racines profondes.",
          hook: "Ce qui pousse lentement porte des racines profondes.",
          caption: "Ce qui pousse lentement porte des racines profondes.\n\nLes résultats qui comptent vraiment prennent du temps à se construire.\n\nEnregistre ce rappel.\n\n#patience #perseverance #mindset",
          caption_overridden: false,
        },
        {
          jour: 66, pilier: "Action",
          phrase: "Commence petit, commence mal, mais commence.",
          hook: "Commence petit, commence mal, mais commence.",
          caption: "Commence petit, commence mal, mais commence.\n\nL'action réduit la peur, alors que l'attente la nourrit.\n\nPartage à quelqu'un qui en a besoin.\n\n#action #motivation #mindset",
          caption_overridden: false,
        },
      ],
    },
  };
})();
