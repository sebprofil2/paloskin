import type { Lang } from "./treatments";

/*
 * Endgültige Kundentexte (Gesamtauftrag vom 3. Oktober 2026, abends): Bestätigungsmail, Mail nach dem Verschieben,
 * Erinnerungsmail, Kalenderdatei, Terminseite mit Verschieben. Deutsch wörtlich, die anderen Sprachen sinngemäß im
 * selben Ton, Betreffzeilen höchstens 40 Zeichen mit Datum und Uhrzeit vorn. Textliste: docs/TEXTE-MAILS.md.
 */
export const PHONE = "+49 151 58872566";
export const WA_LINK = "https://wa.me/4915158872566";
export const ADDRESS = "Hagenauer Straße 14, 10435 Berlin";
/** Google-Unternehmensprofil (Ersatz: https://maps.google.com/?cid=16946433859280785681) */
export const MAPS_LINK = "https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8";
export const STUDIO = "PALO SKIN by Dr. Vogel";
export const BRAND = "PALO SKIN";
export const SIGNER = "Dr. med. Sebastian Vogel";

type When = (date: string, time: string) => string;

export interface MailTexts {
  /* Betreffzeilen */
  subjectBooked: When;
  subjectRequest: When;
  subjectRescheduled: When;
  subjectReminder: (time: string) => string;
  /* Bestätigungsmail */
  greeting: (firstName: string) => string;
  introBooked: string;
  introRequest: string;
  introRescheduled: string;
  mapL: string;
  punctual: string;
  both: string;
  saveQ: string;
  gcal: string;
  ical: string;
  ocal: string;
  oldCalendarNote: string;
  reminderNote: string;
  cancelInfo: string;
  manageLink: string;
  viewLink: string;
  closing: string;
  /* Erinnerungsmail */
  introReminder: string;
  punctualShort: string;
  confirmQ: string;
  yes: string;
  notFit: string;
  rescheduleLink: string;
  closingReminder: string;
  /* Kalenderdatei */
  icsTitle: string;
  /** Beschreibung des Kalendereintrags (Datei, Google, Outlook): persönlicher Link zur Terminseite und Kartenlink */
  icsDescription: (link: string) => string;
  /* Terminseite */
  pageTitle: string;
  pageIntro: string;
  windowOpen: string;
  windowShort: string;
  reschedule: string;
  cancel: string;
  cancelShort: string;
  cancelQ: string;
  cancelYes: string;
  cancelNo: string;
  orReschedule: string;
  doneYes: When;
  doneCancel: string;
  cancelledInfo: string;
  past: When;
  newBooking: string;
  invalid: string;
  waButton: string;
  testNote: string;
  /* Verschieben */
  rescheduleH: string;
  rescheduleP: When;
  rescheduleBtn: When;
  rescheduledH: When;
  rescheduledP: string;
  rescheduleGone: string;
  rescheduleLoading: string;
  rescheduleNone: string;
  rescheduleDown: string;
}

const NB = " ";

export const MAIL_TEXTS: Record<Lang, MailTexts> = {
  de: {
    subjectBooked: (d, t) => `Gebucht: ${d}, ${t}`,
    subjectRequest: (d, t) => `Angefragt: ${d}, ${t}`,
    subjectRescheduled: (d, t) => `Verschoben: ${d}, ${t}`,
    subjectReminder: (t) => `Bitte kurz bestätigen: morgen, ${t}`,
    greeting: (n) => `Hallo ${n},`,
    introBooked: "schön, dass Sie zu uns kommen! Wir freuen uns auf Sie:",
    introRequest: "schön, dass Sie zu uns kommen möchten! Wir haben die Zeit für Sie vorgemerkt und melden uns kurz per WhatsApp:",
    introRescheduled: "Ihr Termin ist verschoben. Wir freuen uns auf Sie:",
    mapL: "So finden Sie uns",
    punctual: `Ihre Zeit ist uns wichtig: Bei ${BRAND} beginnt Ihr Termin pünktlich, in der Regel ganz ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher. Falls Sie später kommen, bleibt entsprechend weniger Zeit für Ihren Termin, damit auch die nächsten Kunden pünktlich starten.`,
    both: "Für Sie beide haben wir Zeit eingeplant.",
    saveQ: "Möchten Sie den Termin gleich im Kalender speichern?",
    gcal: "Google Kalender",
    ical: "iPhone-Kalender",
    ocal: "Outlook",
    oldCalendarNote: "Falls Sie den alten Termin in Ihrem Kalender gespeichert haben, löschen Sie ihn bitte dort.",
    reminderNote: "Am Tag vorher erinnern wir Sie noch einmal.",
    cancelInfo: "Den Termin verschieben oder absagen können Sie bis 24 Stunden vorher über diesen Link.",
    manageLink: "Termin verschieben oder absagen",
    viewLink: "Termin ansehen",
    closing: "Bis bald!",
    introReminder: `morgen sehen wir uns bei ${BRAND}, wir freuen uns auf Sie!`,
    punctualShort: "Ihr Termin beginnt pünktlich, in der Regel ganz ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher.",
    confirmQ: "Passt der Termin weiterhin für Sie? Dann bestätigen Sie bitte kurz mit einem Klick:",
    yes: "Ja, ich komme",
    notFit: "Passt es doch nicht? Dann verschieben Sie den Termin hier:",
    rescheduleLink: "Termin verschieben",
    closingReminder: "Bis morgen!",
    icsTitle: `Termin bei ${BRAND}`,
    icsDescription: (link) => `Termin ansehen, verschieben oder absagen (bis 24 Stunden vorher):\n${link}\nSo finden Sie uns: ${MAPS_LINK}`,
    pageTitle: "Ihr Termin",
    pageIntro: `hier finden Sie Ihren Termin bei ${BRAND}:`,
    windowOpen: "Den Termin verschieben oder absagen können Sie bis 24 Stunden vorher.",
    windowShort: "Sie können nicht kommen? Bitte sagen Sie uns kurz Bescheid, dann können wir die Zeit noch vergeben.",
    reschedule: "Termin verschieben",
    cancel: "Termin absagen",
    cancelShort: "Leider verhindert",
    cancelQ: "Möchten Sie Ihren Termin absagen?",
    cancelYes: "Termin absagen",
    cancelNo: "Termin behalten",
    orReschedule: "Oder lieber verschieben?",
    doneYes: (d, t) => `Danke! Wir freuen uns auf Sie am ${d}, um ${t}.`,
    doneCancel: "Ihr Termin ist abgesagt. Wir freuen uns, Sie ein anderes Mal zu sehen.",
    cancelledInfo: "Ihr Termin ist bereits abgesagt. Möchten Sie einen neuen Termin finden?",
    past: (d, t) => `Der Termin war am ${d}, um ${t}. Möchten Sie einen neuen Termin vereinbaren?`,
    newBooking: "Neuen Termin buchen",
    invalid: "Dieser Link lässt sich nicht öffnen. Schreiben Sie uns kurz per WhatsApp, wir helfen Ihnen gern weiter.",
    waButton: "Per WhatsApp schreiben",
    testNote: "Testbetrieb: Diese Nachricht gehört zu einer Testbuchung.",
    rescheduleH: "Neue Zeit wählen",
    rescheduleP: (d, t) => `Ihr bisheriger Termin: ${d}, ${t}. Er bleibt für Sie reserviert, bis Sie eine neue Zeit gewählt haben.`,
    rescheduleBtn: (d, t) => `Auf ${d}, ${t} verschieben`,
    rescheduledH: (d, t) => `Verschoben! Ihr neuer Termin: ${d}, ${t}.`,
    rescheduledP: "Die neue Bestätigung kommt gleich per E-Mail.",
    rescheduleGone: "Diese Zeit ist leider gerade vergeben worden. Bitte wählen Sie eine andere.",
    rescheduleLoading: "Freie Zeiten werden geladen …",
    rescheduleNone: "Online ist gerade keine passende Zeit frei. Schreiben Sie uns gern per WhatsApp.",
    rescheduleDown: "Gerade hakt es bei uns. Bitte versuchen Sie es gleich noch einmal oder schreiben Sie uns per WhatsApp.",
  },
  en: {
    subjectBooked: (d, t) => `Booked: ${d}, ${t}`,
    subjectRequest: (d, t) => `Requested: ${d}, ${t}`,
    subjectRescheduled: (d, t) => `Rescheduled: ${d}, ${t}`,
    subjectReminder: (t) => `Please confirm: tomorrow, ${t}`,
    greeting: (n) => `Hello ${n},`,
    introBooked: "lovely that you’re coming to see us! We look forward to seeing you:",
    introRequest: "lovely that you’d like to come! We have reserved the time for you and will be in touch shortly on WhatsApp:",
    introRescheduled: "Your appointment has been rescheduled. We look forward to seeing you:",
    mapL: "How to find us",
    punctual: `Your time matters to us: at ${BRAND}, your appointment starts on time, usually with no waiting at all. Please arrive at the agreed time or at most five minutes early. If you arrive later, there is correspondingly less time for your appointment, so the next clients can also start on time.`,
    both: "We have planned time for both of you.",
    saveQ: "Would you like to save the appointment to your calendar right away?",
    gcal: "Google Calendar",
    ical: "iPhone Calendar",
    ocal: "Outlook",
    oldCalendarNote: "If you saved the previous appointment in your calendar, please delete it there.",
    reminderNote: "We’ll remind you once more the day before.",
    cancelInfo: "You can reschedule or cancel the appointment up to 24 hours in advance via this link.",
    manageLink: "Reschedule or cancel appointment",
    viewLink: "View appointment",
    closing: "See you soon!",
    introReminder: `we’ll see you tomorrow at ${BRAND}, we look forward to seeing you!`,
    punctualShort: "Your appointment starts on time, usually with no waiting at all. Please arrive at the agreed time or at most five minutes early.",
    confirmQ: "Does the appointment still suit you? Then please confirm briefly with one click:",
    yes: "Yes, I’ll be there",
    notFit: "Doesn’t suit you after all? Then reschedule the appointment here:",
    rescheduleLink: "Reschedule appointment",
    closingReminder: "See you tomorrow!",
    icsTitle: `Appointment at ${BRAND}`,
    icsDescription: (link) => `View, reschedule or cancel your appointment (up to 24 hours in advance):\n${link}\nHow to find us: ${MAPS_LINK}`,
    pageTitle: "Your appointment",
    pageIntro: `here is your appointment at ${BRAND}:`,
    windowOpen: "You can reschedule or cancel the appointment up to 24 hours in advance.",
    windowShort: "Can’t make it? Please let us know briefly so we can still give the time to someone else.",
    reschedule: "Reschedule appointment",
    cancel: "Cancel appointment",
    cancelShort: "Unable to come",
    cancelQ: "Would you like to cancel your appointment?",
    cancelYes: "Cancel appointment",
    cancelNo: "Keep appointment",
    orReschedule: "Or would you rather reschedule?",
    doneYes: (d, t) => `Thank you! We look forward to seeing you on ${d} at ${t}.`,
    doneCancel: "Your appointment is cancelled. We look forward to seeing you another time.",
    cancelledInfo: "Your appointment has already been cancelled. Would you like to find a new one?",
    past: (d, t) => `The appointment was on ${d} at ${t}. Would you like to arrange a new one?`,
    newBooking: "Book a new appointment",
    invalid: "This link cannot be opened. Send us a quick WhatsApp message and we’ll be happy to help.",
    waButton: "Message us on WhatsApp",
    testNote: "Test mode: this message belongs to a test booking.",
    rescheduleH: "Choose a new time",
    rescheduleP: (d, t) => `Your current appointment: ${d}, ${t}. It stays reserved for you until you have chosen a new time.`,
    rescheduleBtn: (d, t) => `Move to ${d}, ${t}`,
    rescheduledH: (d, t) => `Rescheduled! Your new appointment: ${d}, ${t}.`,
    rescheduledP: "The new confirmation will reach you by email in a moment.",
    rescheduleGone: "Unfortunately this time has just been taken. Please choose another.",
    rescheduleLoading: "Loading available times …",
    rescheduleNone: "There is no suitable time available online right now. Feel free to message us on WhatsApp.",
    rescheduleDown: "Something’s not working on our side right now. Please try again in a moment or message us on WhatsApp.",
  },
  es: {
    subjectBooked: (d, t) => `Reservado: ${d}, ${t}`,
    subjectRequest: (d, t) => `Solicitado: ${d}, ${t}`,
    subjectRescheduled: (d, t) => `Cambiado: ${d}, ${t}`,
    subjectReminder: (t) => `Por favor, confirme: mañana, ${t}`,
    greeting: (n) => `Hola ${n},`,
    introBooked: "¡qué bien que venga a vernos! Le esperamos:",
    introRequest: "¡qué bien que quiera venir! Hemos reservado la hora para usted y le escribimos en breve por WhatsApp:",
    introRescheduled: "Su cita ha sido cambiada. Le esperamos:",
    mapL: "Cómo llegar",
    punctual: `Su tiempo es importante para nosotros: en ${BRAND} su cita empieza puntual, por lo general sin ninguna espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes. Si llega más tarde, quedará menos tiempo para su cita, para que los siguientes clientes también empiecen puntuales.`,
    both: "Hemos reservado tiempo para los dos.",
    saveQ: "¿Quiere guardar la cita en su calendario ahora mismo?",
    gcal: "Google Calendar",
    ical: "Calendario del iPhone",
    ocal: "Outlook",
    oldCalendarNote: "Si guardó la cita anterior en su calendario, elimínela allí, por favor.",
    reminderNote: "El día anterior se lo recordamos una vez más.",
    cancelInfo: "Puede cambiar o cancelar la cita hasta 24 horas antes a través de este enlace.",
    manageLink: "Cambiar o cancelar la cita",
    viewLink: "Ver la cita",
    closing: "¡Hasta pronto!",
    introReminder: `mañana nos vemos en ${BRAND}, ¡le esperamos!`,
    punctualShort: "Su cita empieza puntual, por lo general sin ninguna espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes.",
    confirmQ: "¿La cita le sigue viniendo bien? Entonces confírmela brevemente con un clic:",
    yes: "Sí, voy a ir",
    notFit: "¿Al final no le viene bien? Cambie la cita aquí:",
    rescheduleLink: "Cambiar la cita",
    closingReminder: "¡Hasta mañana!",
    icsTitle: `Cita en ${BRAND}`,
    icsDescription: (link) => `Ver, cambiar o cancelar su cita (hasta 24 horas antes):\n${link}\nCómo llegar: ${MAPS_LINK}`,
    pageTitle: "Su cita",
    pageIntro: `aquí tiene su cita en ${BRAND}:`,
    windowOpen: "Puede cambiar o cancelar la cita hasta 24 horas antes.",
    windowShort: "¿No puede venir? Avísenos brevemente, así aún podemos dar la hora a otra persona.",
    reschedule: "Cambiar la cita",
    cancel: "Cancelar la cita",
    cancelShort: "No puedo ir",
    cancelQ: "¿Quiere cancelar su cita?",
    cancelYes: "Cancelar la cita",
    cancelNo: "Mantener la cita",
    orReschedule: "¿O prefiere cambiarla?",
    doneYes: (d, t) => `¡Gracias! Le esperamos el ${d} a las ${t}.`,
    doneCancel: "Su cita queda cancelada. Nos alegrará verle en otra ocasión.",
    cancelledInfo: "Su cita ya está cancelada. ¿Quiere buscar una nueva?",
    past: (d, t) => `La cita fue el ${d} a las ${t}. ¿Quiere concertar una nueva?`,
    newBooking: "Reservar una nueva cita",
    invalid: "Este enlace no se puede abrir. Escríbanos un momento por WhatsApp, le ayudamos con gusto.",
    waButton: "Escribir por WhatsApp",
    testNote: "Modo de prueba: este mensaje pertenece a una reserva de prueba.",
    rescheduleH: "Elegir una nueva hora",
    rescheduleP: (d, t) => `Su cita actual: ${d}, ${t}. Queda reservada para usted hasta que elija una nueva hora.`,
    rescheduleBtn: (d, t) => `Cambiar al ${d}, ${t}`,
    rescheduledH: (d, t) => `¡Cambiada! Su nueva cita: ${d}, ${t}.`,
    rescheduledP: "La nueva confirmación le llega enseguida por correo electrónico.",
    rescheduleGone: "Lamentablemente esta hora acaba de ocuparse. Elija otra, por favor.",
    rescheduleLoading: "Cargando horas disponibles …",
    rescheduleNone: "Ahora mismo no hay ninguna hora libre en línea. Escríbanos con gusto por WhatsApp.",
    rescheduleDown: "Ahora mismo algo falla por nuestra parte. Inténtelo de nuevo en un momento o escríbanos por WhatsApp.",
  },
  fr: {
    subjectBooked: (d, t) => `Réservé${NB}: ${d}, ${t}`,
    subjectRequest: (d, t) => `Demandé${NB}: ${d}, ${t}`,
    subjectRescheduled: (d, t) => `Déplacé${NB}: ${d}, ${t}`,
    subjectReminder: (t) => `Merci de confirmer${NB}: demain, ${t}`,
    greeting: (n) => `Bonjour ${n},`,
    introBooked: `quel plaisir de vous accueillir${NB}! Nous avons hâte de vous voir${NB}:`,
    introRequest: `quel plaisir que vous souhaitiez venir${NB}! Nous avons réservé le créneau pour vous et vous écrivons rapidement sur WhatsApp${NB}:`,
    introRescheduled: `Votre rendez-vous a été déplacé. Nous avons hâte de vous voir${NB}:`,
    mapL: "Comment nous trouver",
    punctual: `Votre temps nous est précieux${NB}: chez ${BRAND}, votre rendez-vous commence à l’heure, en général sans aucune attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant. Si vous arrivez plus tard, il restera d’autant moins de temps pour votre rendez-vous, afin que les clients suivants commencent eux aussi à l’heure.`,
    both: "Nous avons prévu du temps pour vous deux.",
    saveQ: `Souhaitez-vous enregistrer le rendez-vous tout de suite dans votre agenda${NB}?`,
    gcal: "Google Agenda",
    ical: "Calendrier iPhone",
    ocal: "Outlook",
    oldCalendarNote: "Si vous aviez enregistré l’ancien rendez-vous dans votre agenda, merci de l’y supprimer.",
    reminderNote: "La veille, nous vous enverrons un rappel.",
    cancelInfo: "Vous pouvez déplacer ou annuler le rendez-vous jusqu’à 24 heures avant via ce lien.",
    manageLink: "Déplacer ou annuler le rendez-vous",
    viewLink: "Voir le rendez-vous",
    closing: `À bientôt${NB}!`,
    introReminder: `nous nous voyons demain chez ${BRAND}, nous avons hâte de vous accueillir${NB}!`,
    punctualShort: "Votre rendez-vous commence à l’heure, en général sans aucune attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant.",
    confirmQ: `Le rendez-vous vous convient toujours${NB}? Alors confirmez-le en un clic${NB}:`,
    yes: "Oui, je viens",
    notFit: `Cela ne convient finalement pas${NB}? Déplacez le rendez-vous ici${NB}:`,
    rescheduleLink: "Déplacer le rendez-vous",
    closingReminder: `À demain${NB}!`,
    icsTitle: `Rendez-vous chez ${BRAND}`,
    icsDescription: (link) => `Voir, déplacer ou annuler votre rendez-vous (jusqu’à 24 heures avant)${NB}:\n${link}\nComment nous trouver${NB}: ${MAPS_LINK}`,
    pageTitle: "Votre rendez-vous",
    pageIntro: `voici votre rendez-vous chez ${BRAND}${NB}:`,
    windowOpen: "Vous pouvez déplacer ou annuler le rendez-vous jusqu’à 24 heures avant.",
    windowShort: `Vous ne pouvez pas venir${NB}? Dites-le-nous en un mot, nous pourrons encore proposer le créneau à quelqu’un d’autre.`,
    reschedule: "Déplacer le rendez-vous",
    cancel: "Annuler le rendez-vous",
    cancelShort: "Empêchement",
    cancelQ: `Souhaitez-vous annuler votre rendez-vous${NB}?`,
    cancelYes: "Annuler le rendez-vous",
    cancelNo: "Garder le rendez-vous",
    orReschedule: `Ou plutôt le déplacer${NB}?`,
    doneYes: (d, t) => `Merci${NB}! Nous avons hâte de vous accueillir le ${d} à ${t}.`,
    doneCancel: "Votre rendez-vous est annulé. Au plaisir de vous voir une autre fois.",
    cancelledInfo: `Votre rendez-vous est déjà annulé. Souhaitez-vous en trouver un nouveau${NB}?`,
    past: (d, t) => `Le rendez-vous était le ${d} à ${t}. Souhaitez-vous en convenir un nouveau${NB}?`,
    newBooking: "Réserver un nouveau rendez-vous",
    invalid: "Ce lien ne peut pas être ouvert. Écrivez-nous un petit mot sur WhatsApp, nous vous aiderons volontiers.",
    waButton: "Écrire sur WhatsApp",
    testNote: `Mode test${NB}: ce message concerne une réservation de test.`,
    rescheduleH: "Choisir un nouveau créneau",
    rescheduleP: (d, t) => `Votre rendez-vous actuel${NB}: ${d}, ${t}. Il reste réservé pour vous jusqu’à ce que vous ayez choisi un nouveau créneau.`,
    rescheduleBtn: (d, t) => `Déplacer au ${d}, ${t}`,
    rescheduledH: (d, t) => `Déplacé${NB}! Votre nouveau rendez-vous${NB}: ${d}, ${t}.`,
    rescheduledP: "La nouvelle confirmation arrive dans un instant par e-mail.",
    rescheduleGone: "Ce créneau vient malheureusement d’être pris. Merci d’en choisir un autre.",
    rescheduleLoading: "Chargement des créneaux disponibles …",
    rescheduleNone: "Aucun créneau n’est disponible en ligne pour le moment. Écrivez-nous volontiers sur WhatsApp.",
    rescheduleDown: "Quelque chose ne fonctionne pas de notre côté pour le moment. Réessayez dans un instant ou écrivez-nous sur WhatsApp.",
  },
  pt: {
    subjectBooked: (d, t) => `Marcado: ${d}, ${t}`,
    subjectRequest: (d, t) => `Pedido: ${d}, ${t}`,
    subjectRescheduled: (d, t) => `Remarcado: ${d}, ${t}`,
    subjectReminder: (t) => `Confirme, por favor: amanhã, ${t}`,
    greeting: (n) => `Olá ${n},`,
    introBooked: "que bom que você vem nos ver! Esperamos por você:",
    introRequest: "que bom que você quer vir! Reservamos o horário para você e falamos em breve pelo WhatsApp:",
    introRescheduled: "Sua consulta foi remarcada. Esperamos por você:",
    mapL: "Como chegar",
    punctual: `Seu tempo é importante para nós: na ${BRAND}, sua consulta começa pontualmente, em geral sem nenhuma espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes. Se chegar mais tarde, sobra menos tempo para a sua consulta, para que os próximos clientes também comecem no horário.`,
    both: "Reservamos tempo para vocês dois.",
    saveQ: "Quer salvar a consulta no seu calendário agora mesmo?",
    gcal: "Google Agenda",
    ical: "Calendário do iPhone",
    ocal: "Outlook",
    oldCalendarNote: "Se você salvou a consulta anterior no seu calendário, apague-a lá, por favor.",
    reminderNote: "No dia anterior, lembramos você mais uma vez.",
    cancelInfo: "Você pode remarcar ou cancelar a consulta até 24 horas antes por este link.",
    manageLink: "Remarcar ou cancelar a consulta",
    viewLink: "Ver a consulta",
    closing: "Até breve!",
    introReminder: `amanhã nos vemos na ${BRAND}, esperamos por você!`,
    punctualShort: "Sua consulta começa pontualmente, em geral sem nenhuma espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes.",
    confirmQ: "A consulta continua boa para você? Então confirme rapidamente com um clique:",
    yes: "Sim, eu vou",
    notFit: "No fim não dá certo? Então remarque a consulta aqui:",
    rescheduleLink: "Remarcar a consulta",
    closingReminder: "Até amanhã!",
    icsTitle: `Consulta na ${BRAND}`,
    icsDescription: (link) => `Ver, remarcar ou cancelar sua consulta (até 24 horas antes):\n${link}\nComo chegar: ${MAPS_LINK}`,
    pageTitle: "Sua consulta",
    pageIntro: `aqui está a sua consulta na ${BRAND}:`,
    windowOpen: "Você pode remarcar ou cancelar a consulta até 24 horas antes.",
    windowShort: "Não vai conseguir vir? Avise rapidamente, assim ainda podemos oferecer o horário a outra pessoa.",
    reschedule: "Remarcar a consulta",
    cancel: "Cancelar a consulta",
    cancelShort: "Não consigo ir",
    cancelQ: "Quer cancelar a sua consulta?",
    cancelYes: "Cancelar a consulta",
    cancelNo: "Manter a consulta",
    orReschedule: "Ou prefere remarcar?",
    doneYes: (d, t) => `Obrigado! Esperamos por você em ${d}, às ${t}.`,
    doneCancel: "Sua consulta foi cancelada. Será um prazer ver você em outra ocasião.",
    cancelledInfo: "Sua consulta já foi cancelada. Quer encontrar um novo horário?",
    past: (d, t) => `A consulta foi em ${d}, às ${t}. Quer marcar uma nova?`,
    newBooking: "Marcar uma nova consulta",
    invalid: "Este link não pode ser aberto. Mande uma mensagem rápida pelo WhatsApp, ajudamos com prazer.",
    waButton: "Escrever pelo WhatsApp",
    testNote: "Modo de teste: esta mensagem pertence a uma reserva de teste.",
    rescheduleH: "Escolher um novo horário",
    rescheduleP: (d, t) => `Sua consulta atual: ${d}, ${t}. Ela continua reservada para você até você escolher um novo horário.`,
    rescheduleBtn: (d, t) => `Remarcar para ${d}, ${t}`,
    rescheduledH: (d, t) => `Remarcado! Sua nova consulta: ${d}, ${t}.`,
    rescheduledP: "A nova confirmação chega já por e-mail.",
    rescheduleGone: "Infelizmente este horário acabou de ser ocupado. Escolha outro, por favor.",
    rescheduleLoading: "Carregando horários livres …",
    rescheduleNone: "No momento não há nenhum horário livre online. Fale conosco pelo WhatsApp.",
    rescheduleDown: "Algo não está funcionando do nosso lado agora. Tente de novo em instantes ou fale conosco pelo WhatsApp.",
  },
};
