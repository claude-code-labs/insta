const POOL = {
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
};

const FALLBACK = ["#mindset", "#developpementpersonnel", "#motivation", "#reussite", "#croissancepersonnelle", "#inspiration", "#objectifs"];

export function hashtagsForPilier(pilier) {
  return POOL[pilier?.trim()] ?? FALLBACK;
}
