import type { Lang } from "./treatments";

/*
 * Endgültige Kundentexte (Freigabe von Dr. Vogel, 3. Oktober 2026, abends): Bestätigungsmail, Erinnerungsmail,
 * Kalenderdatei, Terminseite. Deutsch wörtlich, die anderen Sprachen sinngemäß im selben Ton. Betreffzeilen höchstens
 * 40 Zeichen mit Datum und Uhrzeit vorn. Die Textliste zur Freigabe steht in docs/TEXTE-MAILS.md.
 */
export const PHONE = "+49 151 58872566";
export const WA_LINK = "https://wa.me/4915158872566";
export const ADDRESS = "Hagenauer Straße 14, 10435 Berlin";
/** Google-Unternehmensprofil (Ersatz: https://maps.google.com/?cid=16946433859280785681) */
export const MAPS_LINK = "https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8";
export const STUDIO = "PALO SKIN by Dr. Vogel";
export const BRAND = "PALO SKIN";
export const SIGNER = "Dr. med. Sebastian Vogel";

export interface MailTexts {
  /* Bestätigungsmail */
  subjectBooked: (dateShort: string, time: string) => string;
  subjectRequest: (dateShort: string, time: string) => string;
  greeting: (firstName: string) => string;
  introBooked: string;
  introRequest: string;
  mapL: string;
  punctual: string;
  both: string;
  saveQ: string;
  gcal: string;
  ical: string;
  ocal: string;
  reminderNote: string;
  cancelInfo: string;
  manageLink: string;
  closing: string;
  /* Erinnerungsmail */
  subjectReminder: (time: string) => string;
  introReminder: string;
  punctualShort: string;
  signQ: string;
  yes: string;
  reservedNote: string;
  reminderCancel: string;
  waButton: string;
  closingReminder: string;
  /* Kalenderdatei */
  icsTitle: string;
  icsDescription: string;
  /* Terminseite */
  pageTitle: string;
  pageIntro: string;
  askOpen: string;
  cancel: string;
  cancelQ: string;
  cancelYes: string;
  cancelNo: string;
  tooLate: string;
  doneYes: (date: string, time: string) => string;
  doneCancel: string;
  cancelledInfo: string;
  past: (date: string, time: string) => string;
  newBooking: string;
  invalid: string;
  testNote: string;
}

const NB = " ";

export const MAIL_TEXTS: Record<Lang, MailTexts> = {
  de: {
    subjectBooked: (d, t) => `Gebucht: ${d}, ${t}`,
    subjectRequest: (d, t) => `Angefragt: ${d}, ${t}`,
    greeting: (n) => `Hallo ${n},`,
    introBooked: "schön, dass Sie zu uns kommen! Wir freuen uns auf Sie:",
    introRequest: "schön, dass Sie zu uns kommen möchten! Wir haben die Zeit für Sie vorgemerkt und melden uns kurz per WhatsApp:",
    mapL: "So finden Sie uns",
    punctual: `Ihre Zeit ist uns wichtig: Bei ${BRAND} beginnt Ihr Termin pünktlich, ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher. Falls Sie später kommen, bleibt entsprechend weniger Zeit für Ihren Termin, damit auch die nächsten Kunden pünktlich starten.`,
    both: "Für Sie beide haben wir Zeit eingeplant.",
    saveQ: "Möchten Sie den Termin gleich im Kalender speichern?",
    gcal: "Google Kalender",
    ical: "iPhone-Kalender",
    ocal: "Outlook",
    reminderNote: "Am Tag vorher erinnern wir Sie noch einmal.",
    cancelInfo: `Falls etwas dazwischenkommt, können Sie Ihren Termin bis 48 Stunden vorher über den Link absagen. Danach schreiben Sie uns bitte per WhatsApp an ${PHONE}.`,
    manageLink: "Termin ansehen oder absagen",
    closing: "Bis bald!",
    subjectReminder: (t) => `Bis morgen um ${t}!`,
    introReminder: `morgen sehen wir uns bei ${BRAND}. Wir freuen uns auf Sie!`,
    punctualShort: "Ihr Termin beginnt pünktlich, ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher.",
    signQ: "Wenn Sie möchten, geben Sie uns kurz ein Zeichen:",
    yes: "Ja, ich komme",
    reservedNote: "Ihr Termin bleibt auch ohne Klick für Sie reserviert.",
    reminderCancel: `Falls etwas dazwischenkommt, schreiben Sie uns bitte per WhatsApp an ${PHONE}.`,
    waButton: "Per WhatsApp schreiben",
    closingReminder: "Bis morgen!",
    icsTitle: `Termin bei ${BRAND}`,
    icsDescription: `Absagen bis 48 Stunden vorher über den Link in Ihrer Bestätigung, danach per WhatsApp an ${PHONE}. So finden Sie uns: ${MAPS_LINK}`,
    pageTitle: "Ihr Termin",
    pageIntro: `hier finden Sie Ihren Termin bei ${BRAND}:`,
    askOpen: "Wenn Sie möchten, sagen Sie uns kurz Bescheid, dass Sie dabei sind. Ihr Termin bleibt auch ohne Bestätigung für Sie reserviert.",
    cancel: "Termin absagen",
    cancelQ: "Möchten Sie Ihren Termin absagen?",
    cancelYes: "Termin absagen",
    cancelNo: "Termin behalten",
    tooLate: "Möchten Sie absagen? Da Ihr Termin in weniger als 48 Stunden beginnt, schreiben Sie uns bitte kurz per WhatsApp.",
    doneYes: (d, t) => `Danke! Wir freuen uns auf Sie am ${d}, um ${t}.`,
    doneCancel: "Ihr Termin ist abgesagt. Wir freuen uns, Sie ein anderes Mal zu sehen.",
    cancelledInfo: "Ihr Termin ist bereits abgesagt. Möchten Sie einen neuen Termin finden?",
    past: (d, t) => `Der Termin war am ${d}, um ${t}. Möchten Sie einen neuen Termin vereinbaren?`,
    newBooking: "Neuen Termin buchen",
    invalid: "Dieser Link lässt sich nicht öffnen. Schreiben Sie uns kurz per WhatsApp, wir helfen Ihnen gern weiter.",
    testNote: "Testbetrieb: Diese Nachricht gehört zu einer Testbuchung.",
  },
  en: {
    subjectBooked: (d, t) => `Booked: ${d}, ${t}`,
    subjectRequest: (d, t) => `Requested: ${d}, ${t}`,
    greeting: (n) => `Hello ${n},`,
    introBooked: "lovely that you’re coming to see us! We look forward to seeing you:",
    introRequest: "lovely that you’d like to come! We have reserved the time for you and will be in touch shortly on WhatsApp:",
    mapL: "How to find us",
    punctual: `Your time matters to us: at ${BRAND}, your appointment starts on time, with no waiting. Please arrive at the agreed time or at most five minutes early. If you arrive later, there is correspondingly less time for your appointment, so the next clients can also start on time.`,
    both: "We have planned time for both of you.",
    saveQ: "Would you like to save the appointment to your calendar right away?",
    gcal: "Google Calendar",
    ical: "iPhone Calendar",
    ocal: "Outlook",
    reminderNote: "We’ll remind you once more the day before.",
    cancelInfo: `If something comes up, you can cancel your appointment via the link up to 48 hours in advance. After that, please message us on WhatsApp at ${PHONE}.`,
    manageLink: "View or cancel appointment",
    closing: "See you soon!",
    subjectReminder: (t) => `See you tomorrow at ${t}!`,
    introReminder: `we’ll see you tomorrow at ${BRAND}. We look forward to seeing you!`,
    punctualShort: "Your appointment starts on time, with no waiting. Please arrive at the agreed time or at most five minutes early.",
    signQ: "If you like, give us a quick sign:",
    yes: "Yes, I’ll be there",
    reservedNote: "Your appointment stays reserved for you even without a click.",
    reminderCancel: `If something comes up, please message us on WhatsApp at ${PHONE}.`,
    waButton: "Message us on WhatsApp",
    closingReminder: "See you tomorrow!",
    icsTitle: `Appointment at ${BRAND}`,
    icsDescription: `Cancel up to 48 hours in advance via the link in your confirmation, after that on WhatsApp at ${PHONE}. How to find us: ${MAPS_LINK}`,
    pageTitle: "Your appointment",
    pageIntro: `here is your appointment at ${BRAND}:`,
    askOpen: "If you like, let us know briefly that you’ll be there. Your appointment stays reserved for you even without confirmation.",
    cancel: "Cancel appointment",
    cancelQ: "Would you like to cancel your appointment?",
    cancelYes: "Cancel appointment",
    cancelNo: "Keep appointment",
    tooLate: "Would you like to cancel? As your appointment starts in less than 48 hours, please send us a quick WhatsApp message.",
    doneYes: (d, t) => `Thank you! We look forward to seeing you on ${d} at ${t}.`,
    doneCancel: "Your appointment is cancelled. We look forward to seeing you another time.",
    cancelledInfo: "Your appointment has already been cancelled. Would you like to find a new one?",
    past: (d, t) => `The appointment was on ${d} at ${t}. Would you like to arrange a new one?`,
    newBooking: "Book a new appointment",
    invalid: "This link cannot be opened. Send us a quick WhatsApp message and we’ll be happy to help.",
    testNote: "Test mode: this message belongs to a test booking.",
  },
  es: {
    subjectBooked: (d, t) => `Reservado: ${d}, ${t}`,
    subjectRequest: (d, t) => `Solicitado: ${d}, ${t}`,
    greeting: (n) => `Hola ${n},`,
    introBooked: "¡qué bien que venga a vernos! Le esperamos:",
    introRequest: "¡qué bien que quiera venir! Hemos reservado la hora para usted y le escribimos en breve por WhatsApp:",
    mapL: "Cómo llegar",
    punctual: `Su tiempo es importante para nosotros: en ${BRAND} su cita empieza puntual, sin espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes. Si llega más tarde, quedará menos tiempo para su cita, para que los siguientes clientes también empiecen puntuales.`,
    both: "Hemos reservado tiempo para los dos.",
    saveQ: "¿Quiere guardar la cita en su calendario ahora mismo?",
    gcal: "Google Calendar",
    ical: "Calendario del iPhone",
    ocal: "Outlook",
    reminderNote: "El día anterior se lo recordamos una vez más.",
    cancelInfo: `Si le surge algo, puede cancelar su cita a través del enlace hasta 48 horas antes. Después, escríbanos por WhatsApp al ${PHONE}.`,
    manageLink: "Ver o cancelar la cita",
    closing: "¡Hasta pronto!",
    subjectReminder: (t) => `¡Hasta mañana a las ${t}!`,
    introReminder: `mañana nos vemos en ${BRAND}. ¡Le esperamos!`,
    punctualShort: "Su cita empieza puntual, sin espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes.",
    signQ: "Si quiere, díganos brevemente que viene:",
    yes: "Sí, voy a ir",
    reservedNote: "Su cita queda reservada para usted aunque no haga clic.",
    reminderCancel: `Si le surge algo, escríbanos por WhatsApp al ${PHONE}.`,
    waButton: "Escribir por WhatsApp",
    closingReminder: "¡Hasta mañana!",
    icsTitle: `Cita en ${BRAND}`,
    icsDescription: `Cancele hasta 48 horas antes a través del enlace de su confirmación, después por WhatsApp al ${PHONE}. Cómo llegar: ${MAPS_LINK}`,
    pageTitle: "Su cita",
    pageIntro: `aquí tiene su cita en ${BRAND}:`,
    askOpen: "Si quiere, díganos brevemente que viene. Su cita queda reservada para usted aunque no confirme.",
    cancel: "Cancelar cita",
    cancelQ: "¿Quiere cancelar su cita?",
    cancelYes: "Cancelar cita",
    cancelNo: "Mantener cita",
    tooLate: "¿Quiere cancelar? Como su cita empieza en menos de 48 horas, escríbanos un momento por WhatsApp.",
    doneYes: (d, t) => `¡Gracias! Le esperamos el ${d} a las ${t}.`,
    doneCancel: "Su cita queda cancelada. Nos alegrará verle en otra ocasión.",
    cancelledInfo: "Su cita ya está cancelada. ¿Quiere buscar una nueva?",
    past: (d, t) => `La cita fue el ${d} a las ${t}. ¿Quiere concertar una nueva?`,
    newBooking: "Reservar una nueva cita",
    invalid: "Este enlace no se puede abrir. Escríbanos un momento por WhatsApp, le ayudamos con gusto.",
    testNote: "Modo de prueba: este mensaje pertenece a una reserva de prueba.",
  },
  fr: {
    subjectBooked: (d, t) => `Réservé${NB}: ${d}, ${t}`,
    subjectRequest: (d, t) => `Demandé${NB}: ${d}, ${t}`,
    greeting: (n) => `Bonjour ${n},`,
    introBooked: `quel plaisir de vous accueillir${NB}! Nous avons hâte de vous voir${NB}:`,
    introRequest: `quel plaisir que vous souhaitiez venir${NB}! Nous avons réservé le créneau pour vous et vous écrivons rapidement sur WhatsApp${NB}:`,
    mapL: "Comment nous trouver",
    punctual: `Votre temps nous est précieux${NB}: chez ${BRAND}, votre rendez-vous commence à l’heure, sans attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant. Si vous arrivez plus tard, il restera d’autant moins de temps pour votre rendez-vous, afin que les clients suivants commencent eux aussi à l’heure.`,
    both: "Nous avons prévu du temps pour vous deux.",
    saveQ: `Souhaitez-vous enregistrer le rendez-vous tout de suite dans votre agenda${NB}?`,
    gcal: "Google Agenda",
    ical: "Calendrier iPhone",
    ocal: "Outlook",
    reminderNote: "La veille, nous vous enverrons un rappel.",
    cancelInfo: `En cas d’imprévu, vous pouvez annuler votre rendez-vous via le lien jusqu’à 48 heures avant. Ensuite, écrivez-nous sur WhatsApp au ${PHONE}.`,
    manageLink: "Voir ou annuler le rendez-vous",
    closing: `À bientôt${NB}!`,
    subjectReminder: (t) => `À demain à ${t}${NB}!`,
    introReminder: `nous nous voyons demain chez ${BRAND}. Nous avons hâte de vous accueillir${NB}!`,
    punctualShort: "Votre rendez-vous commence à l’heure, sans attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant.",
    signQ: `Si vous le souhaitez, faites-nous un petit signe${NB}:`,
    yes: "Oui, je viens",
    reservedNote: "Votre rendez-vous reste réservé pour vous, même sans clic.",
    reminderCancel: `En cas d’imprévu, écrivez-nous sur WhatsApp au ${PHONE}.`,
    waButton: "Écrire sur WhatsApp",
    closingReminder: `À demain${NB}!`,
    icsTitle: `Rendez-vous chez ${BRAND}`,
    icsDescription: `Annulation jusqu’à 48 heures avant via le lien de votre confirmation, ensuite sur WhatsApp au ${PHONE}. Comment nous trouver${NB}: ${MAPS_LINK}`,
    pageTitle: "Votre rendez-vous",
    pageIntro: `voici votre rendez-vous chez ${BRAND}${NB}:`,
    askOpen: "Si vous le souhaitez, dites-nous en un mot que vous serez là. Votre rendez-vous reste réservé pour vous, même sans confirmation.",
    cancel: "Annuler le rendez-vous",
    cancelQ: `Souhaitez-vous annuler votre rendez-vous${NB}?`,
    cancelYes: "Annuler le rendez-vous",
    cancelNo: "Garder le rendez-vous",
    tooLate: `Souhaitez-vous annuler${NB}? Comme votre rendez-vous commence dans moins de 48 heures, écrivez-nous un petit mot sur WhatsApp.`,
    doneYes: (d, t) => `Merci${NB}! Nous avons hâte de vous accueillir le ${d} à ${t}.`,
    doneCancel: "Votre rendez-vous est annulé. Au plaisir de vous voir une autre fois.",
    cancelledInfo: `Votre rendez-vous est déjà annulé. Souhaitez-vous en trouver un nouveau${NB}?`,
    past: (d, t) => `Le rendez-vous était le ${d} à ${t}. Souhaitez-vous en convenir un nouveau${NB}?`,
    newBooking: "Réserver un nouveau rendez-vous",
    invalid: "Ce lien ne peut pas être ouvert. Écrivez-nous un petit mot sur WhatsApp, nous vous aiderons volontiers.",
    testNote: `Mode test${NB}: ce message concerne une réservation de test.`,
  },
  pt: {
    subjectBooked: (d, t) => `Marcado: ${d}, ${t}`,
    subjectRequest: (d, t) => `Pedido: ${d}, ${t}`,
    greeting: (n) => `Olá ${n},`,
    introBooked: "que bom que você vem nos ver! Esperamos por você:",
    introRequest: "que bom que você quer vir! Reservamos o horário para você e falamos em breve pelo WhatsApp:",
    mapL: "Como chegar",
    punctual: `Seu tempo é importante para nós: na ${BRAND}, sua consulta começa pontualmente, sem espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes. Se chegar mais tarde, sobra menos tempo para a sua consulta, para que os próximos clientes também comecem no horário.`,
    both: "Reservamos tempo para vocês dois.",
    saveQ: "Quer salvar a consulta no seu calendário agora mesmo?",
    gcal: "Google Agenda",
    ical: "Calendário do iPhone",
    ocal: "Outlook",
    reminderNote: "No dia anterior, lembramos você mais uma vez.",
    cancelInfo: `Se surgir um imprevisto, você pode cancelar a consulta pelo link até 48 horas antes. Depois disso, fale conosco pelo WhatsApp no ${PHONE}.`,
    manageLink: "Ver ou cancelar a consulta",
    closing: "Até breve!",
    subjectReminder: (t) => `Até amanhã às ${t}!`,
    introReminder: `amanhã nos vemos na ${BRAND}. Esperamos por você!`,
    punctualShort: "Sua consulta começa pontualmente, sem espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes.",
    signQ: "Se quiser, dê um sinal rápido:",
    yes: "Sim, eu vou",
    reservedNote: "Sua consulta continua reservada para você mesmo sem clicar.",
    reminderCancel: `Se surgir um imprevisto, fale conosco pelo WhatsApp no ${PHONE}.`,
    waButton: "Escrever pelo WhatsApp",
    closingReminder: "Até amanhã!",
    icsTitle: `Consulta na ${BRAND}`,
    icsDescription: `Cancelamento até 48 horas antes pelo link da sua confirmação, depois pelo WhatsApp no ${PHONE}. Como chegar: ${MAPS_LINK}`,
    pageTitle: "Sua consulta",
    pageIntro: `aqui está a sua consulta na ${BRAND}:`,
    askOpen: "Se quiser, avise rapidamente que você vem. Sua consulta continua reservada para você mesmo sem confirmação.",
    cancel: "Cancelar consulta",
    cancelQ: "Quer cancelar a sua consulta?",
    cancelYes: "Cancelar consulta",
    cancelNo: "Manter consulta",
    tooLate: "Quer cancelar? Como a sua consulta começa em menos de 48 horas, mande uma mensagem rápida pelo WhatsApp.",
    doneYes: (d, t) => `Obrigado! Esperamos por você em ${d}, às ${t}.`,
    doneCancel: "Sua consulta foi cancelada. Será um prazer ver você em outra ocasião.",
    cancelledInfo: "Sua consulta já foi cancelada. Quer encontrar um novo horário?",
    past: (d, t) => `A consulta foi em ${d}, às ${t}. Quer marcar uma nova?`,
    newBooking: "Marcar uma nova consulta",
    invalid: "Este link não pode ser aberto. Mande uma mensagem rápida pelo WhatsApp, ajudamos com prazer.",
    testNote: "Modo de teste: esta mensagem pertence a uma reserva de teste.",
  },
};
