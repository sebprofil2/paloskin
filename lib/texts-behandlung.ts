import type { Abschnitt } from "./behandlungen";
import type { Lang } from "./i18n";

/*
 * Feste Beschriftungen der Behandlungsseiten (Vorlage vom 10. Oktober 2026) in allen neun Sprachen. Die Inhalte je Seite
 * stehen in lib/behandlungen.ts. Platzhalter „{name}“ steht für den Link zur Arztseite, „{datum}“ für das Prüfdatum,
 * „{sprachen}“ für die Beratungssprachen.
 */
export type BehandlungTexte = {
  krumenAria: string;
  startseite: string;
  behandlungen: string;
  kurz: string;
  abschnitt: Record<Abschnitt, string>;
  richtwert: string;
  fragen: string;
  quellen: string;
  passend: string;
  sprachen: string;
  geprueft: string;
  pruefungOffen: string;
};

const T: Record<Lang, BehandlungTexte> = {
  de: {
    krumenAria: "Sie sind hier",
    startseite: "Startseite",
    behandlungen: "Behandlungen",
    kurz: "Kurz gesagt",
    abschnitt: { fuerWen: "Für wen?", grenzen: "Grenzen?", ablauf: "Ablauf?", risiken: "Risiken?", kosten: "Kosten?", danach: "Danach?" },
    richtwert: "Richtwert",
    fragen: "Häufige Fragen",
    quellen: "Quellen",
    passend: "Passende Behandlungen",
    sprachen: "Wir beraten und behandeln Sie auf {sprachen}.",
    geprueft: "Medizinisch geprüft von {name}, Arzt. Stand: {datum}",
    pruefungOffen: "Platzhalter: Die medizinische Prüfung durch {name} steht noch aus.",
  },
  en: {
    krumenAria: "You are here",
    startseite: "Home",
    behandlungen: "Treatments",
    kurz: "In short",
    abschnitt: { fuerWen: "Who is it for?", grenzen: "Limits?", ablauf: "Procedure?", risiken: "Risks?", kosten: "Costs?", danach: "Afterwards?" },
    richtwert: "Guide price",
    fragen: "Frequently asked questions",
    quellen: "Sources",
    passend: "Related treatments",
    sprachen: "We advise and treat you in {sprachen}.",
    geprueft: "Medically reviewed by {name}, physician. Last updated: {datum}",
    pruefungOffen: "Placeholder: the medical review by {name} is still pending.",
  },
  es: {
    krumenAria: "Está aquí",
    startseite: "Inicio",
    behandlungen: "Tratamientos",
    kurz: "En resumen",
    abschnitt: { fuerWen: "¿Para quién?", grenzen: "¿Límites?", ablauf: "¿Cómo se realiza?", risiken: "¿Riesgos?", kosten: "¿Costes?", danach: "¿Y después?" },
    richtwert: "Precio orientativo",
    fragen: "Preguntas frecuentes",
    quellen: "Fuentes",
    passend: "Tratamientos relacionados",
    sprachen: "Le asesoramos y tratamos en {sprachen}.",
    geprueft: "Revisado médicamente por {name}, médico. Actualizado: {datum}",
    pruefungOffen: "Texto provisional: la revisión médica de {name} aún está pendiente.",
  },
  fr: {
    krumenAria: "Vous êtes ici",
    startseite: "Accueil",
    behandlungen: "Soins",
    kurz: "En bref",
    abschnitt: { fuerWen: "Pour qui ?", grenzen: "Limites ?", ablauf: "Déroulement ?", risiken: "Risques ?", kosten: "Coûts ?", danach: "Et après ?" },
    richtwert: "Prix indicatif",
    fragen: "Questions fréquentes",
    quellen: "Sources",
    passend: "Soins associés",
    sprachen: "Nous vous conseillons et vous soignons en {sprachen}.",
    geprueft: "Vérifié médicalement par {name}, médecin. Mise à jour : {datum}",
    pruefungOffen: "Texte provisoire : la vérification médicale par {name} est encore en attente.",
  },
  pt: {
    krumenAria: "Você está aqui",
    startseite: "Início",
    behandlungen: "Tratamentos",
    kurz: "Em resumo",
    abschnitt: { fuerWen: "Para quem?", grenzen: "Limites?", ablauf: "Como funciona?", risiken: "Riscos?", kosten: "Custos?", danach: "E depois?" },
    richtwert: "Valor de referência",
    fragen: "Perguntas frequentes",
    quellen: "Fontes",
    passend: "Tratamentos relacionados",
    sprachen: "Orientamos e tratamos você em {sprachen}.",
    geprueft: "Revisado clinicamente por {name}, médico. Atualizado em: {datum}",
    pruefungOffen: "Texto provisório: a revisão médica de {name} ainda está pendente.",
  },
  it: {
    krumenAria: "Lei è qui",
    startseite: "Home",
    behandlungen: "Trattamenti",
    kurz: "In breve",
    abschnitt: { fuerWen: "Per chi?", grenzen: "Limiti?", ablauf: "Come si svolge?", risiken: "Rischi?", kosten: "Costi?", danach: "E dopo?" },
    richtwert: "Prezzo indicativo",
    fragen: "Domande frequenti",
    quellen: "Fonti",
    passend: "Trattamenti correlati",
    sprachen: "La consigliamo e la trattiamo in {sprachen}.",
    geprueft: "Revisione medica di {name}, medico. Aggiornato al: {datum}",
    pruefungOffen: "Testo provvisorio: la revisione medica di {name} è ancora in sospeso.",
  },
  tr: {
    krumenAria: "Buradasınız",
    startseite: "Ana sayfa",
    behandlungen: "Tedaviler",
    kurz: "Kısaca",
    abschnitt: { fuerWen: "Kimler için?", grenzen: "Sınırlar?", ablauf: "Nasıl uygulanır?", risiken: "Riskler?", kosten: "Ücret?", danach: "Sonrası?" },
    richtwert: "Tahmini fiyat",
    fragen: "Sık sorulan sorular",
    quellen: "Kaynaklar",
    passend: "İlgili tedaviler",
    sprachen: "Danışma ve tedavi dilleri: {sprachen}.",
    geprueft: "Tıbbi kontrol: {name}, hekim. Tarih: {datum}",
    pruefungOffen: "Geçici metin: {name} tarafından tıbbi kontrol henüz yapılmadı.",
  },
  uk: {
    krumenAria: "Ви тут",
    startseite: "Головна",
    behandlungen: "Процедури",
    kurz: "Коротко",
    abschnitt: { fuerWen: "Для кого?", grenzen: "Обмеження?", ablauf: "Як проходить?", risiken: "Ризики?", kosten: "Вартість?", danach: "Що далі?" },
    richtwert: "Орієнтовна ціна",
    fragen: "Часті запитання",
    quellen: "Джерела",
    passend: "Схожі процедури",
    sprachen: "Мови консультацій і процедур: {sprachen}.",
    geprueft: "Медична перевірка: {name}, лікар. Станом на: {datum}",
    pruefungOffen: "Тимчасовий текст: медична перевірка {name} ще не відбулася.",
  },
  ar: {
    krumenAria: "أنت هنا",
    startseite: "الرئيسية",
    behandlungen: "العلاجات",
    kurz: "باختصار",
    abschnitt: { fuerWen: "لمن؟", grenzen: "الحدود؟", ablauf: "كيف تتم؟", risiken: "المخاطر؟", kosten: "التكلفة؟", danach: "ماذا بعد؟" },
    richtwert: "سعر استرشادي",
    fragen: "أسئلة شائعة",
    quellen: "المصادر",
    passend: "علاجات ذات صلة",
    sprachen: "لغات الاستشارة والعلاج: {sprachen}.",
    geprueft: "مراجعة طبية: {name}، طبيب. آخر تحديث: {datum}",
    pruefungOffen: "نص مؤقت: المراجعة الطبية من {name} لم تتم بعد.",
  },
};

export const BEHANDLUNG_TEXTE = T;
