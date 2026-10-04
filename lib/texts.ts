/*
 * Texte der Buchung in fünf Sprachen. Block T wörtlich aus dem Entwurf Version 26 übernommen,
 * nichts umformuliert. Block X: Ergänzungen für die echte Seite (Testhinweis, Buchungsnummer,
 * unklarer Ausgang, Absage per WhatsApp), die im Entwurf nicht vorkommen.
 */
import type { Lang } from "./i18n";
import type { ZoneId } from "./treatments";

export { FLAGS, LANGS, LANG_IDS, isLang } from "./i18n";

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
  dataH: string; vorname: string; nachname: string; handy: string; handyWhy: string; emailWhy: string; email: string; phoneReturn: string;
  refQ: string; refPh: string; consent: string; cancelT: string; cancelP: string; sumHead: string; beratungRow: string; botRow: string; boostRow: string; doneH: string; gcal: string; ocal: string; ical: string; addrL: string; book: string; checkupP: string;
  eVisit: string; eTreat: string; eSlot: string; eVorname: string; eNachname: string; eHandy: string; eEmail: string; eConsent: string;
  }

const T: Record<Lang, DraftTexts> = {
de:{
  say:"Wir behandeln Sie gerne in Ihrer Sprache",
  spec:"Spezialisiert auf Faltenbehandlungen",
  otherPh:"Welche Zone?",
  achsel:"Übermäßiges Schwitzen", achselD:"Achseln (Hyperhidrose)",
  interestL:"Ich interessiere mich für:", noCommitTag:"Unverbindliche Vorauswahl", noCommit:"Gerne auch mehreres. Was wir machen, besprechen wir gemeinsam vor Ort.", yesBeen:"Ja", noFirst:"Nein, mein erster Besuch",
  stepTreat:"Behandlung", stepSlot:"Termin", stepData:"Angaben", consultPrice:"", noteAdd:"Notiz hinzufügen",
  next1:"Weiter: Wann passt es Ihnen?", next2:"Weiter: Fast geschafft", back:"Zurück", change:"Ändern", refThanks:"Danke!", refSend:"Senden",
  visitQ:"Waren Sie schon einmal bei uns?", visitFirstLbl:"Erster Besuch", visitReturnLbl:"Schon einmal da", checkupLbl:"Kontrolltermin",
  treatQ:"Wofür interessieren Sie sich?", unsureT:"Ich lasse mich erst beraten", unsureD:"Wir nehmen uns Zeit und entscheiden gemeinsam, was zu Ihnen passt.", botGroup:"Botox-Behandlung", moreGroup:"Weitere Behandlungen",
  kaumuskel:"Kaumuskel (Masseter)", kaumuskelD:"Facial Slimming, Entspannung bei Zähneknirschen", nefertiti:"Nefertiti-Lift", nefertitiD:"Hals und Kieferkontur",
  lachs:"Lachs-DNA", lachsD:"Dunkle Augenringe, eine Behandlung", lachsPack:"Lachs-DNA, vier Behandlungen", lachsPackD:"Dunkle Augenringe, Augenpartie",
  lachsRow:"Lachs-DNA, eine Behandlung",
  noteL:"Notiz zur Behandlung", optional:"(freiwillig)", notePh:"Zum Beispiel: normalerweise zwei Zonen, diesmal vielleicht den Kaumuskel dazu.",
  priceHint:"* Richtwerte. Abrechnung nach der Gebührenordnung für Ärzte. Preise inklusive Mehrwertsteuer.",
  slotQ:"Wann passt es Ihnen?", slotQCheckup:"Wann passt Ihnen der Kontrolltermin?",
  downT:"Gerade hakt es bei uns.", downP:"Schreiben Sie uns kurz per WhatsApp, wir finden schnell einen Termin für Sie.",
  copy:"Nummer kopieren", copied:"Kopiert", marked:"Markiert, jetzt kopieren",
  nextFree:"Nächster freier Termin", orDay:"Oder selbst einen Tag wählen", dayAria:"Tag wählen", closed:"An diesem Tag sind wir nicht im Studio.", closedAria:"geschlossen",
  holiday:"Tag der Deutschen Einheit", fullT:"Dieser Tag ist schon ausgebucht.", fullP:"Schauen Sie gern an einem anderen Tag.",
  at:t=>t+" Uhr",
  dataH:"Wie erreichen wir Sie?", vorname:"Vorname", nachname:"Nachname", handy:"Handynummer", handyWhy:"", email:"E-Mail-Adresse", emailWhy:"",
  phoneReturn:"Am besten dieselbe Nummer wie beim letzten Mal, dann erkennen wir Sie gleich wieder.",
  refQ:"Hat Ihnen jemand PALO SKIN empfohlen?", refPh:"Name oder Empfehlungscode",
  consent:"Ich bin einverstanden, dass PALO SKIN meine Angaben für meinen Termin verarbeitet. Mehr in der Datenschutzerklärung.", cancelT:"Zeit für Sie", cancelP:"Ihr Termin beginnt pünktlich, in der Regel ganz ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher.",
  sumHead:"Ihr Termin", beratungRow:"Beratung, Behandlung noch offen", botRow:"Botox: ", boostRow:"Skin Booster: ", doneH:"Schön, Ihre Terminanfrage ist da. Wir bestätigen sie kurz per WhatsApp.", gcal:"Google Kalender", ocal:"Outlook", ical:"iPhone-Kalender",
  addrL:"Adresse", book:"Termin buchen",
  checkupP:"Sie wurden zu einem kurzen Kontrolltermin eingeladen.",
  eVisit:"Kurz noch: Waren Sie schon einmal bei uns?", eTreat:"Kurz noch: Bitte eine Behandlung wählen oder „Ich lasse mich erst beraten“.", eSlot:"Kurz noch: Bitte eine Uhrzeit wählen.",
  eVorname:"Kurz noch: Ihr Vorname fehlt.", eNachname:"Kurz noch: Ihr Nachname fehlt.", eHandy:"Die Handynummer scheint nicht zu stimmen. Bitte prüfen Sie sie noch einmal.",
  eEmail:"Kurz noch: Die E-Mail-Adresse stimmt noch nicht ganz.", eConsent:"Kurz noch: Ohne Ihr Einverständnis können wir den Termin leider nicht anlegen.",
  },
en:{
  say:"We are happy to treat you in your language",
  spec:"Specialised in wrinkle treatments",
  otherPh:"Which area?",
  achsel:"Excessive sweating", achselD:"Underarms (hyperhidrosis)",
  interestL:"I am interested in:", noCommitTag:"Non-binding preselection", noCommit:"Several are fine. We decide together at your appointment what we do.", yesBeen:"Yes", noFirst:"No, my first visit",
  stepTreat:"Treatment", stepSlot:"Time", stepData:"Details", consultPrice:"Price to follow", noteAdd:"Add a note",
  next1:"Next: When suits you?", next2:"Next: Almost done", back:"Back", change:"Change", refThanks:"Thank you!", refSend:"Send",
  visitQ:"Have you visited us before?", visitFirstLbl:"First visit", visitReturnLbl:"Returning", checkupLbl:"Follow-up",
  treatQ:"What are you interested in?", unsureT:"I’d like advice first", unsureD:"We take our time and decide together what suits you.", botGroup:"Botox treatment", moreGroup:"Other treatments",
  kaumuskel:"Jaw muscle (masseter)", kaumuskelD:"Facial slimming, relief from teeth grinding", nefertiti:"Nefertiti lift", nefertitiD:"Neck and jawline",
  lachs:"Salmon DNA", lachsD:"Dark circles, one treatment", lachsPack:"Salmon DNA, four treatments", lachsPackD:"Dark circles, eye area",
  lachsRow:"Salmon DNA, one treatment",
  noteL:"Note on your treatment", optional:"(optional)", notePh:"For example: usually two areas, maybe the masseter as well this time.",
  priceHint:"* Guide prices. Billed according to the German fee schedule for physicians (Gebührenordnung für Ärzte). Prices include value added tax.",
  slotQ:"When suits you?", slotQCheckup:"When suits you for your follow-up?",
  downT:"Something’s not working on our side right now.", downP:"Just send us a quick WhatsApp and we’ll find you a time.",
  copy:"Copy number", copied:"Copied", marked:"Selected, now copy",
  nextFree:"Next available appointment", orDay:"Or choose a day yourself", dayAria:"Choose a day", closed:"We’re not in the studio on this day.", closedAria:"closed",
  holiday:"German Unity Day", fullT:"This day is fully booked.", fullP:"Have a look at another day.",
  at:t=>t,
  dataH:"How can we reach you?", vorname:"First name", nachname:"Last name", handy:"Mobile number", handyWhy:"", email:"Email address", emailWhy:"",
  phoneReturn:"Ideally the same number as last time, so we recognise you straight away.",
  refQ:"Did someone recommend PALO SKIN to you?", refPh:"Name or referral code",
  consent:"I agree that PALO SKIN processes my details for my appointment. More in the privacy policy.", cancelT:"Time for you", cancelP:"Your appointment starts on time, usually with no waiting at all. Please arrive at the agreed time or at most five minutes early.",
  sumHead:"Your appointment", beratungRow:"Consultation, treatment to be decided", botRow:"Botox: ", boostRow:"Skin Booster: ", doneH:"Lovely, your request has arrived. We’ll confirm it shortly on WhatsApp.", gcal:"Google Calendar", ocal:"Outlook", ical:"iPhone Calendar",
  addrL:"Address", book:"Book appointment",
  checkupP:"You have been invited to a short follow-up appointment.",
  eVisit:"Just one thing: Have you been with us before?", eTreat:"Just one thing: Please choose a treatment or “I’d like advice first”.", eSlot:"Just one thing: Please choose a time.",
  eVorname:"Just one thing: Your first name is missing.", eNachname:"Just one thing: Your last name is missing.", eHandy:"The mobile number does not seem to be right. Please check it once more.",
  eEmail:"Just one thing: The email address isn’t quite right yet.", eConsent:"Just one thing: Without your consent we unfortunately can’t create the appointment.",
  },
es:{
  say:"Le atendemos con gusto en su idioma",
  spec:"Especializados en tratamientos de arrugas",
  otherPh:"¿Qué zona?",
  achsel:"Sudoración excesiva", achselD:"Axilas (hiperhidrosis)",
  interestL:"Me interesa:", noCommitTag:"Preselección sin compromiso", noCommit:"Puede elegir varias. Lo que hacemos lo decidimos juntos en la cita.", yesBeen:"Sí", noFirst:"No, es mi primera visita",
  stepTreat:"Tratamiento", stepSlot:"Cita", stepData:"Datos", consultPrice:"Precio por confirmar", noteAdd:"Añadir una nota",
  next1:"Siguiente: ¿Cuándo le viene bien?", next2:"Siguiente: casi listo", back:"Atrás", change:"Cambiar", refThanks:"¡Gracias!", refSend:"Enviar",
  visitQ:"¿Ya nos ha visitado antes?", visitFirstLbl:"Primera visita", visitReturnLbl:"Ya ha estado", checkupLbl:"Revisión",
  treatQ:"¿Qué le interesa?", unsureT:"Prefiero que me asesoren primero", unsureD:"Nos tomamos el tiempo para decidir juntos lo que le conviene.", botGroup:"Tratamiento con Botox", moreGroup:"Otros tratamientos",
  kaumuskel:"Masetero (músculo de la mandíbula)", kaumuskelD:"Facial slimming, alivio del bruxismo", nefertiti:"Lifting Nefertiti", nefertitiD:"Cuello y contorno mandibular",
  lachs:"ADN de salmón", lachsD:"Ojeras, un tratamiento", lachsPack:"ADN de salmón, cuatro tratamientos", lachsPackD:"Ojeras, contorno de ojos",
  lachsRow:"ADN de salmón, un tratamiento",
  noteL:"Nota sobre el tratamiento", optional:"(opcional)", notePh:"Por ejemplo: normalmente dos zonas, esta vez quizá también el masetero.",
  priceHint:"* Precios orientativos. Facturación según el baremo alemán de honorarios médicos (Gebührenordnung für Ärzte). Precios con el impuesto sobre el valor añadido incluido.",
  slotQ:"¿Cuándo le viene bien?", slotQCheckup:"¿Cuándo le viene bien la revisión?",
  downT:"Ahora mismo algo falla por nuestra parte.", downP:"Escríbanos por WhatsApp y le buscamos una cita enseguida.",
  copy:"Copiar número", copied:"Copiado", marked:"Seleccionado, ahora copie",
  nextFree:"Próxima cita disponible", orDay:"O elija usted un día", dayAria:"Elegir día", closed:"Este día no estamos en el estudio.", closedAria:"cerrado",
  holiday:"Día de la Unidad Alemana", fullT:"Este día ya está completo.", fullP:"Eche un vistazo a otro día.",
  at:t=>t+" h",
  dataH:"¿Cómo podemos contactarle?", vorname:"Nombre", nachname:"Apellidos", handy:"Número de móvil", handyWhy:"", email:"Correo electrónico", emailWhy:"",
  phoneReturn:"Mejor el mismo número que la última vez, así le reconocemos enseguida.",
  refQ:"¿Alguien le ha recomendado PALO SKIN?", refPh:"Nombre o código de recomendación",
  consent:"Acepto que PALO SKIN trate mis datos para mi cita. Más información en la política de privacidad.", cancelT:"Tiempo para usted", cancelP:"Su cita empieza puntual, por lo general sin ninguna espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes.",
  sumHead:"Su cita", beratungRow:"Consulta, tratamiento por decidir", botRow:"Botox: ", boostRow:"Skin Booster: ", doneH:"Perfecto, hemos recibido su solicitud. Se la confirmamos en breve por WhatsApp.", gcal:"Google Calendar", ocal:"Outlook", ical:"Calendario del iPhone",
  addrL:"Dirección", book:"Reservar cita",
  checkupP:"Le hemos invitado a una breve cita de revisión.",
  eVisit:"Un detalle: ¿Ya ha estado con nosotros?", eTreat:"Un detalle: Elija un tratamiento o «Prefiero que me asesoren primero».", eSlot:"Un detalle: Elija una hora.",
  eVorname:"Un detalle: Falta su nombre.", eNachname:"Un detalle: Faltan sus apellidos.", eHandy:"El número de móvil no parece correcto. Por favor, revíselo otra vez.",
  eEmail:"Un detalle: El correo electrónico aún no es correcto.", eConsent:"Un detalle: Sin su consentimiento no podemos registrar la cita.",
  },
fr:{
  say:"Nous vous recevons volontiers dans votre langue",
  spec:"Spécialisés dans les traitements des rides",
  otherPh:"Quelle zone ?",
  achsel:"Transpiration excessive", achselD:"Aisselles (hyperhidrose)",
  interestL:"Je m’intéresse à :", noCommitTag:"Présélection sans engagement", noCommit:"Plusieurs choix possibles. Nous décidons ensemble sur place de ce que nous faisons.", yesBeen:"Oui", noFirst:"Non, c’est ma première visite",
  stepTreat:"Soin", stepSlot:"Rendez-vous", stepData:"Coordonnées", consultPrice:"Prix à venir", noteAdd:"Ajouter une note",
  next1:"Suivant : quand vous convient-il ?", next2:"Suivant : presque terminé", back:"Retour", change:"Modifier", refThanks:"Merci !", refSend:"Envoyer",
  visitQ:"Nous avez-vous déjà rendu visite ?", visitFirstLbl:"Première visite", visitReturnLbl:"Déjà venu(e)", checkupLbl:"Contrôle",
  treatQ:"Qu’est-ce qui vous intéresse ?", unsureT:"J’aimerais d’abord un conseil", unsureD:"Nous prenons le temps de décider ensemble de ce qui vous convient.", botGroup:"Traitement Botox", moreGroup:"Autres soins",
  kaumuskel:"Masséter (muscle de la mâchoire)", kaumuskelD:"Facial slimming, détente en cas de bruxisme", nefertiti:"Lifting Néfertiti", nefertitiD:"Cou et contour de la mâchoire",
  lachs:"ADN de saumon", lachsD:"Cernes, une séance", lachsPack:"ADN de saumon, quatre séances", lachsPackD:"Cernes, contour des yeux",
  lachsRow:"ADN de saumon, une séance",
  noteL:"Note sur le soin", optional:"(facultatif)", notePh:"Par exemple : d’habitude deux zones, cette fois peut-être aussi le masséter.",
  priceHint:"* Prix indicatifs. Facturation selon le barème allemand des honoraires médicaux (Gebührenordnung für Ärzte). Prix taxe sur la valeur ajoutée comprise.",
  slotQ:"Quand cela vous convient-il ?", slotQCheckup:"Quand le contrôle vous convient-il ?",
  downT:"Petit souci de notre côté en ce moment.", downP:"Écrivez-nous sur WhatsApp, nous vous trouvons vite un rendez-vous.",
  copy:"Copier le numéro", copied:"Copié", marked:"Sélectionné, copiez maintenant",
  nextFree:"Prochain rendez-vous disponible", orDay:"Ou choisissez vous-même un jour", dayAria:"Choisir un jour", closed:"Nous ne sommes pas au studio ce jour-là.", closedAria:"fermé",
  holiday:"Jour de l’Unité allemande", fullT:"Cette journée est déjà complète.", fullP:"Regardez volontiers un autre jour.",
  at:t=>t.replace(":"," h "),
  dataH:"Comment pouvons-nous vous joindre ?", vorname:"Prénom", nachname:"Nom", handy:"Numéro de portable", handyWhy:"", email:"Adresse e-mail", emailWhy:"",
  phoneReturn:"Idéalement le même numéro que la dernière fois, ainsi nous vous reconnaissons tout de suite.",
  refQ:"Quelqu’un vous a-t-il recommandé PALO SKIN ?", refPh:"Nom ou code de parrainage",
  consent:"J’accepte que PALO SKIN traite mes données pour mon rendez-vous. Plus d’informations dans la politique de confidentialité.", cancelT:"Du temps pour vous", cancelP:"Votre rendez-vous commence à l’heure, en général sans aucune attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant.",
  sumHead:"Votre rendez-vous", beratungRow:"Consultation, soin à définir", botRow:"Botox : ", boostRow:"Skin Booster : ", doneH:"Parfait, votre demande est bien arrivée. Nous la confirmons rapidement par WhatsApp.", gcal:"Google Agenda", ocal:"Outlook", ical:"Calendrier iPhone",
  addrL:"Adresse", book:"Réserver le rendez-vous",
  checkupP:"Vous avez été invité(e) à un court rendez-vous de contrôle.",
  eVisit:"Juste une chose : Êtes-vous déjà venu chez nous ?", eTreat:"Juste une chose : Choisissez un soin ou « J’aimerais d’abord un conseil ».", eSlot:"Juste une chose : Choisissez une heure.",
  eVorname:"Juste une chose : Votre prénom manque.", eNachname:"Juste une chose : Votre nom manque.", eHandy:"Le numéro de portable ne semble pas correct. Merci de le vérifier encore une fois.",
  eEmail:"Juste une chose : L’adresse e-mail n’est pas encore tout à fait correcte.", eConsent:"Juste une chose : Sans votre accord, nous ne pouvons malheureusement pas enregistrer le rendez-vous.",
  },
pt:{
  say:"Atendemos você com prazer no seu idioma",
  spec:"Especializados em tratamentos de rugas",
  otherPh:"Qual área?",
  achsel:"Suor excessivo", achselD:"Axilas (hiperidrose)",
  interestL:"Tenho interesse em:", noCommitTag:"Pré-seleção sem compromisso", noCommit:"Pode escolher mais de uma. Decidimos juntos na consulta o que vamos fazer.", yesBeen:"Sim", noFirst:"Não, é minha primeira vez",
  stepTreat:"Tratamento", stepSlot:"Horário", stepData:"Dados", consultPrice:"Preço a definir", noteAdd:"Adicionar observação",
  next1:"Próximo: quando fica bom para você?", next2:"Próximo: quase pronto", back:"Voltar", change:"Alterar", refThanks:"Obrigado!", refSend:"Enviar",
  visitQ:"Você já nos visitou antes?", visitFirstLbl:"Primeira visita", visitReturnLbl:"Retorno", checkupLbl:"Revisão",
  treatQ:"Pelo que você se interessa?", unsureT:"Quero orientação primeiro", unsureD:"Reservamos um tempo para decidir juntos o que combina com você.", botGroup:"Tratamento com Botox", moreGroup:"Outros tratamentos",
  kaumuskel:"Masseter (músculo da mandíbula)", kaumuskelD:"Facial slimming, alívio do bruxismo", nefertiti:"Lifting Nefertiti", nefertitiD:"Pescoço e contorno da mandíbula",
  lachs:"DNA de salmão", lachsD:"Olheiras, uma sessão", lachsPack:"DNA de salmão, quatro sessões", lachsPackD:"Olheiras, área dos olhos",
  lachsRow:"DNA de salmão, uma sessão",
  noteL:"Observação sobre o tratamento", optional:"(opcional)", notePh:"Por exemplo: normalmente duas áreas, desta vez talvez também o masseter.",
  priceHint:"* Valores de referência. Cobrança conforme a tabela alemã de honorários médicos (Gebührenordnung für Ärzte). Preços com imposto sobre o valor agregado incluído.",
  slotQ:"Quando fica bom para você?", slotQCheckup:"Quando fica bom para a sua revisão?",
  downT:"Algo não está funcionando do nosso lado agora.", downP:"Mande uma mensagem no WhatsApp e encontramos um horário rapidinho.",
  copy:"Copiar número", copied:"Copiado", marked:"Selecionado, agora copie",
  nextFree:"Próximo horário disponível", orDay:"Ou escolha você mesmo um dia", dayAria:"Escolher dia", closed:"Neste dia não estamos no estúdio.", closedAria:"fechado",
  holiday:"Dia da Unidade Alemã", fullT:"Este dia já está lotado.", fullP:"Dê uma olhada em outro dia.",
  at:t=>t,
  dataH:"Como podemos falar com você?", vorname:"Nome", nachname:"Sobrenome", handy:"Celular", handyWhy:"", email:"E-mail", emailWhy:"",
  phoneReturn:"De preferência o mesmo número da última vez, assim reconhecemos você na hora.",
  refQ:"Alguém recomendou a PALO SKIN para você?", refPh:"Nome ou código de indicação",
  consent:"Concordo que a PALO SKIN trate meus dados para o meu horário. Mais detalhes na política de privacidade.", cancelT:"Tempo para você", cancelP:"Sua consulta começa pontualmente, em geral sem nenhuma espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes.",
  sumHead:"Sua consulta", beratungRow:"Avaliação, tratamento a definir", botRow:"Botox: ", boostRow:"Skin Booster: ", doneH:"Que bom, recebemos seu pedido. Confirmamos em breve pelo WhatsApp.", gcal:"Google Agenda", ocal:"Outlook", ical:"Calendário do iPhone",
  addrL:"Endereço", book:"Marcar horário",
  checkupP:"Você foi convidado(a) para uma breve consulta de revisão.",
  eVisit:"Só mais uma coisa: Você já esteve com a gente?", eTreat:"Só mais uma coisa: Escolha um tratamento ou “Quero orientação primeiro”.", eSlot:"Só mais uma coisa: Escolha um horário.",
  eVorname:"Só mais uma coisa: Falta seu nome.", eNachname:"Só mais uma coisa: Falta seu sobrenome.", eHandy:"O número de celular não parece correto. Por favor, confira mais uma vez.",
  eEmail:"Só mais uma coisa: O e-mail ainda não está certinho.", eConsent:"Só mais uma coisa: Sem a sua autorização não conseguimos registrar o horário.",
  }
};

/* Ergänzungen für die echte Seite. Deutsch nach Bauauftrag, Übersetzungen bitte gegenlesen. */
export interface ExtraTexts {
  testBanner: string;
  /** unter der Uhrzeitauswahl, immer sichtbar; „per WhatsApp“ wird verlinkt */
  noSlotHint: string;
  noSlotLink: string;
  /** Knopf unter der Konfliktmeldung */
  otherTime: string;
  /** Bestätigungsseite bei verbindlicher Buchung (BOOKING_BINDING) */
  doneBindingH: string;
  /** Unterzeile der Bestätigungsseite bei verbindlicher Buchung */
  doneBindingP: string;
  /** Bestätigungsseite: Kartenlink und Kalenderfrage */
  mapL: string;
  saveQ: string;
  /** zweiter Absatz des Hinweiskastens im letzten Schritt */
  cancelP2: string;
  pendingT: string;
  pendingP: string;
  conflict: string;
  bookErr: string;
  /** Verfügbarkeit nicht prüfbar: nichts gebucht, Eingaben bleiben */
  bookUnavailable: string;
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
  /** kurze Fassung für die Übersicht in Schritt 3 */
  personsSum: string;
  personsMore: string;
  personsWa: string;
  secondPerson: string;
  /* freiwilliger Erinnerungshaken */
  reminderOpt: string;
}

const X: Record<Lang, ExtraTexts> = {
  de: {
    testBanner: "Testversion. Bitte nur erfundene Namen und keine echten Behandlungswünsche eintragen. Die Buchung landet wirklich im Kalender.",
    noSlotHint: "Kein passender Termin dabei? Schreiben Sie uns gern per WhatsApp.", noSlotLink: "per WhatsApp", otherTime: "Andere Zeit wählen",
    mapL: "So finden Sie uns", saveQ: "Möchten Sie den Termin gleich im Kalender speichern?",
    doneBindingH: "Gebucht! Wir freuen uns auf Sie.", doneBindingP: "Alle Details bekommen Sie gleich per E-Mail.",
    cancelP2: "Den Termin verschieben oder absagen können Sie bis 24 Stunden vorher über den Link in Ihrer Terminbestätigung.",
    pendingT: "Wir prüfen Ihre Buchung.", pendingP: "Bitte nicht erneut buchen, wir melden uns.",
    conflict: "Dieser Termin ist online leider nicht mehr buchbar. Bitte wählen Sie eine andere Zeit oder schreiben Sie uns per WhatsApp.",
    bookErr: "Das hat gerade nicht geklappt. Versuchen Sie es bitte noch einmal oder schreiben Sie uns per WhatsApp.",
    bookUnavailable: "Wir können die freien Zeiten gerade nicht prüfen, deshalb ist noch nichts gebucht. Ihre Angaben bleiben erhalten. Bitte versuchen Sie es in ein paar Minuten noch einmal. Oder schreiben Sie uns kurz per WhatsApp.",
    loading: "Einen Moment, wir schauen in den Kalender.",
    noneFree: "Online ist gerade nichts frei. Schreiben Sie uns per WhatsApp, wir finden einen Termin für Sie.",
    refL: "Buchungsnummer", durL: "Dauer", minutes: (n) => `${n} Minuten`,
    home: "Zur Startseite", legalImprint: "Impressum", legalPrivacy: "Datenschutzerklärung",
    zoneNames: { zornesfalte: "Zornesfalte", stirn: "Stirn", kraehenfuesse: "Krähenfüße", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Mundwinkel", erdbeerkinn: "Erdbeerkinn", gummysmile: "Gummy Smile", oberlippe: "Oberlippenfältchen", nase: "Nasenverschmälerung" },
    personsQ: "Für wen buchen Sie?", persons1: "Für mich", persons2: "Für uns zu zweit", personsSum: "Zu zweit", personsMore: "Sie möchten für drei oder mehr Personen buchen? Schreiben Sie uns gern per WhatsApp. Wir planen Ihre Termine direkt hintereinander.", personsWa: "Per WhatsApp schreiben", secondPerson: "Schön, wir planen mehr Zeit ein. Ihre Begleitung entscheidet entspannt vor Ort, was sie möchte.",
    reminderOpt: "Erinnern Sie mich gern per WhatsApp an den Termin.",
    zoneOther: "Sonstiges", zoneUnknown: "Weiß ich noch nicht", zonesOpen: "Zonen noch offen",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "Zone" : "Zonen"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 Zone ${p1}, 2 Zonen ${p2}, 3 Zonen ${p3}, jede weitere ${p4}`,
  },
  en: {
    testBanner: "Test version. Please enter invented names only and no real treatment wishes. The booking really does go into the calendar.",
    noSlotHint: "No suitable time? Feel free to message us on WhatsApp.", noSlotLink: "on WhatsApp", otherTime: "Choose another time",
    mapL: "How to find us", saveQ: "Would you like to save the appointment to your calendar right away?",
    doneBindingH: "Booked! We look forward to seeing you.", doneBindingP: "All the details will reach you by email in a moment.",
    cancelP2: "You can reschedule or cancel the appointment up to 24 hours in advance via the link in your confirmation.",
    pendingT: "We are checking your booking.", pendingP: "Please do not book again, we will get in touch.",
    conflict: "Unfortunately this appointment can no longer be booked online. Please choose another time or message us on WhatsApp.",
    bookErr: "That didn’t work just now. Please try again or message us on WhatsApp.",
    bookUnavailable: "We can’t check availability right now, so nothing has been booked yet. Your details are still here. Please try again in a few minutes. Or send us a quick message on WhatsApp.",
    loading: "One moment, we’re checking the calendar.",
    noneFree: "Nothing is free online right now. Message us on WhatsApp and we’ll find you a time.",
    refL: "Booking number", durL: "Duration", minutes: (n) => `${n} minutes`,
    home: "Back to the start page", legalImprint: "Legal notice", legalPrivacy: "Privacy policy",
    zoneNames: { zornesfalte: "Frown lines", stirn: "Forehead", kraehenfuesse: "Crow’s feet", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Mouth corners", erdbeerkinn: "Dimpled chin", gummysmile: "Gummy Smile", oberlippe: "Upper lip lines", nase: "Nose slimming" },
    personsQ: "Who are you booking for?", persons1: "For me", persons2: "For the two of us", personsSum: "With someone", personsMore: "Would you like to book for three or more people? Feel free to message us on WhatsApp. We will schedule your appointments back to back.", personsWa: "Message us on WhatsApp", secondPerson: "Lovely, we’ll plan extra time. Your companion can decide on site, at their own pace.",
    reminderOpt: "Please remind me of my appointment on WhatsApp.",
    zoneOther: "Other", zoneUnknown: "Not decided yet", zonesOpen: "Areas not decided yet",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "area" : "areas"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 area ${p1}, 2 areas ${p2}, 3 areas ${p3}, each additional ${p4}`,
  },
  es: {
    testBanner: "Versión de prueba. Introduzca solo nombres inventados y ningún deseo de tratamiento real. La reserva se registra de verdad en el calendario.",
    noSlotHint: "¿Ninguna hora le viene bien? Escríbanos con gusto por WhatsApp.", noSlotLink: "por WhatsApp", otherTime: "Elegir otra hora",
    mapL: "Cómo llegar", saveQ: "¿Quiere guardar la cita en su calendario ahora mismo?",
    doneBindingH: "¡Reservado! Le esperamos.", doneBindingP: "Todos los detalles le llegan enseguida por correo electrónico.",
    cancelP2: "Puede cambiar o cancelar la cita hasta 24 horas antes a través del enlace de su confirmación.",
    pendingT: "Estamos comprobando su reserva.", pendingP: "Por favor, no vuelva a reservar. Nos pondremos en contacto con usted.",
    conflict: "Lamentablemente esta cita ya no se puede reservar en línea. Elija otra hora o escríbanos por WhatsApp.",
    bookErr: "Eso no ha funcionado. Inténtelo de nuevo o escríbanos por WhatsApp.",
    bookUnavailable: "En este momento no podemos comprobar la disponibilidad, por eso todavía no se ha reservado nada. Sus datos se mantienen. Inténtelo de nuevo en unos minutos. O escríbanos brevemente por WhatsApp.",
    loading: "Un momento, estamos mirando la agenda.",
    noneFree: "Ahora mismo no hay citas libres online. Escríbanos por WhatsApp y le encontramos una.",
    refL: "Número de reserva", durL: "Duración", minutes: (n) => `${n} minutos`,
    home: "Volver a la página de inicio", legalImprint: "Aviso legal", legalPrivacy: "Política de privacidad",
    zoneNames: { zornesfalte: "Entrecejo", stirn: "Frente", kraehenfuesse: "Patas de gallo", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Comisuras de la boca", erdbeerkinn: "Mentón en piel de naranja", gummysmile: "Sonrisa gingival", oberlippe: "Arrugas del labio superior", nase: "Afinar la nariz" },
    personsQ: "¿Para quién reserva?", persons1: "Para mí", persons2: "Para nosotros dos", personsSum: "Con alguien", personsMore: "¿Desea reservar para tres o más personas? Escríbanos con gusto por WhatsApp. Programamos sus citas una tras otra.", personsWa: "Escribir por WhatsApp", secondPerson: "Estupendo, reservamos más tiempo. Su acompañante decide con calma en el estudio.",
    reminderOpt: "Recuérdenme la cita por WhatsApp.",
    zoneOther: "Otra", zoneUnknown: "Aún por decidir", zonesOpen: "Zonas por decidir",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "zona" : "zonas"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 zona ${p1}, 2 zonas ${p2}, 3 zonas ${p3}, cada zona adicional ${p4}`,
  },
  fr: {
    testBanner: "Version de test. Merci de n’indiquer que des noms inventés et aucun souhait de soin réel. La réservation est réellement inscrite dans l’agenda.",
    noSlotHint: "Aucun créneau ne vous convient ? Écrivez-nous volontiers sur WhatsApp.", noSlotLink: "sur WhatsApp", otherTime: "Choisir un autre créneau",
    mapL: "Comment nous trouver", saveQ: "Souhaitez-vous enregistrer le rendez-vous tout de suite dans votre agenda ?",
    doneBindingH: "Réservé ! Nous avons hâte de vous accueillir.", doneBindingP: "Tous les détails vous parviennent dans un instant par e-mail.",
    cancelP2: "Vous pouvez déplacer ou annuler le rendez-vous jusqu’à 24 heures avant via le lien de votre confirmation.",
    pendingT: "Nous vérifions votre réservation.", pendingP: "Merci de ne pas réserver à nouveau, nous vous recontactons.",
    conflict: "Ce rendez-vous ne peut malheureusement plus être réservé en ligne. Choisissez un autre créneau ou écrivez-nous sur WhatsApp.",
    bookErr: "Cela n’a pas fonctionné. Réessayez ou écrivez-nous sur WhatsApp.",
    bookUnavailable: "Nous ne pouvons pas vérifier les disponibilités pour le moment, rien n’est donc encore réservé. Vos informations restent saisies. Merci de réessayer dans quelques minutes. Ou écrivez-nous un petit mot sur WhatsApp.",
    loading: "Un instant, nous consultons l’agenda.",
    noneFree: "Aucun créneau libre en ligne pour le moment. Écrivez-nous sur WhatsApp, nous vous trouvons un rendez-vous.",
    refL: "Numéro de réservation", durL: "Durée", minutes: (n) => `${n} minutes`,
    home: "Retour à la page d’accueil", legalImprint: "Mentions légales", legalPrivacy: "Politique de confidentialité",
    zoneNames: { zornesfalte: "Ride du lion", stirn: "Front", kraehenfuesse: "Pattes d’oie", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Coins de la bouche", erdbeerkinn: "Menton en peau d’orange", gummysmile: "Sourire gingival", oberlippe: "Ridules de la lèvre supérieure", nase: "Affinement du nez" },
    personsQ: "Pour qui réservez-vous ?", persons1: "Pour moi", persons2: "Pour nous deux", personsSum: "À deux", personsMore: "Vous souhaitez réserver pour trois personnes ou plus ? Écrivez-nous volontiers sur WhatsApp. Nous planifions vos rendez-vous les uns après les autres.", personsWa: "Écrire sur WhatsApp", secondPerson: "Avec plaisir, nous prévoyons plus de temps. La personne qui vous accompagne choisit tranquillement sur place.",
    reminderOpt: "Merci de me rappeler le rendez-vous par WhatsApp.",
    zoneOther: "Autre", zoneUnknown: "Pas encore décidé", zonesOpen: "Zones à définir",
    zoneCountLabel: (n) => `${n} ${n === 1 ? "zone" : "zones"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 zone ${p1}, 2 zones ${p2}, 3 zones ${p3}, chaque zone supplémentaire ${p4}`,
  },
  pt: {
    testBanner: "Versão de teste. Use apenas nomes inventados e nenhum desejo real de tratamento. A reserva é registrada de verdade no calendário.",
    noSlotHint: "Nenhum horário serve? Fale conosco pelo WhatsApp.", noSlotLink: "pelo WhatsApp", otherTime: "Escolher outro horário",
    mapL: "Como chegar", saveQ: "Quer salvar a consulta no seu calendário agora mesmo?",
    doneBindingH: "Marcado! Esperamos por você.", doneBindingP: "Todos os detalhes chegam já por e-mail.",
    cancelP2: "Você pode remarcar ou cancelar a consulta até 24 horas antes pelo link da sua confirmação.",
    pendingT: "Estamos verificando a sua reserva.", pendingP: "Por favor, não reserve de novo, nós entramos em contato.",
    conflict: "Infelizmente, esta consulta não pode mais ser marcada online. Escolha outro horário ou fale conosco pelo WhatsApp.",
    bookErr: "Não deu certo agora. Tente de novo ou mande uma mensagem no WhatsApp.",
    bookUnavailable: "No momento não conseguimos verificar a disponibilidade, por isso ainda nada foi agendado. Seus dados continuam aqui. Tente de novo em alguns minutos. Ou mande uma mensagem rápida pelo WhatsApp.",
    loading: "Um momento, estamos olhando a agenda.",
    noneFree: "No momento não há horários livres online. Mande uma mensagem no WhatsApp e encontramos um para você.",
    refL: "Número da reserva", durL: "Duração", minutes: (n) => `${n} minutos`,
    home: "Voltar à página inicial", legalImprint: "Informações legais", legalPrivacy: "Política de privacidade",
    zoneNames: { zornesfalte: "Entre as sobrancelhas", stirn: "Testa", kraehenfuesse: "Pés de galinha", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Cantos da boca", erdbeerkinn: "Queixo em casca de laranja", gummysmile: "Sorriso gengival", oberlippe: "Rugas do lábio superior", nase: "Afinamento do nariz" },
    personsQ: "Para quem você está agendando?", persons1: "Para mim", persons2: "Para nós dois", personsSum: "Em dupla", personsMore: "Quer agendar para três ou mais pessoas? Fale conosco pelo WhatsApp. Marcamos os seus horários em sequência.", personsWa: "Escrever pelo WhatsApp", secondPerson: "Que ótimo, reservamos mais tempo. Quem vem com você decide com calma no estúdio.",
    reminderOpt: "Quero receber um lembrete do horário pelo WhatsApp.",
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

