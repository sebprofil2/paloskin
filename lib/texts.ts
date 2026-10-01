/*
 * Texte der Buchung in fünf Sprachen. Block T wörtlich aus dem Entwurf Version 26 übernommen,
 * nichts umformuliert. Block X: Ergänzungen für die echte Seite (Testhinweis, Buchungsnummer,
 * unklarer Ausgang, Absage per WhatsApp), die im Entwurf nicht vorkommen.
 */
import type { Lang } from "./treatments";

export const LANGS: { id: Lang; name: string; loc: string }[] = [
  { id: "de", name: "Deutsch", loc: "de-DE" },
  { id: "en", name: "English", loc: "en-GB" },
  { id: "es", name: "Español", loc: "es-ES" },
  { id: "fr", name: "Français", loc: "fr-FR" },
  { id: "pt", name: "Português", loc: "pt-BR" },
];

/* Fahnen wie in public/assets/lang.js */
export const FLAGS: Record<Lang, string> = {
  de:'<svg viewBox="0 0 5 3" aria-hidden="true"><rect width="5" height="3" fill="#000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>',
  en:'<svg viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true"><clipPath id="ukS"><path d="M0,0v30h60V0z"/></clipPath><clipPath id="ukT"><path d="M30,15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#ukS)"><path d="M0,0v30h60V0z" fill="#012169"/><path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0L60,30M60,0L0,30" clip-path="url(#ukT)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></g></svg>',
  es:'<svg viewBox="0 0 3 2" preserveAspectRatio="none" aria-hidden="true"><rect width="3" height="2" fill="#AA151B"/><rect y=".5" width="3" height="1" fill="#F1BF00"/></svg>',
  fr:'<svg viewBox="0 0 3 2" preserveAspectRatio="none" aria-hidden="true"><rect width="1" height="2" fill="#002654"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE1126"/></svg>',
  pt:'<svg viewBox="0 0 20 14" preserveAspectRatio="none" aria-hidden="true"><rect width="20" height="14" fill="#009C3B"/><path d="M10 1.6L18.2 7 10 12.4 1.8 7z" fill="#FFDF00"/><circle cx="10" cy="7" r="3.4" fill="#002776"/><path d="M6.7 6.3a7.6 7.6 0 0 1 6.6 1.6" stroke="#fff" stroke-width=".55" fill="none"/></svg>'
};

type Fn1 = (p: string) => string;

export interface DraftTexts {
  say: string; spec: string; otherZone: string; otherPh: string; achsel: string; achselD: string;
  z1D: string; z2D: string; z3D: string; interestL: string; noCommitTag: string; noCommit: string; yesBeen: string; noFirst: string;
  stepTreat: string; stepSlot: string; stepData: string; consultPrice: string; from: Fn1;
  zonesL: string; zoneHelpQ: string; zoneHelpA: string; perZone: Fn1; combineHint: string; noteAdd: string;
  next1: string; next2: string; back: string; overviewH: string; change: string; refThanks: string; refSend: string;
  visitQ: string; vFirst: string; vReturn: string; visitFirstLbl: string; visitReturnLbl: string; checkupLbl: string;
  treatQ: string; unsureT: string; unsureD: string; afterConsult: string;
  botGroup: string; z1: string; z2: string; z3: string; choice: string;
  extraT: string; extraOff: Fn1; extraOn: Fn1; moreGroup: string;
  kaumuskel: string; kaumuskelD: string; nefertiti: string; nefertitiD: string;
  lachs: string; lachsD: string; lachsPack: string; lachsPackD: string; lachsRow: string;
  noteL: string; optional: string; notePh: string; priceHint: string;
  slotQ: string; slotQCheckup: string; downT: string; downP: string; copy: string; copied: string; marked: string; wait: string;
  nextFree: string; orDay: string; dayAria: string; closed: string; closedAria: string; holiday: string; fullT: string; fullP: string;
  at: Fn1;
  dataH: string; vorname: string; nachname: string; handy: string; handyWhy: string; email: string; phoneReturn: string;
  refQ: string; yes: string; no: string; refPh: string; consent: string; required: string;
  cancelT: string; cancelP: string; sumHead: string; beratungRow: string; beratungVal: string; estimate: string; notePrefix: string;
  botRow: string; extraRow: string; doneH: string; doneMail: Fn1; gcal: string; ocal: string; ical: string; icsNote: string; afterCancel: string;
  opening: string; addrL: string; doctor: string; barTreat: string; incomplete: string; book: string; checkupP: string; cancelShort: string;
  eVisit: string; eTreat: string; eSlot: string; eVorname: string; eNachname: string; eHandy: string; eEmail: string; eRefYN: string; eRefName: string; eConsent: string;
  zones: string[];
}

const T: Record<Lang, DraftTexts> = {
de:{
  say:"Wir behandeln Sie gerne in Ihrer Sprache",
  spec:"Spezialisiert auf Faltenbehandlung",
  otherZone:"Andere Zone", otherPh:"Welche Zone?",
  achsel:"Übermäßiges Schwitzen", achselD:"Hyperhidrose unter den Achseln",
  z1D:"Eine frei wählbare Zone (zum Beispiel Stirn, Zornesfalte oder Krähenfüße)", z2D:"Zwei frei wählbare Zonen (zum Beispiel Stirn und Zornesfalte)", z3D:"Drei frei wählbare Zonen (zum Beispiel Stirn, Zornesfalte und Krähenfüße)",
  interestL:"Ich interessiere mich für:", noCommitTag:"Unverbindliche Vorauswahl", noCommit:"Gerne auch mehreres. Was wir machen, besprechen wir gemeinsam vor Ort.", yesBeen:"Ja", noFirst:"Nein, mein erster Besuch",
  stepTreat:"Behandlung", stepSlot:"Termin", stepData:"Angaben", consultPrice:"Preis folgt", from:p=>`ab ${p}`,
  zonesL:"Anzahl Zonen", zoneHelpQ:"Was ist eine Zone?", zoneHelpA:"Eine Zone ist ein Behandlungsbereich, zum Beispiel Zornesfalte, Stirn oder Krähenfüße (beide Seiten). Welche Zonen es werden, entscheiden wir gemeinsam vor Ort.",
  perZone:p=>`${p} je Zone, zusätzlich zu 3 Zonen`, combineHint:"Mehrere Behandlungen lassen sich kombinieren.", noteAdd:"Notiz hinzufügen",
  next1:"Weiter zur Terminauswahl", next2:"Weiter zu Ihren Angaben", back:"Zurück", overviewH:"Ihre Buchung", change:"Ändern", refThanks:"Danke!", refSend:"Senden",
  visitQ:"Waren Sie schon einmal bei uns?", vFirst:"Ich komme zum ersten Mal", vReturn:"Ich war schon einmal da",
  visitFirstLbl:"Erster Besuch", visitReturnLbl:"Schon einmal da", checkupLbl:"Kontrolltermin",
  treatQ:"Wofür interessieren Sie sich?", unsureT:"Ich bin noch unsicher", unsureD:"Ich möchte mich erst beraten lassen.", afterConsult:"Preis nach Beratung",
  botGroup:"Botulinum-Behandlung", z1:"1 Zone", z2:"2 Zonen", z3:"3 Zonen", choice:"nach Wahl",
  extraT:"Zusätzliche Zonen", extraOff:p=>`${p} je Zone, nur zusammen mit 3 Zonen`, extraOn:p=>`${p} je Zone. Wählen Sie, welche dazukommen sollen.`,
  moreGroup:"Weitere Behandlungen",
  kaumuskel:"Kaumuskel", kaumuskelD:"Kaumuskelentspannung und Facial Slimming", nefertiti:"Nefertiti-Lift", nefertitiD:"Hals und Jawline, Entspannung",
  lachs:"Lachs-DNA", lachsD:"Dunkle Augenringe, eine Behandlung", lachsPack:"Lachs-DNA Viererpaket", lachsPackD:"Dunkle Augenringe, vier Behandlungen",
  lachsRow:"Lachs-DNA, eine Behandlung",
  noteL:"Notiz zur Behandlung", optional:"(freiwillig)", notePh:"Zum Beispiel: normalerweise zwei Zonen, diesmal vielleicht den Kaumuskel dazu.",
  priceHint:"* Abrechnung nach der Gebührenordnung für Ärzte. Preise inklusive Mehrwertsteuer.",
  slotQ:"Wann passt es Ihnen?", slotQCheckup:"Wann passt Ihnen der Kontrolltermin?",
  downT:"Die freien Termine laden gerade nicht.", downP:"Das liegt an uns, nicht an Ihnen. Schreiben Sie uns kurz per WhatsApp oder rufen Sie an, dann finden wir sofort einen Termin.",
  copy:"Nummer kopieren", copied:"Kopiert", marked:"Markiert, jetzt kopieren",
  wait:"Die freien Zeiten erscheinen hier, sobald Sie oben ausgewählt haben, ob Sie zum ersten Mal kommen und was Sie machen lassen möchten. Davon hängt ab, wie lange Ihr Termin dauert.",
  nextFree:"Nächster freier Termin", orDay:"Oder selbst einen Tag wählen", dayAria:"Tag wählen", closed:"Geschlossen", closedAria:"geschlossen",
  holiday:"Tag der Deutschen Einheit", fullT:"An diesem Tag ist nichts mehr frei.", fullP:"Bitte wählen Sie einen anderen Tag.",
  at:t=>t+" Uhr",
  dataH:"Ihre Angaben", vorname:"Vorname", nachname:"Nachname", handy:"Handynummer", handyWhy:"(für Bestätigung und Erinnerung per WhatsApp)", email:"E-Mail-Adresse",
  phoneReturn:"Bitte dieselbe Handynummer wie bei Ihrem letzten Besuch, damit wir Sie wiedererkennen.",
  refQ:"Hat Ihnen jemand Palo Skin empfohlen?", yes:"Ja", no:"Nein", refPh:"Name oder Empfehlungscode",
  consent:"Ich willige ein, dass Palo Skin meine Angaben einschließlich der gewählten Behandlung zur Terminvereinbarung verarbeitet und mir Bestätigung und Erinnerung per WhatsApp schickt. Die Erinnerung können Sie jederzeit abbestellen. Mehr dazu in der Datenschutzerklärung.", required:"Pflicht",
  cancelT:"Sie können nicht kommen?", cancelP:"Bitte sagen Sie mindestens 48 Stunden vorher ab, dann kann jemand anderes den Termin nutzen.",
  sumHead:"Ihr Termin", beratungRow:"Beratung, Behandlung noch offen", beratungVal:"nach Beratung", estimate:"Voraussichtlich", notePrefix:"Notiz: ",
  botRow:"Botulinum, ", extraRow:"Zusätzliche Zone: ",
  doneH:"Ihr Termin ist gebucht", doneMail:e=>`Die Bestätigung mit Kalendereinladung geht an ${e}.`,
  gcal:"In Google Kalender eintragen", ocal:"In Outlook-Kalender eintragen", ical:"In iPhone-Kalender eintragen",
  icsNote:"Auf der echten Seite öffnet sich hier sofort der iPhone-Kalender mit dem fertigen Termin. Im Entwurf ist das Herunterladen gesperrt.",
  afterCancel:"Absagen oder verschieben können Sie über den Link in der Bestätigung. Bitte mindestens 48 Stunden vorher.",
  opening:"Wir eröffnen am 1. Oktober", addrL:"Adresse", doctor:"Arzt",
  barTreat:"Behandlung", incomplete:"Noch unvollständig", book:"Termin buchen",
  checkupP:"Sie wurden zu einem kurzen Kontrolltermin eingeladen.",
  cancelShort:"Absagen bitte mindestens 48 Stunden vorher.",
  eVisit:"Bitte wählen Sie aus, ob Sie zum ersten Mal kommen.", eTreat:"Bitte wählen Sie eine Behandlung oder „Ich bin noch unsicher“.", eSlot:"Bitte wählen Sie eine Uhrzeit.",
  eVorname:"Bitte geben Sie Ihren Vornamen an.", eNachname:"Bitte geben Sie Ihren Nachnamen an.", eHandy:"Bitte geben Sie eine vollständige Handynummer an.",
  eEmail:"Bitte geben Sie eine gültige E-Mail-Adresse an.", eRefYN:"Bitte wählen Sie Ja oder Nein.", eRefName:"Bitte nennen Sie den Namen oder den Empfehlungscode.",
  eConsent:"Ohne diese Einwilligung können wir den Termin nicht anlegen.",
  zones:["Lip Flip","Brow Lift","Mundwinkel","Erdbeerkinn","Gummy Smile","Oberlippenfältchen","Bunny Lines","Nasenverschmälerung"]
},
en:{
  say:"We are happy to treat you in your language",
  spec:"Specialised in wrinkle treatment",
  otherZone:"Other area", otherPh:"Which area?",
  achsel:"Excessive sweating", achselD:"Hyperhidrosis of the underarms",
  z1D:"One area of your choice (for example forehead, frown lines or crow’s feet)", z2D:"Two areas of your choice (for example forehead and frown lines)", z3D:"Three areas of your choice (for example forehead, frown lines and crow’s feet)",
  interestL:"I am interested in:", noCommitTag:"Non-binding preselection", noCommit:"Several are fine. We decide together at your appointment what we do.", yesBeen:"Yes", noFirst:"No, my first visit",
  stepTreat:"Treatment", stepSlot:"Time", stepData:"Details", consultPrice:"Price to follow", from:p=>`from ${p}`,
  zonesL:"Number of areas", zoneHelpQ:"What is an area?", zoneHelpA:"An area is one treatment region, for example frown lines, forehead or crow’s feet (both sides). We decide together at your appointment which areas it will be.",
  perZone:p=>`${p} each, in addition to 3 areas`, combineHint:"Several treatments can be combined.", noteAdd:"Add a note",
  next1:"Continue to choose a time", next2:"Continue to your details", back:"Back", overviewH:"Your booking", change:"Change", refThanks:"Thank you!", refSend:"Send",
  visitQ:"Have you visited us before?", vFirst:"This is my first visit", vReturn:"I have been here before",
  visitFirstLbl:"First visit", visitReturnLbl:"Returning", checkupLbl:"Follow-up",
  treatQ:"What are you interested in?", unsureT:"I’m not sure yet", unsureD:"I would like a consultation first.", afterConsult:"Price after consultation",
  botGroup:"Botulinum treatment", z1:"1 area", z2:"2 areas", z3:"3 areas", choice:"of your choice",
  extraT:"Additional areas", extraOff:p=>`${p} per area, only together with 3 areas`, extraOn:p=>`${p} per area. Choose which ones to add.`,
  moreGroup:"Other treatments",
  kaumuskel:"Masseter", kaumuskelD:"Jaw muscle relaxation and facial slimming", nefertiti:"Nefertiti lift", nefertitiD:"Neck and jawline, relaxation",
  lachs:"Salmon DNA", lachsD:"Dark circles, one treatment", lachsPack:"Salmon DNA, pack of four", lachsPackD:"Dark circles, four treatments",
  lachsRow:"Salmon DNA, one treatment",
  noteL:"Note on your treatment", optional:"(optional)", notePh:"For example: usually two areas, maybe the masseter as well this time.",
  priceHint:"* Billed according to the German fee schedule for physicians (Gebührenordnung für Ärzte). Prices include value added tax.",
  slotQ:"When suits you?", slotQCheckup:"When suits you for your follow-up?",
  downT:"Available times are not loading right now.", downP:"The problem is on our side, not yours. Send us a quick WhatsApp message or give us a call and we will find a time straight away.",
  copy:"Copy number", copied:"Copied", marked:"Selected, now copy",
  wait:"Available times appear here once you have chosen above whether this is your first visit and what you would like done. This determines how long your appointment takes.",
  nextFree:"Next available appointment", orDay:"Or choose a day yourself", dayAria:"Choose a day", closed:"Closed", closedAria:"closed",
  holiday:"German Unity Day", fullT:"Nothing is available on this day.", fullP:"Please choose another day.",
  at:t=>t,
  dataH:"Your details", vorname:"First name", nachname:"Last name", handy:"Mobile number", handyWhy:"(for confirmation and reminder via WhatsApp)", email:"Email address",
  phoneReturn:"Please use the same mobile number as at your last visit so we can recognise you.",
  refQ:"Did someone recommend Palo Skin to you?", yes:"Yes", no:"No", refPh:"Name or referral code",
  consent:"I consent to Palo Skin processing my details, including the chosen treatment, to arrange my appointment and to send me a confirmation and reminder via WhatsApp. You can unsubscribe from reminders at any time. More in the privacy policy.", required:"Required",
  cancelT:"Can’t make it?", cancelP:"Please cancel at least 48 hours in advance so someone else can use the appointment.",
  sumHead:"Your appointment", beratungRow:"Consultation, treatment to be decided", beratungVal:"after consultation", estimate:"Estimated", notePrefix:"Note: ",
  botRow:"Botulinum, ", extraRow:"Additional area: ",
  doneH:"Your appointment is booked", doneMail:e=>`The confirmation with a calendar invitation is on its way to ${e}.`,
  gcal:"Add to Google Calendar", ocal:"Add to Outlook Calendar", ical:"Add to iPhone Calendar",
  icsNote:"On the live page, this opens the iPhone calendar with the appointment ready. Downloading is disabled in the mockup.",
  afterCancel:"You can cancel or reschedule via the link in your confirmation, at least 48 hours in advance.",
  opening:"We open on 1 October", addrL:"Address", doctor:"Physician",
  barTreat:"Treatment", incomplete:"Not complete yet", book:"Book appointment",
  checkupP:"You have been invited to a short follow-up appointment.",
  cancelShort:"Please cancel at least 48 hours in advance.",
  eVisit:"Please choose whether this is your first visit.", eTreat:"Please choose a treatment or “I’m not sure yet”.", eSlot:"Please choose a time.",
  eVorname:"Please enter your first name.", eNachname:"Please enter your last name.", eHandy:"Please enter a complete mobile number.",
  eEmail:"Please enter a valid email address.", eRefYN:"Please choose Yes or No.", eRefName:"Please enter the name or referral code.",
  eConsent:"We cannot create the appointment without this consent.",
  zones:["Lip Flip","Brow Lift","Mouth corners","Dimpled chin","Gummy Smile","Upper lip lines","Bunny Lines","Nose slimming"]
},
es:{
  say:"Le atendemos con gusto en su idioma",
  spec:"Especializados en el tratamiento de arrugas",
  otherZone:"Otra zona", otherPh:"¿Qué zona?",
  achsel:"Sudoración excesiva", achselD:"Hiperhidrosis de las axilas",
  z1D:"Una zona a elegir (por ejemplo frente, entrecejo o patas de gallo)", z2D:"Dos zonas a elegir (por ejemplo frente y entrecejo)", z3D:"Tres zonas a elegir (por ejemplo frente, entrecejo y patas de gallo)",
  interestL:"Me interesa:", noCommitTag:"Preselección sin compromiso", noCommit:"Puede elegir varias. Lo que hacemos lo decidimos juntos en la cita.", yesBeen:"Sí", noFirst:"No, es mi primera visita",
  stepTreat:"Tratamiento", stepSlot:"Cita", stepData:"Datos", consultPrice:"Precio por confirmar", from:p=>`desde ${p}`,
  zonesL:"Número de zonas", zoneHelpQ:"¿Qué es una zona?", zoneHelpA:"Una zona es un área de tratamiento, por ejemplo el entrecejo, la frente o las patas de gallo (ambos lados). Decidimos juntos las zonas durante la cita.",
  perZone:p=>`${p} cada una, además de 3 zonas`, combineHint:"Se pueden combinar varios tratamientos.", noteAdd:"Añadir una nota",
  next1:"Continuar para elegir la hora", next2:"Continuar a sus datos", back:"Atrás", overviewH:"Su reserva", change:"Cambiar", refThanks:"¡Gracias!", refSend:"Enviar",
  visitQ:"¿Ya nos ha visitado antes?", vFirst:"Vengo por primera vez", vReturn:"Ya he estado antes",
  visitFirstLbl:"Primera visita", visitReturnLbl:"Ya ha estado", checkupLbl:"Revisión",
  treatQ:"¿Qué le interesa?", unsureT:"Aún no lo tengo claro", unsureD:"Prefiero recibir asesoramiento primero.", afterConsult:"Precio tras la consulta",
  botGroup:"Tratamiento con toxina botulínica", z1:"1 zona", z2:"2 zonas", z3:"3 zonas", choice:"a elegir",
  extraT:"Zonas adicionales", extraOff:p=>`${p} por zona, solo junto con 3 zonas`, extraOn:p=>`${p} por zona. Elija cuáles quiere añadir.`,
  moreGroup:"Otros tratamientos",
  kaumuskel:"Masetero", kaumuskelD:"Relajación del masetero y Facial Slimming", nefertiti:"Lifting Nefertiti", nefertitiD:"Cuello y mandíbula, relajación",
  lachs:"ADN de salmón", lachsD:"Ojeras, un tratamiento", lachsPack:"ADN de salmón, pack de cuatro", lachsPackD:"Ojeras, cuatro tratamientos",
  lachsRow:"ADN de salmón, un tratamiento",
  noteL:"Nota sobre el tratamiento", optional:"(opcional)", notePh:"Por ejemplo: normalmente dos zonas, esta vez quizá también el masetero.",
  priceHint:"* Facturación según el baremo alemán de honorarios médicos (Gebührenordnung für Ärzte). Precios con el impuesto sobre el valor añadido incluido.",
  slotQ:"¿Cuándo le viene bien?", slotQCheckup:"¿Cuándo le viene bien la revisión?",
  downT:"Los horarios disponibles no se están cargando.", downP:"El problema es nuestro, no suyo. Escríbanos por WhatsApp o llámenos y encontraremos una cita enseguida.",
  copy:"Copiar número", copied:"Copiado", marked:"Seleccionado, ahora copie",
  wait:"Los horarios disponibles aparecerán aquí en cuanto haya indicado arriba si viene por primera vez y qué desea hacerse. De ello depende la duración de su cita.",
  nextFree:"Próxima cita disponible", orDay:"O elija usted un día", dayAria:"Elegir día", closed:"Cerrado", closedAria:"cerrado",
  holiday:"Día de la Unidad Alemana", fullT:"Este día ya no queda nada libre.", fullP:"Por favor, elija otro día.",
  at:t=>t+" h",
  dataH:"Sus datos", vorname:"Nombre", nachname:"Apellidos", handy:"Número de móvil", handyWhy:"(para la confirmación y el recordatorio por WhatsApp)", email:"Correo electrónico",
  phoneReturn:"Por favor, use el mismo número de móvil que en su última visita para que podamos reconocerle.",
  refQ:"¿Alguien le ha recomendado Palo Skin?", yes:"Sí", no:"No", refPh:"Nombre o código de recomendación",
  consent:"Doy mi consentimiento para que Palo Skin trate mis datos, incluido el tratamiento elegido, para gestionar mi cita y enviarme la confirmación y un recordatorio por WhatsApp. Puede darse de baja de los recordatorios en cualquier momento. Más información en la política de privacidad.", required:"Obligatorio",
  cancelT:"¿No puede venir?", cancelP:"Por favor, cancele con al menos 48 horas de antelación para que otra persona pueda aprovechar la cita.",
  sumHead:"Su cita", beratungRow:"Consulta, tratamiento por decidir", beratungVal:"tras la consulta", estimate:"Estimado", notePrefix:"Nota: ",
  botRow:"Toxina botulínica, ", extraRow:"Zona adicional: ",
  doneH:"Su cita está reservada", doneMail:e=>`La confirmación con la invitación de calendario se enviará a ${e}.`,
  gcal:"Añadir a Google Calendar", ocal:"Añadir al calendario de Outlook", ical:"Añadir al calendario del iPhone",
  icsNote:"En la página real se abre aquí directamente el calendario del iPhone con la cita. En el borrador la descarga está desactivada.",
  afterCancel:"Puede cancelar o cambiar la cita con el enlace de la confirmación, con al menos 48 horas de antelación.",
  opening:"Abrimos el 1 de octubre", addrL:"Dirección", doctor:"Médico",
  barTreat:"Tratamiento", incomplete:"Aún incompleta", book:"Reservar cita",
  checkupP:"Le hemos invitado a una breve cita de revisión.",
  cancelShort:"Por favor, cancele con al menos 48 horas de antelación.",
  eVisit:"Por favor, indique si viene por primera vez.", eTreat:"Por favor, elija un tratamiento o «Aún no lo tengo claro».", eSlot:"Por favor, elija una hora.",
  eVorname:"Por favor, indique su nombre.", eNachname:"Por favor, indique sus apellidos.", eHandy:"Por favor, indique un número de móvil completo.",
  eEmail:"Por favor, indique un correo electrónico válido.", eRefYN:"Por favor, elija Sí o No.", eRefName:"Por favor, indique el nombre o el código de recomendación.",
  eConsent:"Sin este consentimiento no podemos crear la cita.",
  zones:["Lip Flip","Brow Lift","Comisuras de la boca","Mentón en piel de naranja","Sonrisa gingival","Arrugas del labio superior","Bunny Lines","Afinar la nariz"]
},
fr:{
  say:"Nous vous recevons volontiers dans votre langue",
  spec:"Spécialisés dans le traitement des rides",
  otherZone:"Autre zone", otherPh:"Quelle zone ?",
  achsel:"Transpiration excessive", achselD:"Hyperhidrose des aisselles",
  z1D:"Une zone au choix (par exemple front, ride du lion ou pattes d’oie)", z2D:"Deux zones au choix (par exemple front et ride du lion)", z3D:"Trois zones au choix (par exemple front, ride du lion et pattes d’oie)",
  interestL:"Je m’intéresse à :", noCommitTag:"Présélection sans engagement", noCommit:"Plusieurs choix possibles. Nous décidons ensemble sur place de ce que nous faisons.", yesBeen:"Oui", noFirst:"Non, c’est ma première visite",
  stepTreat:"Soin", stepSlot:"Rendez-vous", stepData:"Coordonnées", consultPrice:"Prix à venir", from:p=>`à partir de ${p}`,
  zonesL:"Nombre de zones", zoneHelpQ:"Qu’est-ce qu’une zone ?", zoneHelpA:"Une zone est une région traitée, par exemple la ride du lion, le front ou les pattes d’oie (des deux côtés). Nous choisissons les zones ensemble lors du rendez-vous.",
  perZone:p=>`${p} chacune, en plus de 3 zones`, combineHint:"Plusieurs soins peuvent être combinés.", noteAdd:"Ajouter une note",
  next1:"Continuer vers le choix de l’horaire", next2:"Continuer vers vos coordonnées", back:"Retour", overviewH:"Votre réservation", change:"Modifier", refThanks:"Merci !", refSend:"Envoyer",
  visitQ:"Nous avez-vous déjà rendu visite ?", vFirst:"C’est ma première visite", vReturn:"Ce n’est pas ma première visite",
  visitFirstLbl:"Première visite", visitReturnLbl:"Déjà venu(e)", checkupLbl:"Contrôle",
  treatQ:"Qu’est-ce qui vous intéresse ?", unsureT:"Je ne sais pas encore", unsureD:"Je souhaite d’abord un conseil.", afterConsult:"Prix après consultation",
  botGroup:"Traitement à la toxine botulique", z1:"1 zone", z2:"2 zones", z3:"3 zones", choice:"au choix",
  extraT:"Zones supplémentaires", extraOff:p=>`${p} par zone, uniquement avec 3 zones`, extraOn:p=>`${p} par zone. Choisissez celles à ajouter.`,
  moreGroup:"Autres soins",
  kaumuskel:"Masséter", kaumuskelD:"Détente du masséter et Facial Slimming", nefertiti:"Lifting Néfertiti", nefertitiD:"Cou et mâchoire, détente",
  lachs:"ADN de saumon", lachsD:"Cernes, une séance", lachsPack:"ADN de saumon, forfait de quatre", lachsPackD:"Cernes, quatre séances",
  lachsRow:"ADN de saumon, une séance",
  noteL:"Note sur le soin", optional:"(facultatif)", notePh:"Par exemple : d’habitude deux zones, cette fois peut-être aussi le masséter.",
  priceHint:"* Facturation selon le barème allemand des honoraires médicaux (Gebührenordnung für Ärzte). Prix taxe sur la valeur ajoutée comprise.",
  slotQ:"Quand cela vous convient-il ?", slotQCheckup:"Quand le contrôle vous convient-il ?",
  downT:"Les créneaux disponibles ne se chargent pas pour le moment.", downP:"Le problème vient de nous, pas de vous. Écrivez-nous sur WhatsApp ou appelez-nous, nous trouverons un rendez-vous tout de suite.",
  copy:"Copier le numéro", copied:"Copié", marked:"Sélectionné, copiez maintenant",
  wait:"Les créneaux disponibles apparaîtront ici dès que vous aurez indiqué ci-dessus s’il s’agit de votre première visite et quel soin vous souhaitez. La durée du rendez-vous en dépend.",
  nextFree:"Prochain rendez-vous disponible", orDay:"Ou choisissez vous-même un jour", dayAria:"Choisir un jour", closed:"Fermé", closedAria:"fermé",
  holiday:"Jour de l’Unité allemande", fullT:"Plus rien n’est disponible ce jour-là.", fullP:"Veuillez choisir un autre jour.",
  at:t=>t.replace(":"," h "),
  dataH:"Vos coordonnées", vorname:"Prénom", nachname:"Nom", handy:"Numéro de portable", handyWhy:"(pour la confirmation et le rappel par WhatsApp)", email:"Adresse e-mail",
  phoneReturn:"Veuillez indiquer le même numéro de portable que lors de votre dernière visite afin que nous puissions vous reconnaître.",
  refQ:"Quelqu’un vous a-t-il recommandé Palo Skin ?", yes:"Oui", no:"Non", refPh:"Nom ou code de parrainage",
  consent:"J’accepte que Palo Skin traite mes données, y compris le soin choisi, pour organiser mon rendez-vous et m’envoyer la confirmation et un rappel par WhatsApp. Vous pouvez vous désabonner des rappels à tout moment. Plus d’informations dans la politique de confidentialité.", required:"Obligatoire",
  cancelT:"Vous ne pouvez pas venir ?", cancelP:"Merci d’annuler au moins 48 heures à l’avance afin que quelqu’un d’autre puisse profiter du rendez-vous.",
  sumHead:"Votre rendez-vous", beratungRow:"Consultation, soin à définir", beratungVal:"après consultation", estimate:"Estimation", notePrefix:"Note : ",
  botRow:"Toxine botulique, ", extraRow:"Zone supplémentaire : ",
  doneH:"Votre rendez-vous est réservé", doneMail:e=>`La confirmation avec l’invitation de calendrier est envoyée à ${e}.`,
  gcal:"Ajouter à Google Agenda", ocal:"Ajouter au calendrier Outlook", ical:"Ajouter au calendrier de l’iPhone",
  icsNote:"Sur la vraie page, le calendrier de l’iPhone s’ouvre ici directement avec le rendez-vous. Le téléchargement est désactivé dans la maquette.",
  afterCancel:"Vous pouvez annuler ou déplacer le rendez-vous via le lien de la confirmation, au moins 48 heures à l’avance.",
  opening:"Ouverture le 1er octobre", addrL:"Adresse", doctor:"Médecin",
  barTreat:"Soin", incomplete:"Pas encore complet", book:"Réserver",
  checkupP:"Vous avez été invité(e) à un court rendez-vous de contrôle.",
  cancelShort:"Merci d’annuler au moins 48 heures à l’avance.",
  eVisit:"Veuillez indiquer s’il s’agit de votre première visite.", eTreat:"Veuillez choisir un soin ou « Je ne sais pas encore ».", eSlot:"Veuillez choisir un horaire.",
  eVorname:"Veuillez indiquer votre prénom.", eNachname:"Veuillez indiquer votre nom.", eHandy:"Veuillez indiquer un numéro de portable complet.",
  eEmail:"Veuillez indiquer une adresse e-mail valide.", eRefYN:"Veuillez choisir Oui ou Non.", eRefName:"Veuillez indiquer le nom ou le code de parrainage.",
  eConsent:"Sans ce consentement, nous ne pouvons pas créer le rendez-vous.",
  zones:["Lip Flip","Brow Lift","Coins de la bouche","Menton en peau d’orange","Sourire gingival","Ridules de la lèvre supérieure","Bunny Lines","Affinement du nez"]
},
pt:{
  say:"Atendemos você com prazer no seu idioma",
  spec:"Especializados no tratamento de rugas",
  otherZone:"Outra área", otherPh:"Qual área?",
  achsel:"Suor excessivo", achselD:"Hiperidrose nas axilas",
  z1D:"Uma área à sua escolha (por exemplo testa, entre as sobrancelhas ou pés de galinha)", z2D:"Duas áreas à sua escolha (por exemplo testa e entre as sobrancelhas)", z3D:"Três áreas à sua escolha (por exemplo testa, entre as sobrancelhas e pés de galinha)",
  interestL:"Tenho interesse em:", noCommitTag:"Pré-seleção sem compromisso", noCommit:"Pode escolher mais de uma. Decidimos juntos na consulta o que vamos fazer.", yesBeen:"Sim", noFirst:"Não, é minha primeira vez",
  stepTreat:"Tratamento", stepSlot:"Horário", stepData:"Dados", consultPrice:"Preço a definir", from:p=>`a partir de ${p}`,
  zonesL:"Número de áreas", zoneHelpQ:"O que é uma área?", zoneHelpA:"Uma área é uma região de tratamento, por exemplo entre as sobrancelhas, a testa ou os pés de galinha (os dois lados). Definimos juntos as áreas na consulta.",
  perZone:p=>`${p} cada, além de 3 áreas`, combineHint:"É possível combinar vários tratamentos.", noteAdd:"Adicionar observação",
  next1:"Continuar para escolher o horário", next2:"Continuar para seus dados", back:"Voltar", overviewH:"Sua reserva", change:"Alterar", refThanks:"Obrigado!", refSend:"Enviar",
  visitQ:"Você já nos visitou antes?", vFirst:"É a minha primeira vez", vReturn:"Já estive aqui antes",
  visitFirstLbl:"Primeira visita", visitReturnLbl:"Retorno", checkupLbl:"Revisão",
  treatQ:"Em que você tem interesse?", unsureT:"Ainda não tenho certeza", unsureD:"Quero primeiro uma avaliação.", afterConsult:"Preço após a avaliação",
  botGroup:"Tratamento com toxina botulínica", z1:"1 área", z2:"2 áreas", z3:"3 áreas", choice:"à sua escolha",
  extraT:"Áreas adicionais", extraOff:p=>`${p} por área, somente junto com 3 áreas`, extraOn:p=>`${p} por área. Escolha quais deseja adicionar.`,
  moreGroup:"Outros tratamentos",
  kaumuskel:"Masseter", kaumuskelD:"Relaxamento do masseter e Facial Slimming", nefertiti:"Lifting Nefertiti", nefertitiD:"Pescoço e mandíbula, relaxamento",
  lachs:"DNA de salmão", lachsD:"Olheiras, uma sessão", lachsPack:"DNA de salmão, pacote de quatro", lachsPackD:"Olheiras, quatro sessões",
  lachsRow:"DNA de salmão, uma sessão",
  noteL:"Observação sobre o tratamento", optional:"(opcional)", notePh:"Por exemplo: normalmente duas áreas, desta vez talvez também o masseter.",
  priceHint:"* Cobrança conforme a tabela alemã de honorários médicos (Gebührenordnung für Ärzte). Preços com imposto sobre o valor agregado incluído.",
  slotQ:"Quando fica bom para você?", slotQCheckup:"Quando fica bom para a sua revisão?",
  downT:"Os horários disponíveis não estão carregando no momento.", downP:"O problema é nosso, não seu. Mande uma mensagem pelo WhatsApp ou ligue, e encontramos um horário na hora.",
  copy:"Copiar número", copied:"Copiado", marked:"Selecionado, agora copie",
  wait:"Os horários disponíveis aparecem aqui assim que você indicar acima se é a sua primeira vez e o que deseja fazer. Disso depende a duração da sua consulta.",
  nextFree:"Próximo horário disponível", orDay:"Ou escolha você mesmo um dia", dayAria:"Escolher dia", closed:"Fechado", closedAria:"fechado",
  holiday:"Dia da Unidade Alemã", fullT:"Não há mais horários livres neste dia.", fullP:"Por favor, escolha outro dia.",
  at:t=>t,
  dataH:"Seus dados", vorname:"Nome", nachname:"Sobrenome", handy:"Celular", handyWhy:"(para a confirmação e o lembrete pelo WhatsApp)", email:"E-mail",
  phoneReturn:"Use o mesmo número de celular da sua última visita, para que possamos reconhecer você.",
  refQ:"Alguém recomendou a Palo Skin para você?", yes:"Sim", no:"Não", refPh:"Nome ou código de indicação",
  consent:"Autorizo a Palo Skin a tratar meus dados, incluindo o tratamento escolhido, para agendar a consulta e enviar a confirmação e um lembrete pelo WhatsApp. Você pode cancelar os lembretes a qualquer momento. Mais informações na política de privacidade.", required:"Obrigatório",
  cancelT:"Não vai poder vir?", cancelP:"Por favor, cancele com pelo menos 48 horas de antecedência, para que outra pessoa possa usar o horário.",
  sumHead:"Sua consulta", beratungRow:"Avaliação, tratamento a definir", beratungVal:"após a avaliação", estimate:"Previsto", notePrefix:"Observação: ",
  botRow:"Toxina botulínica, ", extraRow:"Área adicional: ",
  doneH:"Sua consulta está agendada", doneMail:e=>`A confirmação com o convite de calendário será enviada para ${e}.`,
  gcal:"Adicionar ao Google Agenda", ocal:"Adicionar ao calendário do Outlook", ical:"Adicionar ao calendário do iPhone",
  icsNote:"Na página real, o calendário do iPhone abre aqui direto com a consulta. No rascunho, o download está desativado.",
  afterCancel:"Você pode cancelar ou remarcar pelo link na confirmação, com pelo menos 48 horas de antecedência.",
  opening:"Inauguramos em 1º de outubro", addrL:"Endereço", doctor:"Médico",
  barTreat:"Tratamento", incomplete:"Ainda incompleto", book:"Agendar",
  checkupP:"Você foi convidado(a) para uma breve consulta de revisão.",
  cancelShort:"Por favor, cancele com pelo menos 48 horas de antecedência.",
  eVisit:"Indique se é a sua primeira vez.", eTreat:"Escolha um tratamento ou “Ainda não tenho certeza”.", eSlot:"Escolha um horário.",
  eVorname:"Informe seu nome.", eNachname:"Informe seu sobrenome.", eHandy:"Informe um número de celular completo.",
  eEmail:"Informe um e-mail válido.", eRefYN:"Escolha Sim ou Não.", eRefName:"Informe o nome ou o código de indicação.",
  eConsent:"Sem esta autorização não podemos criar a consulta.",
  zones:["Lip Flip","Brow Lift","Cantos da boca","Queixo em casca de laranja","Sorriso gengival","Rugas do lábio superior","Bunny Lines","Afinamento do nariz"]
}
};

/* Ergänzungen für die echte Seite. Deutsch nach Bauauftrag, Übersetzungen bitte gegenlesen. */
export interface ExtraTexts {
  testBanner: string;
  afterCancelReal: string;
  pendingT: string;
  pendingP: string;
  conflict: string;
  bookErr: string;
  loading: string;
  noneFree: string;
  refL: string;
  durL: string;
  minutes: (n: number) => string;
  home: string;
  legalImprint: string;
  legalPrivacy: string;
}

const X: Record<Lang, ExtraTexts> = {
  de: {
    testBanner: "Testversion. Bitte nur erfundene Namen und keine echten Behandlungswünsche eintragen. Die Buchung landet wirklich im Kalender.",
    afterCancelReal: "Absagen oder verschieben bitte per WhatsApp oder Anruf unter +49 151 58872566, mindestens 48 Stunden vorher.",
    pendingT: "Wir prüfen Ihre Buchung.", pendingP: "Bitte nicht erneut buchen, wir melden uns.",
    conflict: "Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit.",
    bookErr: "Die Buchung hat gerade nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie uns per WhatsApp.",
    loading: "Die freien Zeiten werden geladen.",
    noneFree: "Online ist gerade kein Termin frei. Schreiben Sie uns per WhatsApp, dann finden wir einen.",
    refL: "Buchungsnummer", durL: "Dauer", minutes: (n) => `${n} Minuten`,
    home: "Zur Startseite", legalImprint: "Impressum", legalPrivacy: "Datenschutzerklärung",
  },
  en: {
    testBanner: "Test version. Please enter invented names only and no real treatment wishes. The booking really does go into the calendar.",
    afterCancelReal: "To cancel or reschedule, please send us a WhatsApp message or call +49 151 58872566, at least 48 hours in advance.",
    pendingT: "We are checking your booking.", pendingP: "Please do not book again, we will get in touch.",
    conflict: "This time has just been taken. Please choose another time.",
    bookErr: "The booking did not go through just now. Please try again or send us a WhatsApp message.",
    loading: "Available times are loading.",
    noneFree: "No appointment is available online right now. Send us a WhatsApp message and we will find one.",
    refL: "Booking number", durL: "Duration", minutes: (n) => `${n} minutes`,
    home: "Back to the start page", legalImprint: "Legal notice", legalPrivacy: "Privacy policy",
  },
  es: {
    testBanner: "Versión de prueba. Introduzca solo nombres inventados y ningún deseo de tratamiento real. La reserva se registra de verdad en el calendario.",
    afterCancelReal: "Para cancelar o cambiar la cita, escríbanos por WhatsApp o llámenos al +49 151 58872566, con al menos 48 horas de antelación.",
    pendingT: "Estamos comprobando su reserva.", pendingP: "Por favor, no vuelva a reservar. Nos pondremos en contacto con usted.",
    conflict: "Esta hora acaba de ser reservada. Por favor, elija otra hora.",
    bookErr: "La reserva no se ha completado. Inténtelo de nuevo o escríbanos por WhatsApp.",
    loading: "Los horarios disponibles se están cargando.",
    noneFree: "Ahora mismo no hay ninguna cita libre online. Escríbanos por WhatsApp y encontraremos una.",
    refL: "Número de reserva", durL: "Duración", minutes: (n) => `${n} minutos`,
    home: "Volver a la página de inicio", legalImprint: "Aviso legal", legalPrivacy: "Política de privacidad",
  },
  fr: {
    testBanner: "Version de test. Merci de n’indiquer que des noms inventés et aucun souhait de soin réel. La réservation est réellement inscrite dans l’agenda.",
    afterCancelReal: "Pour annuler ou déplacer le rendez-vous, écrivez-nous sur WhatsApp ou appelez le +49 151 58872566, au moins 48 heures à l’avance.",
    pendingT: "Nous vérifions votre réservation.", pendingP: "Merci de ne pas réserver à nouveau, nous vous recontactons.",
    conflict: "Ce créneau vient d’être pris. Veuillez choisir un autre horaire.",
    bookErr: "La réservation n’a pas abouti. Veuillez réessayer ou nous écrire sur WhatsApp.",
    loading: "Les créneaux disponibles se chargent.",
    noneFree: "Aucun rendez-vous n’est disponible en ligne pour le moment. Écrivez-nous sur WhatsApp, nous en trouverons un.",
    refL: "Numéro de réservation", durL: "Durée", minutes: (n) => `${n} minutes`,
    home: "Retour à la page d’accueil", legalImprint: "Mentions légales", legalPrivacy: "Politique de confidentialité",
  },
  pt: {
    testBanner: "Versão de teste. Use apenas nomes inventados e nenhum desejo real de tratamento. A reserva é registrada de verdade no calendário.",
    afterCancelReal: "Para cancelar ou remarcar, mande uma mensagem pelo WhatsApp ou ligue para +49 151 58872566, com pelo menos 48 horas de antecedência.",
    pendingT: "Estamos verificando a sua reserva.", pendingP: "Por favor, não reserve de novo, nós entramos em contato.",
    conflict: "Este horário acabou de ser reservado. Por favor, escolha outro horário.",
    bookErr: "A reserva não foi concluída. Tente de novo ou mande uma mensagem pelo WhatsApp.",
    loading: "Os horários disponíveis estão carregando.",
    noneFree: "No momento não há horário livre online. Mande uma mensagem pelo WhatsApp e encontramos um.",
    refL: "Número da reserva", durL: "Duração", minutes: (n) => `${n} minutos`,
    home: "Voltar à página inicial", legalImprint: "Informações legais", legalPrivacy: "Política de privacidade",
  },
};

export type Texts = DraftTexts & ExtraTexts;

export const TEXTS: Record<Lang, Texts> = {
  de: { ...T.de, ...X.de },
  en: { ...T.en, ...X.en },
  es: { ...T.es, ...X.es },
  fr: { ...T.fr, ...X.fr },
  pt: { ...T.pt, ...X.pt },
};

/* Französisch: geschütztes Leerzeichen vor ? ! : ; und in « » */
{
  const fr = TEXTS.fr as unknown as Record<string, unknown>;
  for (const k of Object.keys(fr)) {
    const v = fr[k];
    if (typeof v === "string") fr[k] = v.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
  }
}

export const LANG_IDS: Lang[] = LANGS.map((x) => x.id);

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANG_IDS as string[]).includes(v);
}
