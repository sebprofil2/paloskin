import type { Lang } from "./treatments";

/*
 * Texte der Bestätigungsmail, der Erinnerungsmail und der Terminseite /termin/<token>.
 * Deutsch wörtlich nach der Freigabe von Dr. Vogel (2. Oktober 2026, „Texte Bestätigungsmail, Erinnerungsmail und
 * Terminseite freigegeben“). Die Übersetzungen stehen zur Freigabe in docs/TEXTE-MAILS.md.
 * Regeln: Marke „PALO SKIN by Dr. Vogel“, keine Buchungsnummer, keine Behandlung, warm und kurz.
 */
export const PHONE = "+49 151 58872566";
export const WA_LINK = "https://wa.me/4915158872566";
export const ADDRESS = "Hagenauer Straße 14, 10435 Berlin";
export const STREET = "Hagenauer Straße 14";
export const MAPS_LINK = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADDRESS);
export const STUDIO = "PALO SKIN by Dr. Vogel";
export const BRAND = "PALO SKIN";
export const SIGNER = "Dr. med. Sebastian Vogel";

export interface MailTexts {
  /* Bestätigungsmail */
  subjectBinding: (date: string, time: string) => string;
  subjectRequest: (date: string, time: string) => string;
  greeting: (firstName: string) => string;
  introBinding: string;
  introRequest: string;
  both: string;
  mapL: string;
  reminderNote: string;
  cancelLead: string;
  cancelLink: string;
  cancelRule: string;
  icsNote: string;
  closing: string;
  /* Erinnerungsmail */
  subjectReminder: (time: string) => string;
  introReminder: (date: string, time: string) => string;
  oneClick: string;
  yes: string;
  reminderCancel: string;
  closingReminder: string;
  /* Kalenderdatei */
  icsTitle: string;
  icsDescription: string;
  /* Terminseite */
  pageTitle: string;
  cancel: string;
  tooLate: string;
  waButton: string;
  doneYes: (weekday: string, time: string) => string;
  doneCancel: string;
  newBooking: string;
  cancelledInfo: string;
  past: string;
  invalid: string;
  cancelQ: (date: string, time: string) => string;
  cancelYes: string;
  cancelNo: string;
  testNote: string;
}

const NB = "\u00A0";

export const MAIL_TEXTS: Record<Lang, MailTexts> = {
  de: {
    subjectBinding: (d, t) => `Ihr Termin bei ${BRAND} am ${d} um ${t}`,
    subjectRequest: (d, t) => `Ihre Terminanfrage bei ${BRAND} am ${d} um ${t}`,
    greeting: (n) => `Guten Tag ${n},`,
    introBinding: "schön, dass Sie kommen. Ihr Termin steht:",
    introRequest: "schön, dass Sie kommen möchten. Wir haben die Zeit für Sie vorgemerkt und melden uns kurz per WhatsApp:",
    both: "Wir haben für Sie beide Zeit eingeplant.",
    mapL: "Karte öffnen",
    reminderNote: "Einen Tag vorher erinnern wir Sie noch einmal kurz.",
    cancelLead: "Kommt etwas dazwischen?",
    cancelLink: "Termin absagen oder verschieben",
    cancelRule: `Bitte mindestens 48 Stunden vorher, dann freut sich jemand anderes über die Zeit. Kurzfristig erreichen Sie uns per WhatsApp unter ${PHONE}.`,
    icsNote: "Die Kalenderdatei für Ihr Handy hängt an.",
    closing: "Bis bald",
    subjectReminder: (t) => `Morgen um ${t} bei ${BRAND}`,
    introReminder: (d, t) => `morgen ist es so weit: ${d}, ${t}, bei uns in der ${STREET}. Wir freuen uns auf Sie.`,
    oneClick: "Ein Klick genügt:",
    yes: "Ja, ich komme",
    reminderCancel: `Falls es doch nicht passt, schreiben Sie uns bitte kurz per WhatsApp unter ${PHONE}, dann finden wir eine neue Zeit.`,
    closingReminder: "Bis morgen",
    icsTitle: `Termin bei ${BRAND}`,
    icsDescription: `Absagen oder verschieben bitte mindestens 48 Stunden vorher. Kurzfristig per WhatsApp unter ${PHONE}.`,
    pageTitle: "Ihr Termin",
    cancel: "Termin absagen",
    tooLate: "Für eine Absage ist es jetzt zu kurzfristig für einen Klick. Schreiben Sie uns bitte kurz per WhatsApp, wir finden gemeinsam eine Lösung.",
    waButton: "Per WhatsApp schreiben",
    doneYes: (w, t) => `Danke, wir freuen uns auf Sie. Bis ${w} um ${t}.`,
    doneCancel: "Schade, aber kein Problem. Die Zeit ist wieder frei. Wenn Sie möchten, buchen Sie gleich eine neue.",
    newBooking: "Neuen Termin buchen",
    cancelledInfo: "Dieser Termin wurde abgesagt. Wenn Sie möchten, buchen Sie gleich einen neuen.",
    past: "Dieser Termin liegt in der Vergangenheit.",
    invalid: "Dieser Link funktioniert nicht mehr. Schreiben Sie uns gern per WhatsApp.",
    cancelQ: (d, t) => `Möchten Sie den Termin am ${d} um ${t} wirklich absagen?`,
    cancelYes: "Ja, Termin absagen",
    cancelNo: "Nein, Termin behalten",
    testNote: "Testbetrieb: Diese Nachricht gehört zu einer Testbuchung.",
  },
  en: {
    subjectBinding: (d, t) => `Your appointment at ${BRAND} on ${d} at ${t}`,
    subjectRequest: (d, t) => `Your appointment request at ${BRAND} for ${d} at ${t}`,
    greeting: (n) => `Hello ${n},`,
    introBinding: "lovely that you’re coming. Your appointment is set:",
    introRequest: "lovely that you’d like to come. We have reserved the time for you and will be in touch shortly on WhatsApp:",
    both: "We have planned time for both of you.",
    mapL: "Open map",
    reminderNote: "We’ll send you a short reminder the day before.",
    cancelLead: "Something come up?",
    cancelLink: "Cancel or reschedule appointment",
    cancelRule: `Please give us at least 48 hours’ notice, so someone else can enjoy the time. At short notice, reach us on WhatsApp at ${PHONE}.`,
    icsNote: "The calendar file for your phone is attached.",
    closing: "See you soon",
    subjectReminder: (t) => `Tomorrow at ${t} at ${BRAND}`,
    introReminder: (d, t) => `tomorrow is the day: ${d}, ${t}, at our studio at ${STREET}. We look forward to seeing you.`,
    oneClick: "One click is all it takes:",
    yes: "Yes, I’ll be there",
    reminderCancel: `If it doesn’t work out after all, please send us a quick WhatsApp message at ${PHONE} and we’ll find a new time.`,
    closingReminder: "See you tomorrow",
    icsTitle: `Appointment at ${BRAND}`,
    icsDescription: `Please cancel or reschedule at least 48 hours in advance. At short notice via WhatsApp at ${PHONE}.`,
    pageTitle: "Your appointment",
    cancel: "Cancel appointment",
    tooLate: "It’s too short notice now to cancel with a click. Please send us a quick WhatsApp message and we’ll find a solution together.",
    waButton: "Message us on WhatsApp",
    doneYes: (w, t) => `Thank you, we look forward to seeing you. See you ${w} at ${t}.`,
    doneCancel: "What a pity, but no problem. The time is free again. If you like, book a new one right away.",
    newBooking: "Book a new appointment",
    cancelledInfo: "This appointment has been cancelled. If you like, book a new one right away.",
    past: "This appointment is in the past.",
    invalid: "This link no longer works. Feel free to message us on WhatsApp.",
    cancelQ: (d, t) => `Do you really want to cancel the appointment on ${d} at ${t}?`,
    cancelYes: "Yes, cancel appointment",
    cancelNo: "No, keep appointment",
    testNote: "Test mode: this message belongs to a test booking.",
  },
  es: {
    subjectBinding: (d, t) => `Su cita en ${BRAND} el ${d} a las ${t}`,
    subjectRequest: (d, t) => `Su solicitud de cita en ${BRAND} para el ${d} a las ${t}`,
    greeting: (n) => `Hola ${n},`,
    introBinding: "qué bien que venga. Su cita está confirmada:",
    introRequest: "qué bien que quiera venir. Hemos reservado la hora para usted y le escribimos en breve por WhatsApp:",
    both: "Hemos reservado tiempo para los dos.",
    mapL: "Abrir mapa",
    reminderNote: "Un día antes le enviaremos un breve recordatorio.",
    cancelLead: "¿Le surge algo?",
    cancelLink: "Cancelar o cambiar la cita",
    cancelRule: `Por favor, con al menos 48 horas de antelación; así otra persona podrá aprovechar la hora. Con poco margen, escríbanos por WhatsApp al ${PHONE}.`,
    icsNote: "Adjuntamos el archivo de calendario para su móvil.",
    closing: "Hasta pronto",
    subjectReminder: (t) => `Mañana a las ${t} en ${BRAND}`,
    introReminder: (d, t) => `mañana es el día: ${d}, ${t}, en nuestro estudio en ${STREET}. Le esperamos.`,
    oneClick: "Basta un clic:",
    yes: "Sí, voy a ir",
    reminderCancel: `Si al final no le viene bien, escríbanos un momento por WhatsApp al ${PHONE} y buscamos una nueva hora.`,
    closingReminder: "Hasta mañana",
    icsTitle: `Cita en ${BRAND}`,
    icsDescription: `Para cancelar o cambiar la cita, avísenos con al menos 48 horas de antelación. Con poco margen, por WhatsApp al ${PHONE}.`,
    pageTitle: "Su cita",
    cancel: "Cancelar cita",
    tooLate: "Ya es demasiado tarde para cancelar con un clic. Escríbanos un momento por WhatsApp y encontramos juntos una solución.",
    waButton: "Escribir por WhatsApp",
    doneYes: (w, t) => `Gracias, le esperamos. Hasta el ${w} a las ${t}.`,
    doneCancel: "Qué pena, pero no pasa nada. La hora vuelve a estar libre. Si quiere, reserve una nueva ahora mismo.",
    newBooking: "Reservar una nueva cita",
    cancelledInfo: "Esta cita ha sido cancelada. Si quiere, reserve una nueva ahora mismo.",
    past: "Esta cita ya ha pasado.",
    invalid: "Este enlace ya no funciona. Escríbanos por WhatsApp cuando quiera.",
    cancelQ: (d, t) => `¿Quiere cancelar realmente la cita del ${d} a las ${t}?`,
    cancelYes: "Sí, cancelar cita",
    cancelNo: "No, mantener cita",
    testNote: "Modo de prueba: este mensaje pertenece a una reserva de prueba.",
  },
  fr: {
    subjectBinding: (d, t) => `Votre rendez-vous chez ${BRAND} le ${d} à ${t}`,
    subjectRequest: (d, t) => `Votre demande de rendez-vous chez ${BRAND} pour le ${d} à ${t}`,
    greeting: (n) => `Bonjour ${n},`,
    introBinding: `quel plaisir de vous accueillir. Votre rendez-vous est fixé${NB}:`,
    introRequest: `quel plaisir que vous souhaitiez venir. Nous avons réservé le créneau pour vous et vous écrivons rapidement sur WhatsApp${NB}:`,
    both: "Nous avons prévu du temps pour vous deux.",
    mapL: "Ouvrir la carte",
    reminderNote: "La veille, nous vous enverrons un petit rappel.",
    cancelLead: `Un imprévu${NB}?`,
    cancelLink: "Annuler ou déplacer le rendez-vous",
    cancelRule: `Merci de nous prévenir au moins 48 heures à l’avance, pour que quelqu’un d’autre profite du créneau. En cas d’urgence, écrivez-nous sur WhatsApp au ${PHONE}.`,
    icsNote: "Le fichier de calendrier pour votre téléphone est joint.",
    closing: "À bientôt",
    subjectReminder: (t) => `Demain à ${t} chez ${BRAND}`,
    introReminder: (d, t) => `c’est demain${NB}: ${d}, ${t}, chez nous au ${STREET}. Nous avons hâte de vous accueillir.`,
    oneClick: `Un clic suffit${NB}:`,
    yes: "Oui, je viens",
    reminderCancel: `Si cela ne vous convient finalement pas, écrivez-nous un petit mot sur WhatsApp au ${PHONE} et nous trouverons un nouveau créneau.`,
    closingReminder: "À demain",
    icsTitle: `Rendez-vous chez ${BRAND}`,
    icsDescription: `Pour annuler ou déplacer, merci de nous prévenir au moins 48 heures à l’avance. En cas d’urgence, sur WhatsApp au ${PHONE}.`,
    pageTitle: "Votre rendez-vous",
    cancel: "Annuler le rendez-vous",
    tooLate: "Il est maintenant trop tard pour annuler d’un clic. Écrivez-nous un petit mot sur WhatsApp, nous trouverons une solution ensemble.",
    waButton: "Écrire sur WhatsApp",
    doneYes: (w, t) => `Merci, nous avons hâte de vous accueillir. À ${w} à ${t}.`,
    doneCancel: "Dommage, mais aucun problème. Le créneau est de nouveau libre. Si vous le souhaitez, réservez tout de suite un nouveau rendez-vous.",
    newBooking: "Réserver un nouveau rendez-vous",
    cancelledInfo: "Ce rendez-vous a été annulé. Si vous le souhaitez, réservez tout de suite un nouveau rendez-vous.",
    past: "Ce rendez-vous est passé.",
    invalid: "Ce lien ne fonctionne plus. Écrivez-nous volontiers sur WhatsApp.",
    cancelQ: (d, t) => `Voulez-vous vraiment annuler le rendez-vous du ${d} à ${t}${NB}?`,
    cancelYes: "Oui, annuler le rendez-vous",
    cancelNo: "Non, garder le rendez-vous",
    testNote: `Mode test${NB}: ce message concerne une réservation de test.`,
  },
  pt: {
    subjectBinding: (d, t) => `Sua consulta na ${BRAND} em ${d} às ${t}`,
    subjectRequest: (d, t) => `Seu pedido de horário na ${BRAND} para ${d} às ${t}`,
    greeting: (n) => `Olá ${n},`,
    introBinding: "que bom que você vem. Sua consulta está marcada:",
    introRequest: "que bom que você quer vir. Reservamos o horário para você e falamos em breve pelo WhatsApp:",
    both: "Reservamos tempo para vocês dois.",
    mapL: "Abrir mapa",
    reminderNote: "Um dia antes, mandamos um lembrete rápido.",
    cancelLead: "Surgiu um imprevisto?",
    cancelLink: "Cancelar ou remarcar a consulta",
    cancelRule: `Por favor, com pelo menos 48 horas de antecedência, assim outra pessoa aproveita o horário. Em cima da hora, fale conosco pelo WhatsApp no ${PHONE}.`,
    icsNote: "O arquivo de calendário para o seu celular está em anexo.",
    closing: "Até breve",
    subjectReminder: (t) => `Amanhã às ${t} na ${BRAND}`,
    introReminder: (d, t) => `amanhã é o dia: ${d}, ${t}, aqui no estúdio na ${STREET}. Esperamos por você.`,
    oneClick: "Basta um clique:",
    yes: "Sim, eu vou",
    reminderCancel: `Se no fim não der certo, mande uma mensagem rápida pelo WhatsApp no ${PHONE} e encontramos um novo horário.`,
    closingReminder: "Até amanhã",
    icsTitle: `Consulta na ${BRAND}`,
    icsDescription: `Para cancelar ou remarcar, avise com pelo menos 48 horas de antecedência. Em cima da hora, pelo WhatsApp no ${PHONE}.`,
    pageTitle: "Sua consulta",
    cancel: "Cancelar consulta",
    tooLate: "Agora está em cima da hora para cancelar com um clique. Mande uma mensagem rápida pelo WhatsApp e encontramos uma solução juntos.",
    waButton: "Escrever pelo WhatsApp",
    doneYes: (w, t) => `Obrigado, esperamos por você. Até ${w} às ${t}.`,
    doneCancel: "Que pena, mas sem problema. O horário está livre novamente. Se quiser, marque um novo agora mesmo.",
    newBooking: "Marcar uma nova consulta",
    cancelledInfo: "Esta consulta foi cancelada. Se quiser, marque uma nova agora mesmo.",
    past: "Esta consulta já passou.",
    invalid: "Este link não funciona mais. Fale conosco pelo WhatsApp quando quiser.",
    cancelQ: (d, t) => `Deseja realmente cancelar a consulta de ${d} às ${t}?`,
    cancelYes: "Sim, cancelar consulta",
    cancelNo: "Não, manter consulta",
    testNote: "Modo de teste: esta mensagem pertence a uma reserva de teste.",
  },
};
