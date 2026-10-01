/*
 * Texte der Buchung in fünf Sprachen. Block T wörtlich aus dem Entwurf Version 26 übernommen,
 * nichts umformuliert. Block X: Ergänzungen für die echte Seite (Testhinweis, Buchungsnummer,
 * unklarer Ausgang, Absage per WhatsApp), die im Entwurf nicht vorkommen.
 */
import type { Lang, ZoneId } from "./treatments";

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
  say: string; spec: string; otherPh: string; achsel: string; achselD: string;
  interestL: string; noCommitTag: string; noCommit: string; yesBeen: string; noFirst: string;
  stepTreat: string; stepSlot: string; stepData: string; consultPrice: string; noteAdd: string;
  next1: string; next2: string; back: string; change: string; refThanks: string; refSend: string;
  visitQ: string; visitFirstLbl: string; visitReturnLbl: string; checkupLbl: string;
  treatQ: string; unsureT: string; unsureD: string; botGroup: string; moreGroup: string;
  kaumuskel: string; kaumuskelD: string; nefertiti: string; nefertitiD: string;
  lachs: string; lachsD: string; lachsPack: string; lachsPackD: string; lachsRow: string;
  noteL: string; optional: string; notePh: string; priceHint: string;
  slotQ: string; slotQCheckup: string; downT: string; downP: string; copy: string; copied: string; marked: string; nextFree: string; orDay: string; dayAria: string; closed: string; closedAria: string; holiday: string; fullT: string; fullP: string;
  at: Fn1;
  dataH: string; vorname: string; nachname: string; handy: string; handyWhy: string; email: string; phoneReturn: string;
  refQ: string; refPh: string; consent: string; cancelT: string; cancelP: string; sumHead: string; beratungRow: string; botRow: string; doneH: string; gcal: string; ocal: string; ical: string; addrL: string; book: string; checkupP: string; cancelShort: string;
  eVisit: string; eTreat: string; eSlot: string; eVorname: string; eNachname: string; eHandy: string; eEmail: string; eConsent: string;
  }

const T: Record<Lang, DraftTexts> = {
de:{
  say:"Wir behandeln Sie gerne in Ihrer Sprache",
  spec:"Spezialisiert auf Faltenbehandlung",
  otherPh:"Welche Zone?",
  achsel:"Übermäßiges Schwitzen", achselD:"Hyperhidrose",
  interestL:"Ich interessiere mich für:", noCommitTag:"Unverbindliche Vorauswahl", noCommit:"Gerne auch mehreres. Was wir machen, besprechen wir gemeinsam vor Ort.", yesBeen:"Ja", noFirst:"Nein, mein erster Besuch",
  stepTreat:"Behandlung", stepSlot:"Termin", stepData:"Angaben", consultPrice:"", noteAdd:"Notiz hinzufügen",
  next1:"Weiter: Wann passt es Ihnen?", next2:"Weiter: Fast geschafft", back:"Zurück", change:"Ändern", refThanks:"Danke!", refSend:"Senden",
  visitQ:"Waren Sie schon einmal bei uns?", visitFirstLbl:"Erster Besuch", visitReturnLbl:"Schon einmal da", checkupLbl:"Kontrolltermin",
  treatQ:"Wofür interessieren Sie sich?", unsureT:"Ich lasse mich erst beraten", unsureD:"Wir nehmen uns Zeit und finden gemeinsam, was zu Ihnen passt.", botGroup:"Botulinum-Behandlung", moreGroup:"Weitere Behandlungen",
  kaumuskel:"Kaumuskel", kaumuskelD:"Kaumuskelentspannung und Facial Slimming", nefertiti:"Nefertiti-Lift", nefertitiD:"Hals und Jawline, Entspannung",
  lachs:"Lachs-DNA", lachsD:"Dunkle Augenringe, eine Behandlung", lachsPack:"Lachs-DNA Viererpaket", lachsPackD:"Dunkle Augenringe, vier Behandlungen",
  lachsRow:"Lachs-DNA, eine Behandlung",
  noteL:"Notiz zur Behandlung", optional:"(freiwillig)", notePh:"Zum Beispiel: normalerweise zwei Zonen, diesmal vielleicht den Kaumuskel dazu.",
  priceHint:"* Richtwerte. Abrechnung nach der Gebührenordnung für Ärzte. Preise inklusive Mehrwertsteuer.",
  slotQ:"Wann passt es Ihnen?", slotQCheckup:"Wann passt Ihnen der Kontrolltermin?",
  downT:"Gerade hakt es bei uns.", downP:"Schreiben Sie uns kurz per WhatsApp, wir finden schnell einen Termin für Sie.",
  copy:"Nummer kopieren", copied:"Kopiert", marked:"Markiert, jetzt kopieren",
  nextFree:"Nächster freier Termin", orDay:"Oder selbst einen Tag wählen", dayAria:"Tag wählen", closed:"An diesem Tag sind wir nicht im Studio.", closedAria:"geschlossen",
  holiday:"Tag der Deutschen Einheit", fullT:"Dieser Tag ist schon ausgebucht.", fullP:"Schauen Sie gern an einem anderen Tag.",
  at:t=>t+" Uhr",
  dataH:"Wie erreichen wir Sie?", vorname:"Vorname", nachname:"Nachname", handy:"Handynummer", handyWhy:"(für die Terminbestätigung per WhatsApp)", email:"E-Mail-Adresse",
  phoneReturn:"Am besten dieselbe Nummer wie beim letzten Mal, dann erkennen wir Sie gleich wieder.",
  refQ:"Hat Ihnen jemand Palo Skin empfohlen?", refPh:"Name oder Empfehlungscode",
  consent:"Ich bin einverstanden, dass Palo Skin meine Angaben, auch die gewählte Behandlung, für meinen Termin verarbeitet. Mehr in der Datenschutzerklärung.", cancelT:"Etwas kommt dazwischen?", cancelP:"Sagen Sie uns bitte mindestens 48 Stunden vorher Bescheid, dann freut sich jemand anderes über den Termin.",
  sumHead:"Ihr Termin", beratungRow:"Beratung, Behandlung noch offen", botRow:"Botulinum, ", doneH:"Schön, Ihre Terminanfrage ist da. Wir bestätigen sie kurz per WhatsApp.", gcal:"In Google Kalender eintragen", ocal:"In Outlook-Kalender eintragen", ical:"In iPhone-Kalender eintragen",
  addrL:"Adresse", book:"Termin anfragen",
  checkupP:"Sie wurden zu einem kurzen Kontrolltermin eingeladen.",
  cancelShort:"Absagen bitte mindestens 48 Stunden vorher.",
  eVisit:"Kurz noch: Waren Sie schon einmal bei uns?", eTreat:"Kurz noch: Bitte eine Behandlung wählen oder „Ich lasse mich erst beraten“.", eSlot:"Kurz noch: Bitte eine Uhrzeit wählen.",
  eVorname:"Kurz noch: Ihr Vorname fehlt.", eNachname:"Kurz noch: Ihr Nachname fehlt.", eHandy:"Kurz noch: Die Handynummer scheint unvollständig.",
  eEmail:"Kurz noch: Die E-Mail-Adresse stimmt noch nicht ganz.", eConsent:"Ohne diese Einwilligung können wir den Termin nicht anlegen.",
  },
en:{
  say:"We are happy to treat you in your language",
  spec:"Specialised in wrinkle treatment",
  otherPh:"Which area?",
  achsel:"Excessive sweating", achselD:"Hyperhidrosis of the underarms",
  interestL:"I am interested in:", noCommitTag:"Non-binding preselection", noCommit:"Several are fine. We decide together at your appointment what we do.", yesBeen:"Yes", noFirst:"No, my first visit",
  stepTreat:"Treatment", stepSlot:"Time", stepData:"Details", consultPrice:"Price to follow", noteAdd:"Add a note",
  next1:"Continue to choose a time", next2:"Continue to your details", back:"Back", change:"Change", refThanks:"Thank you!", refSend:"Send",
  visitQ:"Have you visited us before?", visitFirstLbl:"First visit", visitReturnLbl:"Returning", checkupLbl:"Follow-up",
  treatQ:"What are you interested in?", unsureT:"I’m not sure yet", unsureD:"I would like a consultation first.", botGroup:"Botulinum treatment", moreGroup:"Other treatments",
  kaumuskel:"Masseter", kaumuskelD:"Jaw muscle relaxation and facial slimming", nefertiti:"Nefertiti lift", nefertitiD:"Neck and jawline, relaxation",
  lachs:"Salmon DNA", lachsD:"Dark circles, one treatment", lachsPack:"Salmon DNA, pack of four", lachsPackD:"Dark circles, four treatments",
  lachsRow:"Salmon DNA, one treatment",
  noteL:"Note on your treatment", optional:"(optional)", notePh:"For example: usually two areas, maybe the masseter as well this time.",
  priceHint:"* Guide prices. Billed according to the German fee schedule for physicians (Gebührenordnung für Ärzte). Prices include value added tax.",
  slotQ:"When suits you?", slotQCheckup:"When suits you for your follow-up?",
  downT:"Available times are not loading right now.", downP:"The problem is on our side, not yours. Send us a quick WhatsApp message or give us a call and we will find a time straight away.",
  copy:"Copy number", copied:"Copied", marked:"Selected, now copy",
  nextFree:"Next available appointment", orDay:"Or choose a day yourself", dayAria:"Choose a day", closed:"Closed", closedAria:"closed",
  holiday:"German Unity Day", fullT:"Nothing is available on this day.", fullP:"Please choose another day.",
  at:t=>t,
  dataH:"Your details", vorname:"First name", nachname:"Last name", handy:"Mobile number", handyWhy:"(for confirmation and reminder via WhatsApp)", email:"Email address",
  phoneReturn:"Please use the same mobile number as at your last visit so we can recognise you.",
  refQ:"Did someone recommend Palo Skin to you?", refPh:"Name or referral code",
  consent:"I consent to Palo Skin processing my details, including the chosen treatment, to arrange my appointment and to send me a confirmation and reminder via WhatsApp. You can unsubscribe from reminders at any time. More in the privacy policy.", cancelT:"Can’t make it?", cancelP:"Please cancel at least 48 hours in advance so someone else can use the appointment.",
  sumHead:"Your appointment", beratungRow:"Consultation, treatment to be decided", botRow:"Botulinum, ", doneH:"Your appointment is booked", gcal:"Add to Google Calendar", ocal:"Add to Outlook Calendar", ical:"Add to iPhone Calendar",
  addrL:"Address", book:"Book appointment",
  checkupP:"You have been invited to a short follow-up appointment.",
  cancelShort:"Please cancel at least 48 hours in advance.",
  eVisit:"Please choose whether this is your first visit.", eTreat:"Please choose a treatment or “I’m not sure yet”.", eSlot:"Please choose a time.",
  eVorname:"Please enter your first name.", eNachname:"Please enter your last name.", eHandy:"Please enter a complete mobile number.",
  eEmail:"Please enter a valid email address.", eConsent:"We cannot create the appointment without this consent.",
  },
es:{
  say:"Le atendemos con gusto en su idioma",
  spec:"Especializados en el tratamiento de arrugas",
  otherPh:"¿Qué zona?",
  achsel:"Sudoración excesiva", achselD:"Hiperhidrosis de las axilas",
  interestL:"Me interesa:", noCommitTag:"Preselección sin compromiso", noCommit:"Puede elegir varias. Lo que hacemos lo decidimos juntos en la cita.", yesBeen:"Sí", noFirst:"No, es mi primera visita",
  stepTreat:"Tratamiento", stepSlot:"Cita", stepData:"Datos", consultPrice:"Precio por confirmar", noteAdd:"Añadir una nota",
  next1:"Continuar para elegir la hora", next2:"Continuar a sus datos", back:"Atrás", change:"Cambiar", refThanks:"¡Gracias!", refSend:"Enviar",
  visitQ:"¿Ya nos ha visitado antes?", visitFirstLbl:"Primera visita", visitReturnLbl:"Ya ha estado", checkupLbl:"Revisión",
  treatQ:"¿Qué le interesa?", unsureT:"Aún no lo tengo claro", unsureD:"Prefiero recibir asesoramiento primero.", botGroup:"Tratamiento con toxina botulínica", moreGroup:"Otros tratamientos",
  kaumuskel:"Masetero", kaumuskelD:"Relajación del masetero y Facial Slimming", nefertiti:"Lifting Nefertiti", nefertitiD:"Cuello y mandíbula, relajación",
  lachs:"ADN de salmón", lachsD:"Ojeras, un tratamiento", lachsPack:"ADN de salmón, pack de cuatro", lachsPackD:"Ojeras, cuatro tratamientos",
  lachsRow:"ADN de salmón, un tratamiento",
  noteL:"Nota sobre el tratamiento", optional:"(opcional)", notePh:"Por ejemplo: normalmente dos zonas, esta vez quizá también el masetero.",
  priceHint:"* Precios orientativos. Facturación según el baremo alemán de honorarios médicos (Gebührenordnung für Ärzte). Precios con el impuesto sobre el valor añadido incluido.",
  slotQ:"¿Cuándo le viene bien?", slotQCheckup:"¿Cuándo le viene bien la revisión?",
  downT:"Los horarios disponibles no se están cargando.", downP:"El problema es nuestro, no suyo. Escríbanos por WhatsApp o llámenos y encontraremos una cita enseguida.",
  copy:"Copiar número", copied:"Copiado", marked:"Seleccionado, ahora copie",
  nextFree:"Próxima cita disponible", orDay:"O elija usted un día", dayAria:"Elegir día", closed:"Cerrado", closedAria:"cerrado",
  holiday:"Día de la Unidad Alemana", fullT:"Este día ya no queda nada libre.", fullP:"Por favor, elija otro día.",
  at:t=>t+" h",
  dataH:"Sus datos", vorname:"Nombre", nachname:"Apellidos", handy:"Número de móvil", handyWhy:"(para la confirmación y el recordatorio por WhatsApp)", email:"Correo electrónico",
  phoneReturn:"Por favor, use el mismo número de móvil que en su última visita para que podamos reconocerle.",
  refQ:"¿Alguien le ha recomendado Palo Skin?", refPh:"Nombre o código de recomendación",
  consent:"Doy mi consentimiento para que Palo Skin trate mis datos, incluido el tratamiento elegido, para gestionar mi cita y enviarme la confirmación y un recordatorio por WhatsApp. Puede darse de baja de los recordatorios en cualquier momento. Más información en la política de privacidad.", cancelT:"¿No puede venir?", cancelP:"Por favor, cancele con al menos 48 horas de antelación para que otra persona pueda aprovechar la cita.",
  sumHead:"Su cita", beratungRow:"Consulta, tratamiento por decidir", botRow:"Toxina botulínica, ", doneH:"Su cita está reservada", gcal:"Añadir a Google Calendar", ocal:"Añadir al calendario de Outlook", ical:"Añadir al calendario del iPhone",
  addrL:"Dirección", book:"Reservar cita",
  checkupP:"Le hemos invitado a una breve cita de revisión.",
  cancelShort:"Por favor, cancele con al menos 48 horas de antelación.",
  eVisit:"Por favor, indique si viene por primera vez.", eTreat:"Por favor, elija un tratamiento o «Aún no lo tengo claro».", eSlot:"Por favor, elija una hora.",
  eVorname:"Por favor, indique su nombre.", eNachname:"Por favor, indique sus apellidos.", eHandy:"Por favor, indique un número de móvil completo.",
  eEmail:"Por favor, indique un correo electrónico válido.", eConsent:"Sin este consentimiento no podemos crear la cita.",
  },
fr:{
  say:"Nous vous recevons volontiers dans votre langue",
  spec:"Spécialisés dans le traitement des rides",
  otherPh:"Quelle zone ?",
  achsel:"Transpiration excessive", achselD:"Hyperhidrose des aisselles",
  interestL:"Je m’intéresse à :", noCommitTag:"Présélection sans engagement", noCommit:"Plusieurs choix possibles. Nous décidons ensemble sur place de ce que nous faisons.", yesBeen:"Oui", noFirst:"Non, c’est ma première visite",
  stepTreat:"Soin", stepSlot:"Rendez-vous", stepData:"Coordonnées", consultPrice:"Prix à venir", noteAdd:"Ajouter une note",
  next1:"Continuer vers le choix de l’horaire", next2:"Continuer vers vos coordonnées", back:"Retour", change:"Modifier", refThanks:"Merci !", refSend:"Envoyer",
  visitQ:"Nous avez-vous déjà rendu visite ?", visitFirstLbl:"Première visite", visitReturnLbl:"Déjà venu(e)", checkupLbl:"Contrôle",
  treatQ:"Qu’est-ce qui vous intéresse ?", unsureT:"Je ne sais pas encore", unsureD:"Je souhaite d’abord un conseil.", botGroup:"Traitement à la toxine botulique", moreGroup:"Autres soins",
  kaumuskel:"Masséter", kaumuskelD:"Détente du masséter et Facial Slimming", nefertiti:"Lifting Néfertiti", nefertitiD:"Cou et mâchoire, détente",
  lachs:"ADN de saumon", lachsD:"Cernes, une séance", lachsPack:"ADN de saumon, forfait de quatre", lachsPackD:"Cernes, quatre séances",
  lachsRow:"ADN de saumon, une séance",
  noteL:"Note sur le soin", optional:"(facultatif)", notePh:"Par exemple : d’habitude deux zones, cette fois peut-être aussi le masséter.",
  priceHint:"* Prix indicatifs. Facturation selon le barème allemand des honoraires médicaux (Gebührenordnung für Ärzte). Prix taxe sur la valeur ajoutée comprise.",
  slotQ:"Quand cela vous convient-il ?", slotQCheckup:"Quand le contrôle vous convient-il ?",
  downT:"Les créneaux disponibles ne se chargent pas pour le moment.", downP:"Le problème vient de nous, pas de vous. Écrivez-nous sur WhatsApp ou appelez-nous, nous trouverons un rendez-vous tout de suite.",
  copy:"Copier le numéro", copied:"Copié", marked:"Sélectionné, copiez maintenant",
  nextFree:"Prochain rendez-vous disponible", orDay:"Ou choisissez vous-même un jour", dayAria:"Choisir un jour", closed:"Fermé", closedAria:"fermé",
  holiday:"Jour de l’Unité allemande", fullT:"Plus rien n’est disponible ce jour-là.", fullP:"Veuillez choisir un autre jour.",
  at:t=>t.replace(":"," h "),
  dataH:"Vos coordonnées", vorname:"Prénom", nachname:"Nom", handy:"Numéro de portable", handyWhy:"(pour la confirmation et le rappel par WhatsApp)", email:"Adresse e-mail",
  phoneReturn:"Veuillez indiquer le même numéro de portable que lors de votre dernière visite afin que nous puissions vous reconnaître.",
  refQ:"Quelqu’un vous a-t-il recommandé Palo Skin ?", refPh:"Nom ou code de parrainage",
  consent:"J’accepte que Palo Skin traite mes données, y compris le soin choisi, pour organiser mon rendez-vous et m’envoyer la confirmation et un rappel par WhatsApp. Vous pouvez vous désabonner des rappels à tout moment. Plus d’informations dans la politique de confidentialité.", cancelT:"Vous ne pouvez pas venir ?", cancelP:"Merci d’annuler au moins 48 heures à l’avance afin que quelqu’un d’autre puisse profiter du rendez-vous.",
  sumHead:"Votre rendez-vous", beratungRow:"Consultation, soin à définir", botRow:"Toxine botulique, ", doneH:"Votre rendez-vous est réservé", gcal:"Ajouter à Google Agenda", ocal:"Ajouter au calendrier Outlook", ical:"Ajouter au calendrier de l’iPhone",
  addrL:"Adresse", book:"Réserver",
  checkupP:"Vous avez été invité(e) à un court rendez-vous de contrôle.",
  cancelShort:"Merci d’annuler au moins 48 heures à l’avance.",
  eVisit:"Veuillez indiquer s’il s’agit de votre première visite.", eTreat:"Veuillez choisir un soin ou « Je ne sais pas encore ».", eSlot:"Veuillez choisir un horaire.",
  eVorname:"Veuillez indiquer votre prénom.", eNachname:"Veuillez indiquer votre nom.", eHandy:"Veuillez indiquer un numéro de portable complet.",
  eEmail:"Veuillez indiquer une adresse e-mail valide.", eConsent:"Sans ce consentement, nous ne pouvons pas créer le rendez-vous.",
  },
pt:{
  say:"Atendemos você com prazer no seu idioma",
  spec:"Especializados no tratamento de rugas",
  otherPh:"Qual área?",
  achsel:"Suor excessivo", achselD:"Hiperidrose nas axilas",
  interestL:"Tenho interesse em:", noCommitTag:"Pré-seleção sem compromisso", noCommit:"Pode escolher mais de uma. Decidimos juntos na consulta o que vamos fazer.", yesBeen:"Sim", noFirst:"Não, é minha primeira vez",
  stepTreat:"Tratamento", stepSlot:"Horário", stepData:"Dados", consultPrice:"Preço a definir", noteAdd:"Adicionar observação",
  next1:"Continuar para escolher o horário", next2:"Continuar para seus dados", back:"Voltar", change:"Alterar", refThanks:"Obrigado!", refSend:"Enviar",
  visitQ:"Você já nos visitou antes?", visitFirstLbl:"Primeira visita", visitReturnLbl:"Retorno", checkupLbl:"Revisão",
  treatQ:"Em que você tem interesse?", unsureT:"Ainda não tenho certeza", unsureD:"Quero primeiro uma avaliação.", botGroup:"Tratamento com toxina botulínica", moreGroup:"Outros tratamentos",
  kaumuskel:"Masseter", kaumuskelD:"Relaxamento do masseter e Facial Slimming", nefertiti:"Lifting Nefertiti", nefertitiD:"Pescoço e mandíbula, relaxamento",
  lachs:"DNA de salmão", lachsD:"Olheiras, uma sessão", lachsPack:"DNA de salmão, pacote de quatro", lachsPackD:"Olheiras, quatro sessões",
  lachsRow:"DNA de salmão, uma sessão",
  noteL:"Observação sobre o tratamento", optional:"(opcional)", notePh:"Por exemplo: normalmente duas áreas, desta vez talvez também o masseter.",
  priceHint:"* Valores de referência. Cobrança conforme a tabela alemã de honorários médicos (Gebührenordnung für Ärzte). Preços com imposto sobre o valor agregado incluído.",
  slotQ:"Quando fica bom para você?", slotQCheckup:"Quando fica bom para a sua revisão?",
  downT:"Os horários disponíveis não estão carregando no momento.", downP:"O problema é nosso, não seu. Mande uma mensagem pelo WhatsApp ou ligue, e encontramos um horário na hora.",
  copy:"Copiar número", copied:"Copiado", marked:"Selecionado, agora copie",
  nextFree:"Próximo horário disponível", orDay:"Ou escolha você mesmo um dia", dayAria:"Escolher dia", closed:"Fechado", closedAria:"fechado",
  holiday:"Dia da Unidade Alemã", fullT:"Não há mais horários livres neste dia.", fullP:"Por favor, escolha outro dia.",
  at:t=>t,
  dataH:"Seus dados", vorname:"Nome", nachname:"Sobrenome", handy:"Celular", handyWhy:"(para a confirmação e o lembrete pelo WhatsApp)", email:"E-mail",
  phoneReturn:"Use o mesmo número de celular da sua última visita, para que possamos reconhecer você.",
  refQ:"Alguém recomendou a Palo Skin para você?", refPh:"Nome ou código de indicação",
  consent:"Autorizo a Palo Skin a tratar meus dados, incluindo o tratamento escolhido, para agendar a consulta e enviar a confirmação e um lembrete pelo WhatsApp. Você pode cancelar os lembretes a qualquer momento. Mais informações na política de privacidade.", cancelT:"Não vai poder vir?", cancelP:"Por favor, cancele com pelo menos 48 horas de antecedência, para que outra pessoa possa usar o horário.",
  sumHead:"Sua consulta", beratungRow:"Avaliação, tratamento a definir", botRow:"Toxina botulínica, ", doneH:"Sua consulta está agendada", gcal:"Adicionar ao Google Agenda", ocal:"Adicionar ao calendário do Outlook", ical:"Adicionar ao calendário do iPhone",
  addrL:"Endereço", book:"Agendar",
  checkupP:"Você foi convidado(a) para uma breve consulta de revisão.",
  cancelShort:"Por favor, cancele com pelo menos 48 horas de antecedência.",
  eVisit:"Indique se é a sua primeira vez.", eTreat:"Escolha um tratamento ou “Ainda não tenho certeza”.", eSlot:"Escolha um horário.",
  eVorname:"Informe seu nome.", eNachname:"Informe seu sobrenome.", eHandy:"Informe um número de celular completo.",
  eEmail:"Informe um e-mail válido.", eConsent:"Sem esta autorização não podemos criar a consulta.",
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
  /* Zonenauswahl, alle Zonen gleichwertig (1. Oktober 2026) */
  zoneNames: Record<ZoneId, string>;
  zoneOther: string;
  zoneUnknown: string;
  zonesOpen: string;
  zoneCountLabel: (n: number) => string;
  zoneTiers: (p1: string, p2: string, p3: string, p4: string) => string;
  /* Personenzahl (1. Oktober 2026) */
  personsQ: string;
  persons1: string;
  persons2: string;
  personsMore: string;
  secondPerson: string;
  /* freiwilliger Erinnerungshaken */
  reminderOpt: string;
}

const X: Record<Lang, ExtraTexts> = {
  de: {
    testBanner: "Testversion. Bitte nur erfundene Namen und keine echten Behandlungswünsche eintragen. Die Buchung landet wirklich im Kalender.",
    afterCancelReal: "Absagen oder verschieben bitte per WhatsApp unter +49 151 58872566, mindestens 48 Stunden vorher.",
    pendingT: "Wir prüfen Ihre Buchung.", pendingP: "Bitte nicht erneut buchen, wir melden uns.",
    conflict: "Da war jemand schneller. Wählen Sie bitte eine andere Uhrzeit.",
    bookErr: "Das hat gerade nicht geklappt. Versuchen Sie es bitte noch einmal oder schreiben Sie uns per WhatsApp.",
    loading: "Einen Moment, wir schauen in den Kalender.",
    noneFree: "Online ist gerade nichts frei. Schreiben Sie uns per WhatsApp, wir finden einen Termin für Sie.",
    refL: "Buchungsnummer", durL: "Dauer", minutes: (n) => `${n} Minuten`,
    home: "Zur Startseite", legalImprint: "Impressum", legalPrivacy: "Datenschutzerklärung",
    zoneNames: { zornesfalte: "Zornesfalte", stirn: "Stirn", kraehenfuesse: "Krähenfüße", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Mundwinkel", erdbeerkinn: "Erdbeerkinn", gummysmile: "Gummy Smile", oberlippe: "Oberlippenfältchen", nase: "Nasenverschmälerung" },
    personsQ: "Kommen Sie allein oder zu zweit?", persons1: "Allein", persons2: "Zu zweit", personsMore: "Zu dritt oder mehr? Schreiben Sie uns kurz per WhatsApp, wir legen die Termine direkt hintereinander.", secondPerson: "Schön, wir planen mehr Zeit ein. Ihre Begleitung entscheidet entspannt vor Ort, was sie möchte.",
    reminderOpt: "Erinnern Sie mich gern per WhatsApp an den Termin.",
    zoneOther: "Sonstiges", zoneUnknown: "Weiß ich noch nicht", zonesOpen: "Zonen noch offen",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "Zone" : "Zonen"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 Zone ${p1}, 2 Zonen ${p2}, 3 Zonen ${p3}, jede weitere ${p4}`,
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
    zoneNames: { zornesfalte: "Frown lines", stirn: "Forehead", kraehenfuesse: "Crow’s feet", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Mouth corners", erdbeerkinn: "Dimpled chin", gummysmile: "Gummy Smile", oberlippe: "Upper lip lines", nase: "Nose slimming" },
    personsQ: "For how many people?", persons1: "1 person", persons2: "2 people", personsMore: "More than two? Please book adjacent appointments.", secondPerson: "The second person chooses their treatment at the appointment.",
    reminderOpt: "You are welcome to remind me of the appointment on WhatsApp.",
    zoneOther: "Other", zoneUnknown: "Not decided yet", zonesOpen: "Areas not decided yet",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "area" : "areas"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 area ${p1}, 2 areas ${p2}, 3 areas ${p3}, each additional ${p4}`,
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
    zoneNames: { zornesfalte: "Entrecejo", stirn: "Frente", kraehenfuesse: "Patas de gallo", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Comisuras de la boca", erdbeerkinn: "Mentón en piel de naranja", gummysmile: "Sonrisa gingival", oberlippe: "Arrugas del labio superior", nase: "Afinar la nariz" },
    personsQ: "¿Para cuántas personas?", persons1: "1 persona", persons2: "2 personas", personsMore: "¿Más de dos? Por favor, reserve citas consecutivas.", secondPerson: "La segunda persona elige su tratamiento en la cita.",
    reminderOpt: "Recuérdenme la cita por WhatsApp, por favor.",
    zoneOther: "Otra", zoneUnknown: "Aún por decidir", zonesOpen: "Zonas por decidir",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "zona" : "zonas"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 zona ${p1}, 2 zonas ${p2}, 3 zonas ${p3}, cada zona adicional ${p4}`,
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
    zoneNames: { zornesfalte: "Ride du lion", stirn: "Front", kraehenfuesse: "Pattes d’oie", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Coins de la bouche", erdbeerkinn: "Menton en peau d’orange", gummysmile: "Sourire gingival", oberlippe: "Ridules de la lèvre supérieure", nase: "Affinement du nez" },
    personsQ: "Pour combien de personnes ?", persons1: "1 personne", persons2: "2 personnes", personsMore: "Plus de deux ? Merci de réserver des rendez-vous consécutifs.", secondPerson: "La deuxième personne choisit son soin sur place.",
    reminderOpt: "Rappelez-moi volontiers le rendez-vous sur WhatsApp.",
    zoneOther: "Autre", zoneUnknown: "Pas encore décidé", zonesOpen: "Zones à définir",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "zone" : "zones"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 zone ${p1}, 2 zones ${p2}, 3 zones ${p3}, chaque zone supplémentaire ${p4}`,
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
    zoneNames: { zornesfalte: "Entre as sobrancelhas", stirn: "Testa", kraehenfuesse: "Pés de galinha", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Cantos da boca", erdbeerkinn: "Queixo em casca de laranja", gummysmile: "Sorriso gengival", oberlippe: "Rugas do lábio superior", nase: "Afinamento do nariz" },
    personsQ: "Para quantas pessoas?", persons1: "1 pessoa", persons2: "2 pessoas", personsMore: "Mais de duas? Por favor, agende horários seguidos.", secondPerson: "A segunda pessoa escolhe o tratamento na consulta.",
    reminderOpt: "Lembrem-me da consulta pelo WhatsApp, por favor.",
    zoneOther: "Outra", zoneUnknown: "Ainda não decidi", zonesOpen: "Áreas a definir",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "área" : "áreas"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 área ${p1}, 2 áreas ${p2}, 3 áreas ${p3}, cada área adicional ${p4}`,
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
