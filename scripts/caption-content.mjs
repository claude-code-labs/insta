const HASHTAGS = {
  "Discipline": ["#discipline", "#regularite", "#mindset", "#developpementpersonnel", "#motivation", "#routine", "#reussite"],
  "Confiance en soi": ["#confianceensoi", "#estimedesoi", "#mindset", "#developpementpersonnel", "#croissancepersonnelle", "#reussite", "#motivation"],
  "Passage à l'action": ["#passagealaction", "#action", "#motivation", "#mindset", "#developpementpersonnel", "#objectifs", "#reussite"],
  "Passage à l’action": ["#passagealaction", "#action", "#motivation", "#mindset", "#developpementpersonnel", "#objectifs", "#reussite"],
  "Patience": ["#patience", "#perseverance", "#mindset", "#developpementpersonnel", "#croissance", "#discipline", "#reussite"],
  "Vision": ["#vision", "#objectifs", "#mindset", "#developpementpersonnel", "#ambition", "#reussite", "#motivation"],
  "Échec": ["#echec", "#resilience", "#mindset", "#developpementpersonnel", "#croissance", "#perseverance", "#reussite"],
  "Habitudes": ["#habitudes", "#routine", "#discipline", "#mindset", "#developpementpersonnel", "#productivite", "#reussite"],
  "Gestion du temps": ["#gestiondutemps", "#productivite", "#discipline", "#mindset", "#developpementpersonnel", "#organisation", "#reussite"],
  "Mentalité": ["#mentalite", "#mindset", "#developpementpersonnel", "#croissance", "#motivation", "#reussite", "#discipline"],
  "Responsabilité": ["#responsabilite", "#mindset", "#developpementpersonnel", "#maturite", "#croissance", "#reussite", "#discipline"],
  "Focus": ["#focus", "#concentration", "#mindset", "#developpementpersonnel", "#productivite", "#discipline", "#reussite"],
  "Courage": ["#courage", "#depassementdesoi", "#mindset", "#developpementpersonnel", "#motivation", "#reussite", "#confianceensoi"],
  "Argent et valeur": ["#argent", "#richessemindset", "#mindset", "#developpementpersonnel", "#reussite", "#libertefinanciere", "#valeur"],
  "Apprentissage": ["#apprentissage", "#croissance", "#mindset", "#developpementpersonnel", "#curiosite", "#reussite", "#progres"],
  "Relations": ["#relations", "#entourage", "#mindset", "#developpementpersonnel", "#croissance", "#reussite", "#bienveillance"],
  "Valeurs": ["#valeurs", "#mindset", "#developpementpersonnel", "#integrite", "#croissance", "#reussite", "#sens"],
  "Santé et énergie": ["#sante", "#energie", "#mindset", "#developpementpersonnel", "#bienetre", "#discipline", "#reussite"],
  "Leadership personnel": ["#leadership", "#mindset", "#developpementpersonnel", "#confianceensoi", "#croissance", "#reussite", "#vision"],
  "Résilience": ["#resilience", "#perseverance", "#mindset", "#developpementpersonnel", "#croissance", "#discipline", "#reussite"],
  "Gratitude": ["#gratitude", "#mindset", "#developpementpersonnel", "#bienetre", "#positivite", "#reussite", "#croissance"],
};

const HASHTAGS_FALLBACK = ["#mindset", "#developpementpersonnel", "#motivation", "#reussite", "#croissancepersonnelle", "#inspiration", "#objectifs"];

export function hashtagsForPilier(pilier) {
  return HASHTAGS[pilier?.trim()] ?? HASHTAGS_FALLBACK;
}

const DEVELOPMENTS = {
  "Discipline": [
    "La motivation va et vient, mais c'est la régularité qui construit des résultats durables. Ce sont les petites actions répétées chaque jour qui font la différence sur le long terme.",
    "On attend souvent d'avoir envie pour agir, alors que c'est l'inverse qui fonctionne : l'action régulière crée l'envie. La discipline, c'est choisir de continuer même sans motivation.",
    "Ce n'est pas l'intensité d'un jour qui change une vie, c'est la constance sur la durée. Un petit pas fait chaque jour vaut plus qu'un grand pas fait une fois.",
  ],
  "Confiance en soi": [
    "La confiance ne tombe pas du ciel, elle se construit à force de preuves qu'on se donne à soi-même. Chaque petit engagement tenu renforce la relation de confiance avec soi-même.",
    "On n'a pas besoin d'être parfait pour avancer, juste de croire qu'on est capable d'apprendre en chemin. La confiance se nourrit de l'action, pas de l'attente.",
    "Douter fait partie du chemin, mais ça ne doit pas empêcher d'avancer. La vraie confiance, c'est agir malgré le doute.",
  ],
  "Passage à l'action": [
    "Réfléchir est utile, mais à un moment il faut passer à l'action pour que les choses changent. C'est en avançant, même imparfaitement, qu'on apprend le plus vite.",
    "Trop de plans et pas assez d'action mènent nulle part. Le premier petit pas compte plus que le plan parfait qu'on ne commence jamais.",
    "L'action réduit la peur, alors que l'attente la nourrit. Commencer, même petitement, change déjà la trajectoire.",
  ],
  "Passage à l’action": [
    "Réfléchir est utile, mais à un moment il faut passer à l'action pour que les choses changent. C'est en avançant, même imparfaitement, qu'on apprend le plus vite.",
    "Trop de plans et pas assez d'action mènent nulle part. Le premier petit pas compte plus que le plan parfait qu'on ne commence jamais.",
    "L'action réduit la peur, alors que l'attente la nourrit. Commencer, même petitement, change déjà la trajectoire.",
  ],
  "Patience": [
    "Les résultats qui comptent vraiment prennent du temps à se construire. La patience, c'est continuer à avancer même quand rien ne semble bouger.",
    "On sous-estime souvent le temps nécessaire pour changer une situation en profondeur. Tenir sur la durée fait toute la différence entre ceux qui abandonnent et ceux qui réussissent.",
    "Rien de solide ne se construit dans la précipitation. La patience protège des décisions prises sous le coup de l'impatience.",
  ],
  "Vision": [
    "Avoir une direction claire aide à tenir bon dans les moments difficiles. Une vision précise donne du sens à chaque effort du quotidien.",
    "Sans objectif clair, on avance au hasard et on s'épuise vite. Se projeter loin permet de mieux choisir ce qu'on fait aujourd'hui.",
    "Ce qu'on veut devenir dans plusieurs années se construit par les choix qu'on fait maintenant. Garder sa vision en tête aide à rester aligné.",
  ],
  "Échec": [
    "Un échec n'est pas une fin, c'est une information qui permet d'ajuster la suite. Ceux qui réussissent sont souvent ceux qui ont échoué le plus de fois sans abandonner.",
    "Ce n'est pas l'échec en lui-même qui bloque, c'est la peur de le vivre. Accepter de se tromper est souvent le prix à payer pour progresser.",
    "Chaque erreur contient une leçon utile pour la suite, à condition de prendre le temps de la regarder en face.",
  ],
  "Habitudes": [
    "Ce qu'on fait tous les jours pèse plus lourd que ce qu'on fait une fois de temps en temps. Les petites habitudes répétées finissent par façonner qui on devient.",
    "Changer une vie, ce n'est pas faire un grand geste isolé, c'est ajuster ses habitudes du quotidien. Les résultats suivent toujours la régularité.",
    "Une bonne habitude installée aujourd'hui simplifie toutes les décisions de demain. C'est un investissement discret mais puissant.",
  ],
  "Gestion du temps": [
    "Le temps ne s'étire pas, il se choisit. Prioriser ce qui compte vraiment évite de le perdre sur ce qui compte peu.",
    "On ne manque pas de temps, on manque souvent de clarté sur ce qui est important. Organiser sa journée autour de ses vraies priorités change tout.",
    "Chaque heure investie dans ce qui compte rapproche d'un objectif. Chaque heure dispersée l'éloigne un peu plus.",
  ],
  "Mentalité": [
    "La façon dont on interprète les situations détermine souvent la façon dont on agit. Changer de mentalité change la trajectoire de toute une vie.",
    "Ce n'est pas la situation qui bloque le plus souvent, c'est le regard qu'on porte dessus. Une mentalité de croissance transforme les obstacles en apprentissages.",
    "Ceux qui avancent ne sont pas ceux qui n'ont pas de difficultés, mais ceux qui choisissent de les regarder comme des étapes.",
  ],
  "Responsabilité": [
    "Prendre la responsabilité de sa situation, même quand elle est injuste, redonne du pouvoir d'action. Attendre que les choses changent d'elles-mêmes ne mène nulle part.",
    "Se plaindre soulage sur le moment mais ne change rien. Assumer sa part de responsabilité est souvent le premier pas vers une vraie solution.",
    "Ce qu'on choisit de faire face à une difficulté compte plus que la difficulté elle-même.",
  ],
  "Focus": [
    "Vouloir tout faire en même temps disperse l'énergie et ralentit les résultats. Se concentrer sur une seule priorité à la fois est souvent plus efficace.",
    "Le focus protège des distractions qui donnent l'illusion d'avancer sans réel progrès. Une attention claire sur l'essentiel change la vitesse d'exécution.",
    "Ce sur quoi on porte son attention finit par grandir. Choisir où regarder, c'est déjà choisir où on va.",
  ],
  "Courage": [
    "Le courage n'est pas l'absence de peur, c'est agir malgré elle. Beaucoup de belles choses commencent juste après ce moment d'hésitation.",
    "Rester dans sa zone de confort protège du risque, mais empêche aussi de grandir. Un pas hors de cette zone suffit souvent à tout changer.",
    "Ce qui fait peur aujourd'hui devient souvent une force une fois affronté. Le courage se muscle en s'exerçant.",
  ],
  "Argent et valeur": [
    "La valeur qu'on apporte précède presque toujours l'argent qu'on reçoit. Se concentrer sur ce qu'on peut offrir change la relation qu'on a avec l'argent.",
    "L'argent suit rarement le hasard, il suit la valeur créée et la constance dans l'effort. Construire sa valeur est un travail de fond.",
    "Avoir une bonne relation avec l'argent commence par une bonne discipline et une vision claire de ce qu'on veut construire.",
  ],
  "Apprentissage": [
    "Ce qu'on apprend aujourd'hui devient l'avantage de demain. Rester curieux et ouvert à apprendre est une des clés les plus sous-estimées de la réussite.",
    "Personne ne maîtrise tout dès le départ. Accepter d'être débutant est souvent le prix à payer pour progresser vraiment.",
    "Chaque compétence acquise est un outil de plus pour construire ce qu'on veut. L'apprentissage continu est un investissement qui rapporte toujours.",
  ],
  "Relations": [
    "L'entourage qu'on choisit influence énormément la personne qu'on devient. S'entourer de personnes qui tirent vers le haut change la trajectoire.",
    "Les relations qui comptent se construisent avec du temps, de l'écoute et de la sincérité. Elles méritent autant d'attention que les objectifs professionnels.",
    "On devient souvent le reflet des cinq personnes qu'on côtoie le plus. Choisir son entourage, c'est aussi choisir sa direction.",
  ],
  "Valeurs": [
    "Avoir des valeurs claires aide à prendre des décisions alignées, même dans les moments difficiles. Elles servent de repère quand tout devient confus.",
    "Ce qui compte vraiment pour soi doit guider les choix du quotidien, pas seulement les grandes décisions. Vivre selon ses valeurs donne du sens à chaque effort.",
    "Les compromis qui vont à l'encontre de ses valeurs finissent toujours par coûter cher, même s'ils semblent pratiques sur le moment.",
  ],
  "Santé et énergie": [
    "Le corps est la base de tout le reste : sans énergie, même les meilleurs objectifs deviennent difficiles à tenir. Prendre soin de sa santé est un investissement, pas une option.",
    "L'énergie qu'on a dans une journée dépend souvent des choix simples qu'on fait la veille : sommeil, mouvement, alimentation. Ces détails pèsent plus qu'on ne le pense.",
    "Négliger sa santé pour aller plus vite finit toujours par ralentir. Prendre soin de soi est une condition pour tenir sur la durée.",
  ],
  "Leadership personnel": [
    "Avant de guider les autres, il faut apprendre à se diriger soi-même. Le leadership personnel commence par la capacité à tenir ses propres engagements.",
    "Être responsable de ses choix, de son énergie et de sa discipline, c'est déjà une forme de leadership, même sans équipe à diriger.",
    "Ceux qui inspirent le plus sont souvent ceux qui appliquent à eux-mêmes ce qu'ils demandent aux autres.",
  ],
  "Résilience": [
    "Ce n'est pas l'absence de difficultés qui définit la force d'une personne, c'est sa capacité à se relever après chaque chute. La résilience se construit dans l'épreuve.",
    "Tenir bon dans les moments difficiles est souvent ce qui sépare ceux qui abandonnent de ceux qui réussissent. Chaque obstacle surmonté renforce la suite.",
    "On ne choisit pas toujours ce qui nous arrive, mais on choisit toujours comment on se relève.",
  ],
  "Gratitude": [
    "Prendre le temps de reconnaître ce qu'on a déjà change la façon d'aborder ce qu'on n'a pas encore. La gratitude apaise et remet les choses en perspective.",
    "On avance souvent plus sereinement quand on sait apprécier le chemin déjà parcouru, pas seulement la destination.",
    "La gratitude ne remplace pas l'ambition, elle la rend plus saine : on peut vouloir plus tout en appréciant ce qu'on a déjà.",
  ],
};

export function developmentForPilier(pilier, rowIndexWithinPilier = 0) {
  const list = DEVELOPMENTS[pilier?.trim()];
  if (!list || list.length === 0) return "";
  return list[rowIndexWithinPilier % list.length];
}
