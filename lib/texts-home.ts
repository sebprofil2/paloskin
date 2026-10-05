/*
 * Texte der Startseite, Entwurf B „Persönlich“ (Vorlage vom 5. Oktober 2026). Deutsch wörtlich aus der Vorlage,
 * von Dr. Vogel einzeln freigegeben; die anderen Sprachen sind daraus übersetzt (Ukrainisch und Arabisch:
 * Muttersprachler-Prüfung offen). Kopfzeile und Fußzeile nutzen dieselben Texte auch auf der Buchungsseite.
 * title und metaDesc bleiben wie bisher (Seitentitel und Linkvorschau unverändert, lib/share-meta.ts).
 * Zwei Teile einer Überschrift: …A normal, …B kursiv in Blau (Newsreader).
 */
import type { Lang } from "./i18n";

export interface HomeTexts {
  title: string;
  metaDesc: string;
  /* Kopfzeile */
  rateLong: string;
  rateShort: string;
  rateAria: string;
  navAria: string;
  navStudio: string;
  navTreat: string;
  navHow: string;
  navFaq: string;
  book: string;
  menu: string;
  /* Start */
  heroEyebrow: string;
  h1A: string;
  h1B: string;
  lead: string;
  googleA: string;
  googleB: string;
  heroAlt: string;
  docRole: string;
  /* Ihr Arzt */
  docEyebrow: string;
  docHA: string;
  docHB: string;
  handAlt: string;
  quote: string;
  address: string;
  mapL: string;
  studioOpen: string;
  studioClose: string;
  photoConsult: string;
  photoTreat: string;
  photoStudio: string;
  photoEntrance: string;
  /* Für wen */
  whyEyebrow: string;
  whyHA: string;
  whyHB: string;
  why1H: string;
  why1P: string;
  why2H: string;
  why2P: string;
  why3H: string;
  why3P: string;
  why4H: string;
  why4P: string;
  why5H: string;
  why5P: string;
  why6H: string;
  why6P: string;
  /* Behandlungen */
  treatEyebrow: string;
  treatHA: string;
  treatHB: string;
  t1H: string;
  t1D: string;
  t1Alt: string;
  t2H: string;
  t2D: string;
  t2Alt: string;
  t3H: string;
  t3D: string;
  t3Alt: string;
  t4H: string;
  t4D: string;
  t4Alt: string;
  /** „ab 120 €*“ */
  priceFrom: (price: string) => string;
  allPrices: string;
  pZones: string;
  pZone1: string;
  pZone2: string;
  pZone3: string;
  pZoneMore: string;
  pNefD: string;
  pAchselH: string;
  pAchselD: string;
  pLachsH: string;
  pLachs1: string;
  pLachs4: string;
  pnote: string;
  /* Ablauf */
  howEyebrow: string;
  howHA: string;
  howHB: string;
  s1H: string;
  s1P: string;
  s2H: string;
  s2P: string;
  s3H: string;
  s3P: string;
  /* Bewertungen */
  revEyebrow: string;
  revHA: string;
  revHB: string;
  allReviews: string;
  revNote: string;
  /* Fragen */
  faqHA: string;
  faqHB: string;
  q1: string;
  a1: string;
  q2: string;
  a2: string;
  q3: string;
  a3: string;
  q4: string;
  a4: string;
  /* Abschluss und Fußzeile */
  ctaHA: string;
  ctaHB: string;
  copyright: string;
  imprint: string;
  privacy: string;
}

/* Kundenstimmen von Google Maps: Zitate bleiben in der Originalsprache und werden nicht übersetzt */
export const REVIEWS: { text: string; lang: Lang; name: string; initial: string }[] = [
  { text: "„Ich bin selbst Ärztin (…). Bei Dr. Sebastian Vogel habe ich mich von Anfang an sehr gut aufgehoben gefühlt.“", lang: "de", name: "Kathleen", initial: "K" },
  { text: "„Er nimmt sich immer Zeit und hat beim ersten Mal direkt gesehen, dass meine linke Zornesfalte stärker ist als die rechte (…).“", lang: "de", name: "Antje D.", initial: "A" },
  { text: "„Dr. Vogel is a true professional (…). The location is also beautifully designed and makes you feel welcomed immediately.“", lang: "en", name: "Cyril S.", initial: "C" },
];

const de: HomeTexts = {
  title: "PALO SKIN by Dr. Vogel | Ärztliche Faltenbehandlung in Berlin",
  metaDesc: "PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg: ärztliche Faltenbehandlung durch Dr. med. Sebastian Vogel. Termine online buchen, auch kurzfristig.",
  rateLong: "★ 5,0 Kundenbewertungen",
  rateShort: "★ 5,0",
  rateAria: "5,0 Kundenbewertungen auf Google Maps",
  navAria: "Hauptmenü",
  navStudio: "Studio",
  navTreat: "Behandlungen",
  navHow: "Ablauf",
  navFaq: "Fragen",
  book: "Termin buchen",
  menu: "Menü",
  heroEyebrow: "Berlin Prenzlauer Berg",
  h1A: "Goodbye",
  h1B: "wrinkles.",
  lead: "Ärztliche Faltenbehandlung und Skin Booster. Mitten im Kollwitzkiez.",
  googleA: "5,0",
  googleB: "bei Google",
  heroAlt: "Dr. med. Sebastian Vogel im Studio PALO SKIN",
  docRole: "Arzt und Gründer von PALO SKIN",
  docEyebrow: "Ihr Arzt · chirurgisch geschult",
  docHA: "Eine ruhige",
  docHB: "Hand.",
  handAlt: "Ruhig übereinanderliegende Hände von Dr. Vogel auf dem schwarzen Tisch im Studio",
  quote: "„Ich bin Dr. med. Sebastian Vogel. Ich habe mehrere Jahre in der Chirurgie und in weiteren Fachrichtungen gearbeitet und viele tausend ästhetische Behandlungen durchgeführt. Bei PALO SKIN behandle ich Sie selbst. Mein Ziel sind dezente Ergebnisse, die zu Ihrem Gesicht passen.“",
  address: "Hagenauer Straße 14, 10435 Berlin, Prenzlauer Berg",
  mapL: "So finden Sie uns",
  studioOpen: "Das Studio ansehen",
  studioClose: "Fotos schließen",
  photoConsult: "Beratungsraum",
  photoTreat: "Behandlungsraum",
  photoStudio: "Im Studio",
  photoEntrance: "Eingang",
  whyEyebrow: "Für wen",
  whyHA: "Für wen ich PALO SKIN",
  whyHB: "gegründet habe.",
  why1H: "Pünktlich statt Wartezimmer.",
  why1P: "Für alle, die ihren Termin in einen vollen Alltag einbauen müssen.",
  why2H: "Kaum Papierkram.",
  why2P: "Für Menschen, die es einfach mögen: Wir fragen nur, was zählt.",
  why3H: "Gemütlich statt klinisch.",
  why3P: "Für diejenigen, die sich auch beim Arzt wohlfühlen möchten.",
  why4H: "Behandlung in Ihrer Sprache.",
  why4P: "Für Berlin und die Welt: Behandlung auf Deutsch, Englisch, Spanisch, Französisch und Portugiesisch.",
  why5H: "Besonders feine Nadeln.",
  why5P: "Für alle, die eine möglichst sanfte Behandlung möchten.",
  why6H: "Nur Originalpräparate.",
  why6P: "Für Menschen, die wissen wollen, was sie bekommen: aus deutschen Apotheken.",
  treatEyebrow: "Behandlungen und Preise",
  treatHA: "Genau, was Sie brauchen.",
  treatHB: "Zu fairen Preisen.",
  t1H: "Faltenbehandlung und mehr",
  t1D: "Zornesfalte, Stirn, Krähenfüße und weitere Zonen.",
  t1Alt: "Seidenfalte in Creme",
  t2H: "Kaumuskel (Masseter)",
  t2D: "Gesichtskontur und Zähneknirschen.",
  t2Alt: "Mann mit geschlossenen Augen, Hand an der Wange",
  t3H: "Nefertiti-Lift",
  t3D: "Hals und Kieferkontur.",
  t3Alt: "helle Steinbüste der Nofretete im Profil",
  t4H: "Lachs-DNA",
  t4D: "Polynukleotide für dunkle Augenringe und die Augenpartie.",
  t4Alt: "Augenpartie einer Frau",
  priceFrom: (p) => `ab ${p}`,
  allPrices: "Alle Preise ansehen",
  pZones: "Faltenbehandlung und mehr",
  pZone1: "1 Zone",
  pZone2: "2 Zonen",
  pZone3: "3 Zonen",
  pZoneMore: "jede weitere Zone",
  pNefD: "Hals und Kieferkontur",
  pAchselH: "Übermäßiges Schwitzen (Hyperhidrose)",
  pAchselD: "Achseln",
  pLachsH: "Lachs-DNA (Polynukleotide)",
  pLachs1: "Eine Behandlung",
  pLachs4: "Vier Behandlungen",
  pnote: "* Richtwerte. Abrechnung nach der Gebührenordnung für Ärzte. Preise inklusive Mehrwertsteuer.",
  howEyebrow: "Ihr Termin",
  howHA: "Erst das Gespräch.",
  howHB: "Dann die Behandlung.",
  s1H: "Wann es Ihnen passt.",
  s1P: "Termine vor und nach der Arbeit und auch am Wochenende. Verschieben können Sie selbst, bis 24 Stunden vorher.",
  s2H: "Eine ausführliche Beratung.",
  s2P: "Was möchten Sie verändern? Wir besprechen Möglichkeiten, Grenzen, Risiken und Kosten.",
  s3H: "Ganz ohne Druck.",
  s3P: "Passt die Behandlung zu Ihnen, ist sie direkt im selben Termin möglich. Und wer lieber noch einmal nachdenkt, ist genauso willkommen.",
  revEyebrow: "Bewertungen",
  revHA: "Was Kunden",
  revHB: "über uns sagen.",
  allReviews: "Alle Bewertungen auf Google Maps",
  revNote: "Ausgewählte Auszüge aus Google-Bewertungen, zum Teil gekürzt. Die Verfasser sind Kunden des Studios. Google selbst prüft nicht, ob Bewertungen von Kunden stammen.",
  faqHA: "Häufige",
  faqHB: "Fragen.",
  q1: "Was ist eine Zone?",
  a1: "Ein Behandlungsbereich, zum Beispiel Zornesfalte, Stirn oder Krähenfüße (beide Seiten zusammen). Weitere Zonen: Lip Flip, Brow Lift, Mundwinkel, Erdbeerkinn, Gummy Smile, Oberlippenfältchen, Bunny Lines, Nasenverschmälerung.",
  q2: "Wann kann ich wieder zur Arbeit?",
  a2: "Meist direkt danach. Rötungen, leichte Schwellungen oder kleine blaue Flecken sind möglich und können eine Weile sichtbar sein. Was Sie danach beachten sollten, besprechen wir vorab.",
  q3: "Wann wirkt die Faltenbehandlung und wie lange hält sie?",
  a3: "Die Wirkung beginnt meist nach zwei bis drei Tagen und ist nach etwa zwei Wochen vollständig. Sie hält in der Regel drei bis sechs Monate, das ist von Mensch zu Mensch verschieden.",
  q4: "Gibt es Gründe, nicht zu behandeln?",
  a4: "Ja, zum Beispiel Schwangerschaft und Stillzeit, bestimmte Muskelerkrankungen, akute Infekte im Behandlungsbereich und bekannte Unverträglichkeiten. Ob die Behandlung für Sie geeignet ist, klären wir vor jeder Behandlung im Gespräch.",
  ctaHA: "Ihr Termin.",
  ctaHB: "Ganz flexibel.",
  copyright: "© 2026 PALO SKIN by Dr. Vogel",
  imprint: "Impressum",
  privacy: "Datenschutz",
};

/* Übersetzungen folgen im eigenen Commit „Sprachen“; bis dahin Deutsch */
export const HOME_TEXTS: Record<Lang, HomeTexts> = { de, en: de, es: de, fr: de, pt: de, uk: de, ar: de };
