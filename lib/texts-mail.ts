import type { Lang } from "./treatments";

/*
 * Texte der Bestätigungsmail, der Erinnerungsmail und der Terminseite /termin/<token>.
 * Deutsch ist der Maßstab; die Übersetzungen sind von Dr. Vogel noch gegenzulesen.
 * Keine Abkürzungen, keine langen Gedankenstriche, Sie-Form, „Kunden“, „Studio“.
 */
export const PHONE = "+49 151 58872566";
export const WA_LINK = "https://wa.me/4915158872566";
export const ADDRESS = "Hagenauer Straße 14, 10435 Berlin";
export const MAPS_LINK = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADDRESS);
export const STUDIO = "Palo Skin by Dr. Vogel";

type When = (date: string, time: string) => string;

export interface MailTexts {
  subjectBinding: When;
  subjectRequest: When;
  subjectReminder: When;
  greeting: (firstName: string) => string;
  introBinding: string;
  introRequest: string;
  introReminder: string;
  whenL: string;
  both: string;
  addressL: string;
  mapL: string;
  refL: string;
  treatmentsL: string;
  checkupRow: string;
  askL: string;
  yes: string;
  cancel: string;
  cancelRule: string;
  icsNote: string;
  closing: string;
  signatureL: string;
  /* Terminseite */
  pageTitle: string;
  pageLead: string;
  attended: string;
  cancelledInfo: string;
  past: string;
  invalid: string;
  cancelQ: When;
  cancelYes: string;
  cancelNo: string;
  tooLate: string;
  doneYes: string;
  doneCancel: string;
  newBooking: string;
  testNote: string;
}

const NB = "\u00A0";

export const MAIL_TEXTS: Record<Lang, MailTexts> = {
  de: {
    subjectBinding: (d, t) => `Ihr Termin bei Palo Skin am ${d} um ${t}`,
    subjectRequest: (d, t) => `Ihre Terminanfrage bei Palo Skin am ${d} um ${t}`,
    subjectReminder: (d, t) => `Erinnerung: Ihr Termin bei Palo Skin am ${d} um ${t}`,
    greeting: (n) => `Guten Tag ${n},`,
    introBinding: "Ihr Termin ist gebucht. Hier sind die Einzelheiten.",
    introRequest: "wir haben Ihre Terminanfrage erhalten und die Zeit für Sie vorgemerkt. Wir bestätigen sie kurz per WhatsApp.",
    introReminder: "Ihr Termin bei uns steht bevor. Hier noch einmal die Einzelheiten.",
    whenL: "Termin",
    both: "Wir haben für Sie beide Zeit eingeplant.",
    addressL: "Adresse",
    mapL: "Karte öffnen",
    refL: "Buchungsnummer",
    treatmentsL: "Unverbindliche Vorauswahl",
    checkupRow: "Kontrolltermin",
    askL: "Bitte sagen Sie uns kurz zu:",
    yes: "Ja, ich komme",
    cancel: "Termin absagen",
    cancelRule: `Absagen oder verschieben bitte mindestens 48 Stunden vorher. Kurzfristig erreichen Sie uns per WhatsApp unter ${PHONE}.`,
    icsNote: "Im Anhang finden Sie die Kalenderdatei für Ihren Kalender.",
    closing: "Wir freuen uns auf Sie.",
    signatureL: "Herzliche Grüße",
    pageTitle: "Ihr Termin",
    pageLead: "Hier können Sie zusagen oder absagen.",
    attended: "Danke für Ihre Zusage. Wir freuen uns auf Sie.",
    cancelledInfo: "Dieser Termin wurde abgesagt. Die Zeit ist wieder frei.",
    past: "Dieser Termin liegt in der Vergangenheit.",
    invalid: "Dieser Link ist ungültig.",
    cancelQ: (d, t) => `Möchten Sie den Termin am ${d} um ${t} wirklich absagen?`,
    cancelYes: "Ja, Termin absagen",
    cancelNo: "Nein, Termin behalten",
    tooLate: `Eine Absage über diesen Link ist bis 48 Stunden vor dem Termin möglich. Kurzfristig erreichen Sie uns per WhatsApp unter ${PHONE}.`,
    doneYes: "Danke für Ihre Zusage. Wir freuen uns auf Sie.",
    doneCancel: "Ihr Termin ist abgesagt. Die Zeit ist wieder frei.",
    newBooking: "Neuen Termin buchen",
    testNote: "Testbetrieb: Diese Nachricht gehört zu einer Testbuchung.",
  },
  en: {
    subjectBinding: (d, t) => `Your appointment at Palo Skin on ${d} at ${t}`,
    subjectRequest: (d, t) => `Your appointment request at Palo Skin for ${d} at ${t}`,
    subjectReminder: (d, t) => `Reminder: your appointment at Palo Skin on ${d} at ${t}`,
    greeting: (n) => `Hello ${n},`,
    introBinding: "Your appointment is booked. Here are the details.",
    introRequest: "we have received your appointment request and reserved the time for you. We will confirm it shortly on WhatsApp.",
    introReminder: "Your appointment with us is coming up. Here are the details once more.",
    whenL: "Appointment",
    both: "We have planned time for both of you.",
    addressL: "Address",
    mapL: "Open map",
    refL: "Booking number",
    treatmentsL: "Non-binding preselection",
    checkupRow: "Follow-up appointment",
    askL: "Please let us know briefly:",
    yes: "Yes, I’ll be there",
    cancel: "Cancel appointment",
    cancelRule: `Please cancel or reschedule at least 48 hours in advance. At short notice, reach us on WhatsApp at ${PHONE}.`,
    icsNote: "The attached calendar file adds the appointment to your calendar.",
    closing: "We look forward to seeing you.",
    signatureL: "Kind regards",
    pageTitle: "Your appointment",
    pageLead: "Here you can confirm or cancel.",
    attended: "Thank you for confirming. We look forward to seeing you.",
    cancelledInfo: "This appointment has been cancelled. The time is free again.",
    past: "This appointment is in the past.",
    invalid: "This link is not valid.",
    cancelQ: (d, t) => `Do you really want to cancel the appointment on ${d} at ${t}?`,
    cancelYes: "Yes, cancel appointment",
    cancelNo: "No, keep appointment",
    tooLate: `Cancelling via this link is possible up to 48 hours before the appointment. At short notice, reach us on WhatsApp at ${PHONE}.`,
    doneYes: "Thank you for confirming. We look forward to seeing you.",
    doneCancel: "Your appointment is cancelled. The time is free again.",
    newBooking: "Book a new appointment",
    testNote: "Test mode: this message belongs to a test booking.",
  },
  es: {
    subjectBinding: (d, t) => `Su cita en Palo Skin el ${d} a las ${t}`,
    subjectRequest: (d, t) => `Su solicitud de cita en Palo Skin para el ${d} a las ${t}`,
    subjectReminder: (d, t) => `Recordatorio: su cita en Palo Skin el ${d} a las ${t}`,
    greeting: (n) => `Hola ${n},`,
    introBinding: "Su cita está reservada. Aquí tiene los detalles.",
    introRequest: "hemos recibido su solicitud de cita y hemos reservado la hora para usted. Se la confirmamos en breve por WhatsApp.",
    introReminder: "Su cita con nosotros se acerca. Aquí tiene de nuevo los detalles.",
    whenL: "Cita",
    both: "Hemos reservado tiempo para los dos.",
    addressL: "Dirección",
    mapL: "Abrir mapa",
    refL: "Número de reserva",
    treatmentsL: "Preselección sin compromiso",
    checkupRow: "Cita de revisión",
    askL: "Confírmenos brevemente:",
    yes: "Sí, voy a ir",
    cancel: "Cancelar cita",
    cancelRule: `Para cancelar o cambiar la cita, avísenos con al menos 48 horas de antelación. Con poco margen, escríbanos por WhatsApp al ${PHONE}.`,
    icsNote: "Adjuntamos el archivo de calendario para su agenda.",
    closing: "Le esperamos.",
    signatureL: "Un cordial saludo",
    pageTitle: "Su cita",
    pageLead: "Aquí puede confirmar o cancelar.",
    attended: "Gracias por confirmar. Le esperamos.",
    cancelledInfo: "Esta cita ha sido cancelada. La hora vuelve a estar libre.",
    past: "Esta cita ya ha pasado.",
    invalid: "Este enlace no es válido.",
    cancelQ: (d, t) => `¿Quiere cancelar realmente la cita del ${d} a las ${t}?`,
    cancelYes: "Sí, cancelar cita",
    cancelNo: "No, mantener cita",
    tooLate: `Cancelar a través de este enlace es posible hasta 48 horas antes de la cita. Con poco margen, escríbanos por WhatsApp al ${PHONE}.`,
    doneYes: "Gracias por confirmar. Le esperamos.",
    doneCancel: "Su cita queda cancelada. La hora vuelve a estar libre.",
    newBooking: "Reservar una nueva cita",
    testNote: "Modo de prueba: este mensaje pertenece a una reserva de prueba.",
  },
  fr: {
    subjectBinding: (d, t) => `Votre rendez-vous chez Palo Skin le ${d} à ${t}`,
    subjectRequest: (d, t) => `Votre demande de rendez-vous chez Palo Skin pour le ${d} à ${t}`,
    subjectReminder: (d, t) => `Rappel${NB}: votre rendez-vous chez Palo Skin le ${d} à ${t}`,
    greeting: (n) => `Bonjour ${n},`,
    introBinding: "Votre rendez-vous est réservé. Voici les détails.",
    introRequest: "nous avons bien reçu votre demande de rendez-vous et réservé le créneau pour vous. Nous la confirmons rapidement par WhatsApp.",
    introReminder: "Votre rendez-vous chez nous approche. Voici de nouveau les détails.",
    whenL: "Rendez-vous",
    both: "Nous avons prévu du temps pour vous deux.",
    addressL: "Adresse",
    mapL: "Ouvrir la carte",
    refL: "Numéro de réservation",
    treatmentsL: "Présélection sans engagement",
    checkupRow: "Rendez-vous de contrôle",
    askL: `Merci de nous confirmer en un clic${NB}:`,
    yes: "Oui, je viens",
    cancel: "Annuler le rendez-vous",
    cancelRule: `Pour annuler ou déplacer, merci de nous prévenir au moins 48 heures à l’avance. En cas d’urgence, écrivez-nous sur WhatsApp au ${PHONE}.`,
    icsNote: "Le fichier joint ajoute le rendez-vous à votre calendrier.",
    closing: "Nous avons hâte de vous accueillir.",
    signatureL: "Cordialement",
    pageTitle: "Votre rendez-vous",
    pageLead: "Ici, vous pouvez confirmer ou annuler.",
    attended: "Merci pour votre confirmation. Nous avons hâte de vous accueillir.",
    cancelledInfo: "Ce rendez-vous a été annulé. Le créneau est de nouveau libre.",
    past: "Ce rendez-vous est passé.",
    invalid: "Ce lien n’est pas valable.",
    cancelQ: (d, t) => `Voulez-vous vraiment annuler le rendez-vous du ${d} à ${t}${NB}?`,
    cancelYes: "Oui, annuler le rendez-vous",
    cancelNo: "Non, garder le rendez-vous",
    tooLate: `L’annulation par ce lien est possible jusqu’à 48 heures avant le rendez-vous. En cas d’urgence, écrivez-nous sur WhatsApp au ${PHONE}.`,
    doneYes: "Merci pour votre confirmation. Nous avons hâte de vous accueillir.",
    doneCancel: "Votre rendez-vous est annulé. Le créneau est de nouveau libre.",
    newBooking: "Réserver un nouveau rendez-vous",
    testNote: `Mode test${NB}: ce message concerne une réservation de test.`,
  },
  pt: {
    subjectBinding: (d, t) => `Sua consulta na Palo Skin em ${d} às ${t}`,
    subjectRequest: (d, t) => `Seu pedido de horário na Palo Skin para ${d} às ${t}`,
    subjectReminder: (d, t) => `Lembrete: sua consulta na Palo Skin em ${d} às ${t}`,
    greeting: (n) => `Olá ${n},`,
    introBinding: "Sua consulta está marcada. Aqui estão os detalhes.",
    introRequest: "recebemos seu pedido de horário e reservamos o horário para você. Confirmamos em breve pelo WhatsApp.",
    introReminder: "Sua consulta conosco está chegando. Aqui estão os detalhes mais uma vez.",
    whenL: "Consulta",
    both: "Reservamos tempo para vocês dois.",
    addressL: "Endereço",
    mapL: "Abrir mapa",
    refL: "Número da reserva",
    treatmentsL: "Pré-seleção sem compromisso",
    checkupRow: "Consulta de revisão",
    askL: "Por favor, confirme em um clique:",
    yes: "Sim, eu vou",
    cancel: "Cancelar consulta",
    cancelRule: `Para cancelar ou remarcar, avise com pelo menos 48 horas de antecedência. Em cima da hora, fale conosco pelo WhatsApp no ${PHONE}.`,
    icsNote: "O arquivo em anexo adiciona a consulta ao seu calendário.",
    closing: "Esperamos por você.",
    signatureL: "Um abraço",
    pageTitle: "Sua consulta",
    pageLead: "Aqui você pode confirmar ou cancelar.",
    attended: "Obrigado por confirmar. Esperamos por você.",
    cancelledInfo: "Esta consulta foi cancelada. O horário está livre novamente.",
    past: "Esta consulta já passou.",
    invalid: "Este link não é válido.",
    cancelQ: (d, t) => `Deseja realmente cancelar a consulta de ${d} às ${t}?`,
    cancelYes: "Sim, cancelar consulta",
    cancelNo: "Não, manter consulta",
    tooLate: `O cancelamento por este link é possível até 48 horas antes da consulta. Em cima da hora, fale conosco pelo WhatsApp no ${PHONE}.`,
    doneYes: "Obrigado por confirmar. Esperamos por você.",
    doneCancel: "Sua consulta foi cancelada. O horário está livre novamente.",
    newBooking: "Marcar uma nova consulta",
    testNote: "Modo de teste: esta mensagem pertence a uma reserva de teste.",
  },
};
