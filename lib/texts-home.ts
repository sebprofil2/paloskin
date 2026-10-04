/*
 * Texte der Startseite. Deutsch ist die Vorlage (Freigabe Dr. Vogel, 3. Oktober 2026), die anderen Sprachen sind daraus übersetzt.
 * Früher in public/assets/home-text.js; seit 4. Oktober 2026 hier, im selben System wie Buchung, Mails und Vorschautexte.
 * title und metaDesc sind Titel und Beschreibung der Startseite (auch für die Vorschau beim Teilen, lib/share-meta.ts).
 */
import type { Lang } from "./i18n";

export interface HomeTexts {
  title: string;
  metaDesc: string;
  navPrices: string;
  navHow: string;
  navStudio: string;
  navFaq: string;
  book: string;
  bookNow: string;
  whatsapp: string;
  h1: string;
  lead: string;
  fAddress: string;
  fDoctor: string;
  fLang: string;
  langs: string;
  fHours: string;
  hours: string;
  pricesH: string;
  pricesP: string;
  botH: string;
  z1: string;
  z2: string;
  z3: string;
  zx: string;
  zoneLink: string;
  kauH: string;
  kauR: string;
  nefH: string;
  nefR: string;
  achselH: string;
  achselR: string;
  boostH: string;
  lachs: string;
  lachsS: string;
  lachs4: string;
  lachs4S: string;
  pLachs4: string;
  pnote: string;
  howH: string;
  s1H: string;
  s1P: string;
  s2H: string;
  s2P: string;
  s3H: string;
  s3P: string;
  studioH: string;
  quote1: string;
  quote3: string;
  studioLangs: string;
  studioAddr: string;
  mapL: string;
  faqH: string;
  q1: string;
  a1: string;
  q2: string;
  a2: string;
  q3: string;
  a3: string;
  q4: string;
  a4: string;
  imprint: string;
  privacy: string;
}

export const HOME_TEXTS: Record<Lang, HomeTexts> = {
  de: {
  title:"PALO SKIN by Dr. Vogel | Ärztliche Faltenbehandlung in Berlin",
  metaDesc:"PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg: ärztliche Faltenbehandlung durch Dr. med. Sebastian Vogel. Termine online buchen, auch kurzfristig.",
  navPrices:"Behandlungen und Preise", navHow:"Ablauf", navStudio:"Studio", navFaq:"Fragen",
  book:"Termin buchen", bookNow:"Termin online buchen", whatsapp:"Eine Frage? Schreiben Sie uns",
  h1:"Goodbye wrinkles.",
  lead:"Botulinum und Skin Booster in Berlin Prenzlauer Berg. Unser Ziel: Sie sehen erholt aus, nicht verändert. Persönlich beraten und behandelt von Dr. med. Sebastian Vogel.",
  fAddress:"Adresse", fDoctor:"Ihr Arzt", fLang:"Beratung auf", langs:"Deutsch, Englisch, Spanisch, Französisch, Portugiesisch", fHours:"Termine", hours:"Online buchbar, auch kurzfristig",
  pricesH:"Behandlungen und Preise",
  pricesP:"Ob Stirn, Zornesfalte oder Krähenfüße: Welche Bereiche für Sie sinnvoll sind, besprechen wir gemeinsam vor Ort.",
  botH:"Botulinum-Behandlung",
  z1:"1 Zone", z2:"2 Zonen", z3:"3 Zonen", zx:"Jede weitere Zone", zoneLink:"Was zählt als Zone?",
  kauH:"Kaumuskel (Masseter)", kauR:"Facial Slimming, Entspannung bei Zähneknirschen",
  nefH:"Nefertiti-Lift", nefR:"Hals und Kieferkontur",
  achselH:"Übermäßiges Schwitzen (Hyperhidrose)", achselR:"Achseln",
  boostH:"Skin Booster",
  lachs:"Lachs-DNA, eine Behandlung", lachsS:"Dunkle Augenringe, Augenpartie", lachs4:"Lachs-DNA, vier Behandlungen", lachs4S:"Dunkle Augenringe, Augenpartie", pLachs4:"1.000 €*",
  pnote:"* Richtwerte. Abrechnung nach der Gebührenordnung für Ärzte. Preise inklusive Mehrwertsteuer.",
  howH:"Ihr Termin bei PALO SKIN",
  s1H:"Finden Sie Ihre Zeit.", s1P:"Wählen Sie Ihren Termin online, die Bestätigung kommt sofort per E-Mail. Ihr Termin beginnt pünktlich, in der Regel ganz ohne Wartezeit.",
  s2H:"Erst sprechen wir über Ihre Wünsche.", s2P:"Was möchten Sie verändern? Welche Fragen haben Sie? Gemeinsam besprechen wir Möglichkeiten, Grenzen und Kosten.",
  s3H:"Dann entscheiden Sie.", s3P:"Wenn die Behandlung für Sie geeignet ist und Sie sich dafür entscheiden, behandelt Dr. Vogel Sie persönlich.",
  studioH:"Ein Studio. Ihr Arzt.",
  quote1:"„Ich bin Sebastian Vogel. Bei PALO SKIN berate und behandle ich Sie persönlich. Wir besprechen, was Sie sich wünschen, was medizinisch sinnvoll ist und wo die Grenzen liegen.",
  quote3:"Ihre Zeit ist mir genauso wichtig wie meine: Ihr Termin beginnt pünktlich, in der Regel ganz ohne Wartezeit.“",
  studioLangs:"Ich spreche Deutsch, Englisch, Spanisch, Französisch und Portugiesisch. Wählen Sie die Sprache, in der Sie sich wohlfühlen.",
  studioAddr:"Hagenauer Straße 14, 10435 Berlin, Prenzlauer Berg", mapL:"So finden Sie uns",
  faqH:"Häufige Fragen",
  q1:"Was ist eine Zone?", a1:"Ein Behandlungsbereich, zum Beispiel Zornesfalte, Stirn oder Krähenfüße (beide Seiten zusammen). Weitere Zonen: Lip Flip, Brow Lift, Mundwinkel, Erdbeerkinn, Gummy Smile, Oberlippenfältchen, Bunny Lines, Nasenverschmälerung. Welche Zonen für Sie am besten passen, besprechen wir gemeinsam vor Ort.",
  q2:"Wann kann ich wieder zur Arbeit?", a2:"Direkt danach. Kleine Rötungen verschwinden meist innerhalb von 30 Minuten.",
  q3:"Wann wirkt die Botulinum-Behandlung?", a3:"Die Wirkung beginnt nach zwei bis drei Tagen und ist nach zehn bis 14 Tagen vollständig. Sie hält in der Regel drei bis sechs Monate.",
  q4:"Ist die Behandlung für mich geeignet?", a4:"Das klären wir im Gespräch vor der Behandlung. Nicht behandeln wir bei Schwangerschaft und Stillzeit, bestimmten Muskelerkrankungen, akuten Infekten im Behandlungsbereich und bekannten Unverträglichkeiten.",
  imprint:"Impressum", privacy:"Datenschutz"
},
  en: {
  title:"PALO SKIN by Dr. Vogel | Physician-led wrinkle treatment in Berlin",
  metaDesc:"PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg: physician-led wrinkle treatment by Dr. med. Sebastian Vogel. Book appointments online, also at short notice.",
  navPrices:"Treatments and prices", navHow:"How it works", navStudio:"Studio", navFaq:"Questions",
  book:"Book appointment", bookNow:"Book online", whatsapp:"A question? Write to us",
  h1:"Goodbye wrinkles.",
  lead:"Botulinum and skin boosters in Berlin Prenzlauer Berg. Our aim: you look rested, not different. Personal advice and treatment by Dr. med. Sebastian Vogel.",
  fAddress:"Address", fDoctor:"Your physician", fLang:"Consultation in", langs:"German, English, Spanish, French, Portuguese", fHours:"Appointments", hours:"Bookable online, also at short notice",
  pricesH:"Treatments and prices",
  pricesP:"Forehead, frown lines or crow’s feet: which areas make sense for you is something we discuss together in the studio.",
  botH:"Botulinum treatment",
  z1:"1 zone", z2:"2 zones", z3:"3 zones", zx:"Each additional zone", zoneLink:"What counts as a zone?",
  kauH:"Jaw muscle (masseter)", kauR:"Facial slimming, relief from teeth grinding",
  nefH:"Nefertiti lift", nefR:"Neck and jawline",
  achselH:"Excessive sweating (hyperhidrosis)", achselR:"Underarms",
  boostH:"Skin booster",
  lachs:"Salmon DNA, one treatment", lachsS:"Dark circles, eye area", lachs4:"Salmon DNA, four treatments", lachs4S:"Dark circles, eye area", pLachs4:"1,000 €*",
  pnote:"* Guide prices. Billed according to the German fee schedule for physicians (Gebührenordnung für Ärzte). Prices include value added tax.",
  howH:"Your appointment at PALO SKIN",
  s1H:"Find your time.", s1P:"Choose your appointment online, the confirmation arrives immediately by email. Your appointment starts on time, usually with no waiting at all.",
  s2H:"First we talk about what you want.", s2P:"What would you like to change? What questions do you have? Together we discuss the options, the limits and the costs.",
  s3H:"Then you decide.", s3P:"If the treatment is suitable for you and you decide to go ahead, Dr. Vogel treats you personally.",
  studioH:"One studio. Your physician.",
  quote1:"“I am Sebastian Vogel. At PALO SKIN I advise and treat you personally. We talk about what you wish for, what makes sense medically and where the limits are.",
  quote3:"Your time matters to me as much as mine: your appointment starts on time, usually with no waiting at all.”",
  studioLangs:"I speak German, English, Spanish, French and Portuguese. Choose the language you feel most comfortable in.",
  studioAddr:"Hagenauer Straße 14, 10435 Berlin, Prenzlauer Berg", mapL:"How to find us",
  faqH:"Frequently asked questions",
  q1:"What is a zone?", a1:"A treatment area, for example the frown lines, forehead or crow’s feet (both sides together). Further zones: lip flip, brow lift, mouth corners, dimpled chin, gummy smile, upper lip lines, bunny lines, nose slimming. Which zones suit you best, we decide together in the studio.",
  q2:"When can I go back to work?", a2:"Right afterwards. Small red marks usually disappear within 30 minutes.",
  q3:"When does the botulinum treatment take effect?", a3:"The effect begins after two to three days and is complete after ten to 14 days. It usually lasts three to six months.",
  q4:"Is the treatment suitable for me?", a4:"We clarify that in the consultation before the treatment. We do not treat during pregnancy and breastfeeding, with certain muscle disorders, with acute infections in the treatment area or with known intolerances.",
  imprint:"Legal notice", privacy:"Privacy"
},
  es: {
  title:"PALO SKIN by Dr. Vogel | Tratamiento médico de arrugas en Berlín",
  metaDesc:"PALO SKIN by Dr. Vogel en Berlín Prenzlauer Berg: tratamiento médico de arrugas por el Dr. med. Sebastian Vogel. Reserve su cita en línea, también con poca antelación.",
  navPrices:"Tratamientos y precios", navHow:"Cómo funciona", navStudio:"Estudio", navFaq:"Preguntas",
  book:"Reservar cita", bookNow:"Reservar cita en línea", whatsapp:"¿Alguna pregunta? Escríbanos",
  h1:"Goodbye wrinkles.",
  lead:"Toxina botulínica y skin boosters en Berlín Prenzlauer Berg. Nuestro objetivo: que se vea descansado, no distinto. Le asesora y le trata personalmente el Dr. med. Sebastian Vogel.",
  fAddress:"Dirección", fDoctor:"Su médico", fLang:"Consulta en", langs:"Alemán, inglés, español, francés, portugués", fHours:"Citas", hours:"Reserva en línea, también con poca antelación",
  pricesH:"Tratamientos y precios",
  pricesP:"Frente, entrecejo o patas de gallo: qué zonas tienen sentido en su caso lo decidimos juntos en el estudio.",
  botH:"Tratamiento con toxina botulínica",
  z1:"1 zona", z2:"2 zonas", z3:"3 zonas", zx:"Cada zona adicional", zoneLink:"¿Qué cuenta como zona?",
  kauH:"Masetero (músculo de la mandíbula)", kauR:"Facial slimming, alivio del bruxismo",
  nefH:"Lifting Nefertiti", nefR:"Cuello y contorno mandibular",
  achselH:"Sudoración excesiva (hiperhidrosis)", achselR:"Axilas",
  boostH:"Skin booster",
  lachs:"ADN de salmón, un tratamiento", lachsS:"Ojeras, contorno de ojos", lachs4:"ADN de salmón, cuatro tratamientos", lachs4S:"Ojeras, contorno de ojos", pLachs4:"1.000 €*",
  pnote:"* Precios orientativos. Facturación según el baremo alemán de honorarios médicos (Gebührenordnung für Ärzte). Precios con el impuesto sobre el valor añadido incluido.",
  howH:"Su cita en PALO SKIN",
  s1H:"Encuentre su hora.", s1P:"Elija su cita en línea, la confirmación llega al instante por correo electrónico. Su cita empieza puntual, por lo general sin ninguna espera.",
  s2H:"Primero hablamos de lo que desea.", s2P:"¿Qué le gustaría cambiar? ¿Qué preguntas tiene? Juntos hablamos de las posibilidades, los límites y los costes.",
  s3H:"Después decide usted.", s3P:"Si el tratamiento es adecuado para usted y se decide, el Dr. Vogel le trata personalmente.",
  studioH:"Un estudio. Su médico.",
  quote1:"«Soy Sebastian Vogel. En PALO SKIN le asesoro y le trato personalmente. Hablamos de lo que usted desea, de lo que tiene sentido desde el punto de vista médico y de dónde están los límites.",
  quote3:"Su tiempo me importa tanto como el mío: su cita empieza puntual, por lo general sin ninguna espera.»",
  studioLangs:"Hablo alemán, inglés, español, francés y portugués. Elija el idioma en el que se sienta más cómodo.",
  studioAddr:"Hagenauer Straße 14, 10435 Berlín, Prenzlauer Berg", mapL:"Cómo llegar",
  faqH:"Preguntas frecuentes",
  q1:"¿Qué es una zona?", a1:"Una zona de tratamiento, por ejemplo el entrecejo, la frente o las patas de gallo (ambos lados juntos). Otras zonas: lip flip, brow lift, comisuras, mentón con hoyuelos, sonrisa gingival, arrugas del labio superior, bunny lines, afinado de la nariz. Qué zonas le convienen más lo decidimos juntos en el estudio.",
  q2:"¿Cuándo puedo volver al trabajo?", a2:"Inmediatamente después. Las pequeñas rojeces suelen desaparecer en 30 minutos.",
  q3:"¿Cuándo hace efecto el tratamiento con toxina botulínica?", a3:"El efecto comienza a los dos o tres días y es completo a los diez a 14 días. Suele durar de tres a seis meses.",
  q4:"¿Es el tratamiento adecuado para mí?", a4:"Lo aclaramos en la conversación previa al tratamiento. No tratamos durante el embarazo y la lactancia, en ciertas enfermedades musculares, con infecciones agudas en la zona de tratamiento ni con intolerancias conocidas.",
  imprint:"Aviso legal", privacy:"Privacidad"
},
  fr: {
  title:"PALO SKIN by Dr. Vogel | Traitement médical des rides à Berlin",
  metaDesc:"PALO SKIN by Dr. Vogel à Berlin Prenzlauer Berg : traitement médical des rides par le Dr med. Sebastian Vogel. Réservez en ligne, même à court terme.",
  navPrices:"Soins et tarifs", navHow:"Déroulement", navStudio:"Studio", navFaq:"Questions",
  book:"Prendre rendez-vous", bookNow:"Réserver en ligne", whatsapp:"Une question ? Écrivez-nous",
  h1:"Goodbye wrinkles.",
  lead:"Toxine botulique et skin boosters à Berlin Prenzlauer Berg. Notre objectif : que vous ayez l’air reposé, pas changé. Conseils et soins personnels par le Dr med. Sebastian Vogel.",
  fAddress:"Adresse", fDoctor:"Votre médecin", fLang:"Consultation en", langs:"Allemand, anglais, espagnol, français, portugais", fHours:"Rendez-vous", hours:"Réservation en ligne, même à court terme",
  pricesH:"Soins et tarifs",
  pricesP:"Front, ride du lion ou pattes d’oie : nous déterminons ensemble sur place les zones qui ont du sens pour vous.",
  botH:"Traitement à la toxine botulique",
  z1:"1 zone", z2:"2 zones", z3:"3 zones", zx:"Chaque zone supplémentaire", zoneLink:"Qu’est-ce qui compte comme zone ?",
  kauH:"Masséter (muscle de la mâchoire)", kauR:"Facial slimming, détente en cas de bruxisme",
  nefH:"Lifting Néfertiti", nefR:"Cou et contour de la mâchoire",
  achselH:"Transpiration excessive (hyperhidrose)", achselR:"Aisselles",
  boostH:"Skin booster",
  lachs:"ADN de saumon, une séance", lachsS:"Cernes, contour des yeux", lachs4:"ADN de saumon, quatre séances", lachs4S:"Cernes, contour des yeux", pLachs4:"1 000 €*",
  pnote:"* Prix indicatifs. Facturation selon le barème allemand des honoraires médicaux (Gebührenordnung für Ärzte). Prix taxe sur la valeur ajoutée comprise.",
  howH:"Votre rendez-vous chez PALO SKIN",
  s1H:"Trouvez votre créneau.", s1P:"Choisissez votre rendez-vous en ligne, la confirmation arrive aussitôt par e-mail. Votre rendez-vous commence à l’heure, en général sans aucune attente.",
  s2H:"D’abord, nous parlons de vos souhaits.", s2P:"Que souhaitez-vous changer ? Quelles questions avez-vous ? Ensemble, nous parlons des possibilités, des limites et des coûts.",
  s3H:"Ensuite, vous décidez.", s3P:"Si le soin vous convient et que vous le souhaitez, le Dr Vogel vous soigne personnellement.",
  studioH:"Un studio. Votre médecin.",
  quote1:"« Je suis Sebastian Vogel. Chez PALO SKIN, je vous conseille et vous soigne personnellement. Nous parlons de ce que vous souhaitez, de ce qui est médicalement pertinent et des limites.",
  quote3:"Votre temps compte pour moi autant que le mien : votre rendez-vous commence à l’heure, en général sans aucune attente. »",
  studioLangs:"Je parle allemand, anglais, espagnol, français et portugais. Choisissez la langue dans laquelle vous vous sentez à l’aise.",
  studioAddr:"Hagenauer Straße 14, 10435 Berlin, Prenzlauer Berg", mapL:"Comment nous trouver",
  faqH:"Questions fréquentes",
  q1:"Qu’est-ce qu’une zone ?", a1:"Une zone de traitement, par exemple la ride du lion, le front ou les pattes d’oie (les deux côtés ensemble). Autres zones : lip flip, brow lift, coins de la bouche, menton capitonné, sourire gingival, ridules de la lèvre supérieure, bunny lines, affinement du nez. Nous choisissons ensemble sur place les zones qui vous conviennent le mieux.",
  q2:"Quand puis-je retourner au travail ?", a2:"Juste après. Les petites rougeurs disparaissent généralement en 30 minutes.",
  q3:"Quand le traitement à la toxine botulique agit-il ?", a3:"L’effet commence après deux à trois jours et est complet après dix à 14 jours. Il dure en général de trois à six mois.",
  q4:"Le soin est-il adapté pour moi ?", a4:"Nous le déterminons lors de l’entretien avant le soin. Nous ne traitons pas pendant la grossesse et l’allaitement, en cas de certaines maladies musculaires, d’infections aiguës dans la zone à traiter ou d’intolérances connues.",
  imprint:"Mentions légales", privacy:"Confidentialité"
},
  pt: {
  title:"PALO SKIN by Dr. Vogel | Tratamento médico de rugas em Berlim",
  metaDesc:"PALO SKIN by Dr. Vogel em Berlim Prenzlauer Berg: tratamento médico de rugas pelo Dr. med. Sebastian Vogel. Marque online, também em cima da hora.",
  navPrices:"Tratamentos e preços", navHow:"Como funciona", navStudio:"Estúdio", navFaq:"Perguntas",
  book:"Agendar", bookNow:"Agendar online", whatsapp:"Alguma pergunta? Escreva para nós",
  h1:"Goodbye wrinkles.",
  lead:"Toxina botulínica e skin boosters em Berlim Prenzlauer Berg. Nosso objetivo: você parecer descansado, não diferente. Orientação e tratamento pessoais com o Dr. med. Sebastian Vogel.",
  fAddress:"Endereço", fDoctor:"Seu médico", fLang:"Consulta em", langs:"Alemão, inglês, espanhol, francês, português", fHours:"Horários", hours:"Marcação online, também em cima da hora",
  pricesH:"Tratamentos e preços",
  pricesP:"Testa, ruga entre as sobrancelhas ou pés de galinha: quais áreas fazem sentido para você, decidimos juntos no estúdio.",
  botH:"Tratamento com toxina botulínica",
  z1:"1 zona", z2:"2 zonas", z3:"3 zonas", zx:"Cada zona adicional", zoneLink:"O que conta como zona?",
  kauH:"Masseter (músculo da mandíbula)", kauR:"Facial slimming, alívio do bruxismo",
  nefH:"Lifting Nefertiti", nefR:"Pescoço e contorno da mandíbula",
  achselH:"Suor excessivo (hiperidrose)", achselR:"Axilas",
  boostH:"Skin booster",
  lachs:"DNA de salmão, uma sessão", lachsS:"Olheiras, área dos olhos", lachs4:"DNA de salmão, quatro sessões", lachs4S:"Olheiras, área dos olhos", pLachs4:"1.000 €*",
  pnote:"* Valores de referência. Cobrança conforme a tabela alemã de honorários médicos (Gebührenordnung für Ärzte). Preços com imposto sobre o valor agregado incluído.",
  howH:"Sua consulta na PALO SKIN",
  s1H:"Encontre o seu horário.", s1P:"Escolha a sua consulta online, a confirmação chega na hora por e-mail. Sua consulta começa pontualmente, em geral sem nenhuma espera.",
  s2H:"Primeiro falamos sobre os seus desejos.", s2P:"O que você gostaria de mudar? Que perguntas tem? Juntos falamos sobre as possibilidades, os limites e os custos.",
  s3H:"Depois, você decide.", s3P:"Se o tratamento for adequado para você e você se decidir por ele, o Dr. Vogel trata você pessoalmente.",
  studioH:"Um estúdio. Seu médico.",
  quote1:"“Eu sou Sebastian Vogel. Na PALO SKIN, oriento e trato você pessoalmente. Conversamos sobre o que você deseja, o que faz sentido do ponto de vista médico e onde estão os limites.",
  quote3:"Seu tempo é tão importante para mim quanto o meu: sua consulta começa pontualmente, em geral sem nenhuma espera.”",
  studioLangs:"Falo alemão, inglês, espanhol, francês e português. Escolha o idioma em que você se sente mais à vontade.",
  studioAddr:"Hagenauer Straße 14, 10435 Berlim, Prenzlauer Berg", mapL:"Como chegar",
  faqH:"Perguntas frequentes",
  q1:"O que é uma zona?", a1:"Uma área de tratamento, por exemplo a ruga entre as sobrancelhas, a testa ou os pés de galinha (os dois lados juntos). Outras zonas: lip flip, brow lift, cantos da boca, queixo com covinhas, sorriso gengival, rugas do lábio superior, bunny lines, afinamento do nariz. Quais zonas combinam melhor com você, decidimos juntos no estúdio.",
  q2:"Quando posso voltar ao trabalho?", a2:"Logo em seguida. Pequenas vermelhidões costumam desaparecer em 30 minutos.",
  q3:"Quando o tratamento com toxina botulínica faz efeito?", a3:"O efeito começa após dois a três dias e está completo após dez a 14 dias. Em geral, dura de três a seis meses.",
  q4:"O tratamento é adequado para mim?", a4:"Esclarecemos isso na conversa antes do tratamento. Não tratamos durante a gravidez e a amamentação, em certas doenças musculares, com infecções agudas na área de tratamento nem com intolerâncias conhecidas.",
  imprint:"Informações legais", privacy:"Privacidade"
},
  uk: {
  title:"PALO SKIN by Dr. Vogel | Лікарська корекція зморшок у Берліні",
  metaDesc:"PALO SKIN by Dr. Vogel у Берліні, Prenzlauer Berg: лікарська корекція зморшок від Dr. med. Sebastian Vogel. Запис онлайн, також на найближчі дні.",
  navPrices:"Процедури та ціни", navHow:"Як це відбувається", navStudio:"Студія", navFaq:"Питання",
  book:"Записатися", bookNow:"Записатися онлайн", whatsapp:"Є питання? Напишіть нам",
  h1:"Goodbye wrinkles.",
  lead:"Ботулінотерапія та Skin Booster у Берліні, Prenzlauer Berg. Наша мета: щоб Ви виглядали відпочилими, а не іншими. Особиста консультація та процедура від Dr. med. Sebastian Vogel.",
  fAddress:"Адреса", fDoctor:"Ваш лікар", fLang:"Мови консультації", langs:"німецька, англійська, іспанська, французька, португальська", fHours:"Запис", hours:"Онлайн, також на найближчі дні",
  pricesH:"Процедури та ціни",
  pricesP:"Чоло, міжбрівна зморшка чи «гусячі лапки»: які зони доцільні саме для Вас, ми обговоримо разом у студії.",
  botH:"Ботулінотерапія",
  z1:"1 зона", z2:"2 зони", z3:"3 зони", zx:"Кожна наступна зона", zoneLink:"Що вважається зоною?",
  kauH:"Жувальний м’яз (масетер)", kauR:"Facial Slimming, розслаблення при скреготі зубами",
  nefH:"Ліфтинг Nefertiti", nefR:"Шия та контур нижньої щелепи",
  achselH:"Надмірне потовиділення (гіпергідроз)", achselR:"Пахви",
  boostH:"Skin Booster",
  lachs:"ДНК лосося, одна процедура", lachsS:"Темні кола під очима, зона навколо очей", lachs4:"ДНК лосося, чотири процедури", lachs4S:"Темні кола під очима, зона навколо очей", pLachs4:"1 000 €*",
  pnote:"* Орієнтовні ціни. Розрахунок згідно з німецьким тарифом на лікарські послуги (Gebührenordnung für Ärzte). Ціни включають податок на додану вартість.",
  howH:"Ваш візит до PALO SKIN",
  s1H:"Оберіть зручний для Вас час.", s1P:"Оберіть час онлайн, підтвердження одразу надійде на Вашу електронну пошту. Ваш прийом починається вчасно, як правило, зовсім без очікування.",
  s2H:"Спершу ми говоримо про Ваші побажання.", s2P:"Що Ви хотіли б змінити? Які у Вас є запитання? Разом ми обговорюємо можливості, межі та вартість.",
  s3H:"Потім вирішуєте Ви.", s3P:"Якщо процедура Вам підходить і Ви її обираєте, Dr. Vogel проводить її особисто.",
  studioH:"Одна студія. Ваш лікар.",
  quote1:"«Мене звати Sebastian Vogel. У PALO SKIN я особисто консультую Вас і проводжу процедури. Ми обговорюємо, чого Ви бажаєте, що доцільно з медичної точки зору і де межі можливого.",
  quote3:"Ваш час для мене так само важливий, як і мій: Ваш прийом починається вчасно, як правило, зовсім без очікування.»",
  studioLangs:"Я консультую німецькою, англійською, іспанською, французькою та португальською мовами. Оберіть із цих п’яти мов ту, якою Вам найзручніше спілкуватися.",
  studioAddr:"Hagenauer Straße 14, 10435 Berlin, Prenzlauer Berg", mapL:"Як нас знайти",
  faqH:"Часті запитання",
  q1:"Що таке зона?", a1:"Ділянка, яку обробляють під час процедури, наприклад міжбрівна зморшка, чоло або «гусячі лапки» (обидві сторони разом). Інші зони: Lip Flip, Brow Lift, куточки рота, підборіддя «апельсинова кірка», Gummy Smile, зморшки над верхньою губою, Bunny Lines, звуження носа. Які зони підходять Вам найкраще, ми обговоримо разом у студії.",
  q2:"Коли я зможу повернутися до роботи?", a2:"Одразу після процедури. Невелике почервоніння зазвичай зникає протягом 30 хвилин.",
  q3:"Коли проявляється ефект ботулінотерапії?", a3:"Ефект з’являється через два-три дні, а повністю проявляється через десять-чотирнадцять днів. Як правило, він тримається від трьох до шести місяців.",
  q4:"Чи підходить мені ця процедура?", a4:"Це ми з’ясуємо під час розмови перед процедурою. Ми не проводимо процедуру під час вагітності та грудного вигодовування, при певних захворюваннях м’язів, при гострих інфекціях у зоні процедури та при відомій непереносимості.",
  imprint:"Вихідні дані", privacy:"Захист даних"
},
  ar: {
  title:"PALO SKIN by Dr. Vogel | علاج طبي للتجاعيد في برلين",
  metaDesc:"PALO SKIN by Dr. Vogel في Prenzlauer Berg ببرلين: علاج طبي للتجاعيد على يد Dr. med. Sebastian Vogel. حجز المواعيد عبر الإنترنت، حتى في وقت قريب.",
  navPrices:"العلاجات والأسعار", navHow:"سير الزيارة", navStudio:"العيادة", navFaq:"أسئلة",
  book:"حجز موعد", bookNow:"حجز موعد عبر الإنترنت", whatsapp:"لديكم سؤال؟ راسلونا",
  h1:"Goodbye wrinkles.",
  lead:"البوتولينوم وسكين بوستر في Prenzlauer Berg ببرلين. هدفنا: أن تبدو ملامحكم مرتاحة، لا مختلفة. استشارة وعلاج شخصيان على يد Dr. med. Sebastian Vogel.",
  fAddress:"العنوان", fDoctor:"طبيبكم", fLang:"لغات الاستشارة", langs:"الألمانية، الإنجليزية، الإسبانية، الفرنسية، البرتغالية", fHours:"المواعيد", hours:"الحجز عبر الإنترنت، حتى في وقت قريب",
  pricesH:"العلاجات والأسعار",
  pricesP:"الجبهة، أو خطوط ما بين الحاجبين، أو تجاعيد زوايا العينين: نحدد معًا في العيادة المناطق المناسبة لكم.",
  botH:"العلاج بالبوتولينوم",
  z1:"منطقة واحدة", z2:"منطقتان", z3:"3 مناطق", zx:"كل منطقة إضافية", zoneLink:"ما المقصود بالمنطقة؟",
  kauH:"عضلة المضغ (الماضغة)", kauR:"تنحيف الوجه، والتخفيف من صرير الأسنان",
  nefH:"شد نفرتيتي", nefR:"الرقبة وخط الفك",
  achselH:"فرط التعرق", achselR:"منطقة الإبطين",
  boostH:"سكين بوستر",
  lachs:"الحمض النووي للسلمون، جلسة واحدة", lachsS:"الهالات السوداء، منطقة حول العينين", lachs4:"الحمض النووي للسلمون، أربع جلسات", lachs4S:"الهالات السوداء، منطقة حول العينين", pLachs4:"1,000 €*",
  pnote:"* أسعار استرشادية. تتم المحاسبة وفق لائحة أتعاب الأطباء الألمانية (GOÄ). الأسعار شاملة ضريبة القيمة المضافة.",
  howH:"موعدكم في PALO SKIN",
  s1H:"الوقت الذي يناسبكم.", s1P:"يمكنكم اختيار موعدكم عبر الإنترنت، ويصل التأكيد فورًا بالبريد الإلكتروني. يبدأ موعدكم في وقته، وعادةً دون أي انتظار.",
  s2H:"أولًا نتحدث عن رغباتكم.", s2P:"ما الذي ترغبون في تغييره؟ وما أسئلتكم؟ نناقش معًا الإمكانيات والحدود والتكاليف.",
  s3H:"ثم يكون القرار لكم.", s3P:"إذا كان العلاج مناسبًا لكم وقررتم إجراءه، يتولى Dr. Vogel علاجكم شخصيًا.",
  studioH:"عيادة واحدة. طبيبكم الخاص.",
  quote1:"«أنا Sebastian Vogel. في PALO SKIN أقدّم لكم الاستشارة والعلاج بنفسي. نتحدث معًا عمّا ترغبون فيه، وعمّا هو مفيد طبيًا، وأين تكمن الحدود.",
  quote3:"وقتكم مهم بالنسبة لي تمامًا مثل وقتي: يبدأ موعدكم في وقته، وعادةً دون أي انتظار.»",
  studioLangs:"أتحدث الألمانية والإنجليزية والإسبانية والفرنسية والبرتغالية، وتتم الاستشارة بإحدى هذه اللغات الخمس. يرجى اختيار اللغة التي ترتاحون إليها أكثر من بينها.",
  studioAddr:"Hagenauer Straße 14, 10435 Berlin, Prenzlauer Berg", mapL:"الطريق إلينا",
  faqH:"أسئلة شائعة",
  q1:"ما المقصود بالمنطقة؟", a1:"منطقة علاج واحدة، مثل خطوط ما بين الحاجبين أو الجبهة أو تجاعيد زوايا العينين (الجانبان معًا). ومن المناطق الأخرى: ليب فليب، ورفع الحاجبين، وزوايا الفم، وتجعّد الذقن، والابتسامة اللثوية، وتجاعيد الشفة العليا، وتجاعيد جانبي الأنف، وتنحيف الأنف. نحدد معًا في العيادة المناطق الأنسب لكم.",
  q2:"متى يمكنني العودة إلى العمل؟", a2:"مباشرة بعد العلاج. عادةً ما يختفي الاحمرار الخفيف خلال 30 دقيقة.",
  q3:"متى يظهر مفعول العلاج بالبوتولينوم؟", a3:"يبدأ المفعول بعد يومين إلى ثلاثة أيام، ويكتمل بعد 10 إلى 14 يومًا. ويستمر عادةً من ثلاثة إلى ستة أشهر.",
  q4:"هل العلاج مناسب لي؟", a4:"نوضح ذلك في الحديث معكم قبل العلاج. لا نجري العلاج في حالات الحمل والرضاعة، وبعض أمراض العضلات، والالتهابات الحادة في منطقة العلاج، وحالات عدم التحمل المعروفة.",
  imprint:"الإشعار القانوني", privacy:"حماية البيانات"
},

};

/*
 * Französisch: Die frühere Fassung in home-text.js wollte vor ? ! : ; ein geschütztes Leerzeichen setzen, ersetzte aber
 * versehentlich durch ein normales Leerzeichen. Für die pixelgleiche Übernahme bleibt es vorerst bei normalen Leerzeichen.
 */
