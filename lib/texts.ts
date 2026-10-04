/*
 * Texte der Buchung in fünf Sprachen. Block T wörtlich aus dem Entwurf Version 26 übernommen,
 * nichts umformuliert. Block X: Ergänzungen für die echte Seite (Testhinweis, Buchungsnummer,
 * unklarer Ausgang, Absage per WhatsApp), die im Entwurf nicht vorkommen.
 */
import type { ConsultLang, Lang } from "./i18n";
import type { ZoneId } from "./treatments";

export { LANGS, LANG_IDS, isLang } from "./i18n";

type Fn1 = (p: string) => string;

export interface DraftTexts {
  spec: string; otherPh: string; achsel: string; achselD: string;
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
  },
  uk:{
  spec:"Спеціалізація: корекція зморшок",
  otherPh:"Яка зона?",
  achsel:"Надмірне потовиділення", achselD:"Пахви (гіпергідроз)",
  interestL:"Мене цікавить:", noCommitTag:"Попередній вибір без зобов’язань", noCommit:"Можна обрати й кілька варіантів. Що саме ми робитимемо, обговоримо разом у студії.", yesBeen:"Так", noFirst:"Ні, це мій перший візит",
  stepTreat:"Процедура", stepSlot:"Час", stepData:"Дані", consultPrice:"", noteAdd:"Додати примітку",
  next1:"Далі: коли Вам зручно?", next2:"Далі: майже готово", back:"Назад", change:"Змінити", refThanks:"Дякуємо!", refSend:"Надіслати",
  visitQ:"Ви вже бували в нас?", visitFirstLbl:"Перший візит", visitReturnLbl:"Повторний візит", checkupLbl:"Контрольний огляд",
  treatQ:"Що Вас цікавить?", unsureT:"Спершу хочу консультацію", unsureD:"Ми не поспішаємо і разом вирішимо, що Вам підходить.", botGroup:"Ін’єкції ботоксу", moreGroup:"Інші процедури",
  kaumuskel:"Жувальний м’яз (масетер)", kaumuskelD:"Facial Slimming, розслаблення при скреготі зубами", nefertiti:"Ліфтинг Nefertiti", nefertitiD:"Шия та контур нижньої щелепи",
  lachs:"ДНК лосося", lachsD:"Темні кола під очима, одна процедура", lachsPack:"ДНК лосося, чотири процедури", lachsPackD:"Темні кола під очима, зона навколо очей",
  lachsRow:"ДНК лосося, одна процедура",
  noteL:"Примітка до процедури", optional:"(за бажанням)", notePh:"Наприклад: зазвичай дві зони, цього разу, можливо, ще й жувальний м’яз.",
  priceHint:"* Орієнтовні ціни. Розрахунок згідно з німецьким тарифом на лікарські послуги (Gebührenordnung für Ärzte). Ціни включають податок на додану вартість.",
  slotQ:"Коли Вам зручно?", slotQCheckup:"Коли Вам зручно прийти на контрольний огляд?",
  downT:"У нас зараз технічні труднощі.", downP:"Коротко напишіть нам у WhatsApp, і ми швидко знайдемо для Вас час.",
  copy:"Копіювати номер", copied:"Скопійовано", marked:"Виділено, тепер скопіюйте",
  nextFree:"Найближчий вільний час", orDay:"Або оберіть день самостійно", dayAria:"Обрати день", closed:"Цього дня ми не працюємо в студії.", closedAria:"зачинено",
  holiday:"День єдності Німеччини", fullT:"Цей день уже повністю заброньовано.", fullP:"Перегляньте, будь ласка, інший день.",
  at:t=>t,
  dataH:"Як з Вами зв’язатися?", vorname:"Ім’я", nachname:"Прізвище", handy:"Номер мобільного телефону", handyWhy:"", email:"Адреса електронної пошти", emailWhy:"",
  phoneReturn:"Бажано той самий номер, що й минулого разу, тоді ми одразу Вас упізнаємо.",
  refQ:"Вам хтось порекомендував PALO SKIN?", refPh:"Ім’я або код рекомендації",
  consent:"Я погоджуюся, що PALO SKIN обробляє мої дані для мого запису. Детальніше: Декларація про захист даних.", cancelT:"Час для Вас", cancelP:"Ваш прийом починається вчасно, як правило, зовсім без очікування. Будь ласка, приходьте у призначений час або щонайбільше за п’ять хвилин до нього.",
  sumHead:"Ваш запис", beratungRow:"Консультація, процедуру ще не обрано", botRow:"Ботокс: ", boostRow:"Skin Booster: ", doneH:"Чудово, Ваш запит на запис отримано. Ми коротко підтвердимо його у WhatsApp.", gcal:"Google Календар", ocal:"Outlook", ical:"Календар iPhone",
  addrL:"Адреса", book:"Записатися",
  checkupP:"Вас запрошено на короткий контрольний огляд.",
  eVisit:"Ще одне: Ви вже бували в нас?", eTreat:"Ще одне: оберіть, будь ласка, процедуру або «Спершу хочу консультацію».", eSlot:"Ще одне: оберіть, будь ласка, час.",
  eVorname:"Ще одне: не вказано Ваше ім’я.", eNachname:"Ще одне: не вказано Ваше прізвище.", eHandy:"Схоже, номер мобільного телефону неправильний. Будь ласка, перевірте його ще раз.",
  eEmail:"Ще одне: адреса електронної пошти ще не зовсім правильна.", eConsent:"Ще одне: без Вашої згоди ми, на жаль, не можемо створити запис.",
  },
  ar:{
  spec:"متخصصون في علاج التجاعيد",
  otherPh:"أي منطقة؟",
  achsel:"التعرق المفرط", achselD:"منطقة الإبطين (فرط التعرق)",
  interestL:"مجالات الاهتمام:", noCommitTag:"اختيار مبدئي غير ملزم", noCommit:"يمكن اختيار أكثر من خيار. نقرر معًا في المركز ما سنقوم به.", yesBeen:"نعم", noFirst:"لا، هذه زيارتي الأولى",
  stepTreat:"العلاج", stepSlot:"الموعد", stepData:"البيانات", consultPrice:"", noteAdd:"إضافة ملاحظة",
  next1:"التالي: ما الوقت المناسب لكم؟", next2:"التالي: أوشكنا على الانتهاء", back:"رجوع", change:"تغيير", refThanks:"شكرًا!", refSend:"إرسال",
  visitQ:"هل سبق لكم زيارتنا؟", visitFirstLbl:"الزيارة الأولى", visitReturnLbl:"زيارة سابقة", checkupLbl:"موعد متابعة",
  treatQ:"ما العلاج الذي يهمكم؟", unsureT:"أرغب في الاستشارة أولًا", unsureD:"نأخذ وقتنا ونقرر معًا ما يناسبكم.", botGroup:"علاج البوتوكس", moreGroup:"علاجات أخرى",
  kaumuskel:"عضلة المضغ (الماضغة)", kaumuskelD:"تنحيف الوجه، والتخفيف من صرير الأسنان", nefertiti:"شد نفرتيتي", nefertitiD:"الرقبة وخط الفك",
  lachs:"الحمض النووي للسلمون", lachsD:"الهالات السوداء، جلسة واحدة", lachsPack:"الحمض النووي للسلمون، أربع جلسات", lachsPackD:"الهالات السوداء، منطقة حول العينين",
  lachsRow:"الحمض النووي للسلمون، جلسة واحدة",
  noteL:"ملاحظة حول العلاج", optional:"(اختياري)", notePh:"مثلًا: عادةً منطقتان، وربما هذه المرة عضلة المضغ أيضًا.",
  priceHint:"* أسعار استرشادية. تتم المحاسبة وفق لائحة أتعاب الأطباء الألمانية (GOÄ). الأسعار شاملة ضريبة القيمة المضافة.",
  slotQ:"ما الوقت المناسب لكم؟", slotQCheckup:"ما الوقت المناسب لكم لموعد المتابعة؟",
  downT:"هناك خلل مؤقت لدينا.", downP:"يرجى مراسلتنا سريعًا عبر WhatsApp، وسنجد لكم موعدًا في أقرب وقت.",
  copy:"نسخ الرقم", copied:"تم النسخ", marked:"تم التحديد، يمكن النسخ الآن",
  nextFree:"أقرب موعد متاح", orDay:"أو اختيار يوم آخر بأنفسكم", dayAria:"اختيار اليوم", closed:"لا نكون في المركز في هذا اليوم.", closedAria:"مغلق",
  holiday:"يوم الوحدة الألمانية", fullT:"هذا اليوم محجوز بالكامل.", fullP:"يمكنكم الاطلاع على يوم آخر.",
  at:t=>"الساعة "+t,
  dataH:"كيف يمكننا التواصل معكم؟", vorname:"الاسم الأول", nachname:"اسم العائلة", handy:"رقم الجوال", handyWhy:"", email:"البريد الإلكتروني", emailWhy:"",
  phoneReturn:"يفضَّل استخدام الرقم نفسه كالمرة السابقة، ليسهل علينا التعرف عليكم مباشرة.",
  refQ:"هل أوصاكم أحد بـ PALO SKIN؟", refPh:"الاسم أو رمز التوصية",
  consent:"أوافق على أن تعالج PALO SKIN بياناتي من أجل موعدي. المزيد في بيان حماية البيانات.", cancelT:"وقت لكم وحدكم", cancelP:"يبدأ موعدكم في وقته، وعادةً دون أي انتظار. يرجى الحضور في الموعد المتفق عليه أو قبله بخمس دقائق كحد أقصى.",
  sumHead:"موعدكم", beratungRow:"استشارة، والعلاج لم يُحدد بعد", botRow:"بوتوكس: ", boostRow:"سكين بوستر: ", doneH:"رائع، وصل طلب موعدكم. سنؤكده لكم قريبًا عبر WhatsApp.", gcal:"تقويم Google", ocal:"Outlook", ical:"تقويم iPhone",
  addrL:"العنوان", book:"حجز موعد",
  checkupP:"تمت دعوتكم إلى موعد متابعة قصير.",
  eVisit:"ملاحظة صغيرة: هل سبق لكم زيارتنا؟", eTreat:"ملاحظة صغيرة: يرجى اختيار علاج أو «أرغب في الاستشارة أولًا».", eSlot:"ملاحظة صغيرة: يرجى اختيار الوقت.",
  eVorname:"ملاحظة صغيرة: الاسم الأول غير مذكور.", eNachname:"ملاحظة صغيرة: اسم العائلة غير مذكور.", eHandy:"يبدو أن رقم الجوال غير صحيح. يرجى التحقق منه مرة أخرى.",
  eEmail:"ملاحظة صغيرة: عنوان البريد الإلكتروني غير صحيح تمامًا بعد.", eConsent:"ملاحظة صغيرة: للأسف لا يمكننا تسجيل الموعد دون موافقتكم.",
  },

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
  /* Beratungssprache (Entscheidung Dr. Vogel, 4. Oktober 2026): erste Frage in Schritt 1, Pflichtfeld */
  consultQ: string;
  /** klein unter der Frage, nur wenn die Seitensprache keine Beratungssprache ist (Ukrainisch, Arabisch) */
  consultHint: string;
  eConsult: string;
  /** Zeile in der Zusammenfassung (Schritt 3), Name der Sprache aus consultNames */
  consultSum: (name: string) => string;
  /** Namen der fünf Beratungssprachen in der Seitensprache */
  consultNames: Record<ConsultLang, string>;
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
    consultQ: "In welcher Sprache möchten Sie beraten werden?", consultHint: "Dr. Vogel berät Sie auf Deutsch, Englisch, Spanisch, Französisch oder Portugiesisch.", eConsult: "Kurz noch: Bitte wählen Sie die Sprache für Ihre Beratung.",
    consultSum: (name) => `Beratung auf ${name}`, consultNames: { de: "Deutsch", en: "Englisch", es: "Spanisch", fr: "Französisch", pt: "Portugiesisch" },
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
    consultQ: "In which language would you like your consultation?", consultHint: "Dr. Vogel advises you in German, English, Spanish, French or Portuguese.", eConsult: "Just one thing: Please choose the language for your consultation.",
    consultSum: (name) => `Consultation in ${name}`, consultNames: { de: "German", en: "English", es: "Spanish", fr: "French", pt: "Portuguese" },
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
    consultQ: "¿En qué idioma desea que le asesoremos?", consultHint: "El Dr. Vogel le asesora en alemán, inglés, español, francés o portugués.", eConsult: "Un detalle: Elija el idioma de su consulta.",
    consultSum: (name) => `Consulta en ${name}`, consultNames: { de: "alemán", en: "inglés", es: "español", fr: "francés", pt: "portugués" },
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
    consultQ: "Dans quelle langue souhaitez-vous être conseillé ?", consultHint: "Le Dr Vogel vous conseille en allemand, anglais, espagnol, français ou portugais.", eConsult: "Juste une chose : Choisissez la langue de votre consultation.",
    consultSum: (name) => `Consultation en ${name}`, consultNames: { de: "allemand", en: "anglais", es: "espagnol", fr: "français", pt: "portugais" },
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
    consultQ: "Em qual idioma você gostaria de ser atendido?", consultHint: "O Dr. Vogel atende em alemão, inglês, espanhol, francês ou português.", eConsult: "Só mais uma coisa: Escolha o idioma da sua consulta.",
    consultSum: (name) => `Consulta em ${name}`, consultNames: { de: "alemão", en: "inglês", es: "espanhol", fr: "francês", pt: "português" },
  },
  uk: {
    testBanner: "Тестова версія. Будь ласка, вводьте лише вигадані імена і жодних справжніх побажань щодо процедур. Запис справді потрапляє до календаря.",
    noSlotHint: "Немає відповідного часу? Напишіть нам у WhatsApp.", noSlotLink: "у WhatsApp", otherTime: "Обрати інший час",
    mapL: "Як нас знайти", saveQ: "Бажаєте одразу зберегти запис у календарі?",
    doneBindingH: "Заброньовано! Чекаємо на Вас.", doneBindingP: "Усі деталі невдовзі надійдуть на Вашу електронну пошту.",
    cancelP2: "Перенести або скасувати запис можна не пізніше ніж за 24 години за посиланням у Вашому підтвердженні запису.",
    pendingT: "Ми перевіряємо Ваше бронювання.", pendingP: "Будь ласка, не бронюйте повторно, ми з Вами зв’яжемося.",
    conflict: "На жаль, цей час більше недоступний для онлайн-запису. Будь ласка, оберіть інший час або напишіть нам у WhatsApp.",
    bookErr: "Щось пішло не так. Будь ласка, спробуйте ще раз або напишіть нам у WhatsApp.",
    bookUnavailable: "Зараз ми не можемо перевірити вільний час, тому ще нічого не заброньовано. Ваші дані збережено. Будь ласка, спробуйте ще раз за кілька хвилин. Або коротко напишіть нам у WhatsApp.",
    loading: "Хвилинку, дивимося в календар.",
    noneFree: "Зараз онлайн немає вільного часу. Напишіть нам у WhatsApp, і ми знайдемо для Вас час.",
    refL: "Номер бронювання", durL: "Тривалість", minutes: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "хвилина" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "хвилини" : "хвилин"}`,
    home: "На головну сторінку", legalImprint: "Вихідні дані", legalPrivacy: "Декларація про захист даних",
    zoneNames: { zornesfalte: "Міжбрівна зморшка", stirn: "Чоло", kraehenfuesse: "«Гусячі лапки»", browlift: "Brow Lift", lipflip: "Lip Flip", bunnylines: "Bunny Lines", mundwinkel: "Куточки рота", erdbeerkinn: "Підборіддя «апельсинова кірка»", gummysmile: "Gummy Smile", oberlippe: "Зморшки над верхньою губою", nase: "Звуження носа" },
    personsQ: "Для кого Ви записуєтеся?", persons1: "Для себе", persons2: "Для нас двох", personsSum: "Удвох", personsMore: "Бажаєте записати трьох або більше людей? Напишіть нам у WhatsApp. Ми заплануємо Ваші прийоми один за одним.", personsWa: "Написати у WhatsApp", secondPerson: "Чудово, ми заплануємо більше часу. Особа, яка Вас супроводжує, спокійно вирішить у студії, чого бажає.",
    reminderOpt: "Нагадайте мені, будь ласка, про запис у WhatsApp.",
    zoneOther: "Інше", zoneUnknown: "Ще не знаю", zonesOpen: "Зони ще не визначено",
    zoneCountLabel: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "зона" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "зони" : "зон"}`,
    zoneTiers: (p1, p2, p3, p4) => `1 зона ${p1}, 2 зони ${p2}, 3 зони ${p3}, кожна наступна ${p4}`,
    consultQ: "Якою мовою Ви бажаєте отримати консультацію?", consultHint: "Dr. Vogel консультує німецькою, англійською, іспанською, французькою або португальською мовою.", eConsult: "Ще одне: будь ласка, оберіть мову консультації.",
    consultSum: (name) => `Мова консультації: ${name}`, consultNames: { de: "німецька", en: "англійська", es: "іспанська", fr: "французька", pt: "португальська" },
  },
  ar: {
    testBanner: "نسخة تجريبية. يرجى إدخال أسماء وهمية فقط، ودون رغبات علاجية حقيقية. الحجز يُسجَّل فعلًا في التقويم.",
    noSlotHint: "لا يوجد موعد مناسب؟ يسعدنا تواصلكم معنا عبر WhatsApp.", noSlotLink: "عبر WhatsApp", otherTime: "اختيار وقت آخر",
    mapL: "الطريق إلينا", saveQ: "هل ترغبون في حفظ الموعد في التقويم الآن؟",
    doneBindingH: "تم الحجز! نتطلع إلى لقائكم.", doneBindingP: "ستصلكم جميع التفاصيل بالبريد الإلكتروني بعد قليل.",
    cancelP2: "يمكن تغيير الموعد أو إلغاؤه حتى 24 ساعة قبله عبر الرابط الموجود في تأكيد الموعد.",
    pendingT: "نتحقق من حجزكم.", pendingP: "يرجى عدم الحجز مرة أخرى، سنتواصل معكم.",
    conflict: "للأسف لم يعد هذا الموعد متاحًا للحجز عبر الإنترنت. يرجى اختيار وقت آخر أو مراسلتنا عبر WhatsApp.",
    bookErr: "لم تنجح العملية للتو. يرجى المحاولة مرة أخرى أو مراسلتنا عبر WhatsApp.",
    bookUnavailable: "لا يمكننا التحقق من الأوقات المتاحة حاليًا، لذلك لم يتم حجز أي شيء بعد. بياناتكم محفوظة. يرجى المحاولة مرة أخرى بعد بضع دقائق، أو مراسلتنا باختصار عبر WhatsApp.",
    loading: "لحظة من فضلكم، نتحقق من التقويم.",
    noneFree: "لا توجد مواعيد متاحة عبر الإنترنت حاليًا. يرجى مراسلتنا عبر WhatsApp، وسنجد لكم موعدًا.",
    refL: "رقم الحجز", durL: "المدة", minutes: (n) => n === 1 ? "دقيقة واحدة" : n === 2 ? "دقيقتان" : n % 100 >= 3 && n % 100 <= 10 ? `${n} دقائق` : `${n} دقيقة`,
    home: "إلى الصفحة الرئيسية", legalImprint: "الإشعار القانوني", legalPrivacy: "بيان حماية البيانات",
    zoneNames: { zornesfalte: "خطوط ما بين الحاجبين", stirn: "الجبهة", kraehenfuesse: "تجاعيد زوايا العينين", browlift: "رفع الحاجبين", lipflip: "ليب فليب", bunnylines: "تجاعيد جانبي الأنف", mundwinkel: "زوايا الفم", erdbeerkinn: "تجعّد الذقن", gummysmile: "الابتسامة اللثوية", oberlippe: "تجاعيد الشفة العليا", nase: "تنحيف الأنف" },
    personsQ: "لمن الحجز؟", persons1: "لنفسي", persons2: "لشخصين معًا", personsSum: "لشخصين", personsMore: "هل ترغبون في الحجز لثلاثة أشخاص أو أكثر؟ يسعدنا تواصلكم معنا عبر WhatsApp. سنرتب مواعيدكم متتالية.", personsWa: "المراسلة عبر WhatsApp", secondPerson: "رائع، سنرتب وقتًا أطول. ويمكن للشخص المرافق أن يقرر بهدوء في المركز ما يرغب فيه.",
    reminderOpt: "أرجو تذكيري بالموعد عبر WhatsApp.",
    zoneOther: "أخرى", zoneUnknown: "لم أحدد بعد", zonesOpen: "المناطق لم تُحدد بعد",
    zoneCountLabel: (n) => n === 1 ? "منطقة واحدة" : n === 2 ? "منطقتان" : n % 100 >= 3 && n % 100 <= 10 ? `${n} مناطق` : `${n} منطقة`,
    zoneTiers: (p1, p2, p3, p4) => `منطقة واحدة ${p1}، منطقتان ${p2}، 3 مناطق ${p3}، كل منطقة إضافية ${p4}`,
    consultQ: "بأي لغة ترغبون في تلقي الاستشارة؟", consultHint: "يقدّم Dr. Vogel الاستشارة باللغة الألمانية أو الإنجليزية أو الإسبانية أو الفرنسية أو البرتغالية.", eConsult: "ملاحظة صغيرة: يرجى اختيار لغة الاستشارة.",
    consultSum: (name) => `الاستشارة باللغة ${name}`, consultNames: { de: "الألمانية", en: "الإنجليزية", es: "الإسبانية", fr: "الفرنسية", pt: "البرتغالية" },
  },

};

export type Texts = DraftTexts & ExtraTexts;

export const TEXTS: Record<Lang, Texts> = {
  de: { ...T.de, ...X.de },
  en: { ...T.en, ...X.en },
  es: { ...T.es, ...X.es },
  fr: { ...T.fr, ...X.fr },
  pt: { ...T.pt, ...X.pt },
  uk: { ...T.uk, ...X.uk },
  ar: { ...T.ar, ...X.ar },
};

/* Französisch: geschütztes Leerzeichen vor ? ! : ; und in « » */
{
  const fr = TEXTS.fr as unknown as Record<string, unknown>;
  for (const k of Object.keys(fr)) {
    const v = fr[k];
    if (typeof v === "string") fr[k] = v.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
  }
}

