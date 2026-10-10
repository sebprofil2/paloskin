/*
 * Seite über Dr. med. Sebastian Vogel (/dr-sebastian-vogel), 10. Oktober 2026.
 * Der deutsche Text stammt von Dr. Vogel selbst und steht hier WÖRTLICH (auch „Patientin oder Patient“);
 * nicht nach dem Sprachleitfaden umformulieren. Einzige Korrektur: „Universtität“ zu „Universität“.
 * Englisch, Spanisch, Französisch und Portugiesisch sind wörtliche, sachliche Übersetzungen.
 * Auszeichnung im Text: __kursiv__ (Zeitschriften). Fett nur für Zwischenüberschriften (Entscheidung Dr. Vogel, 10. Oktober 2026).
 * Änderungen 10. Oktober 2026 (Auftrag Dr. Vogel): Australien ergänzt, „u.a.“ ausgeschrieben, Überschriften mit Punkt wie
 * auf der Startseite.
 */
export type ArztLang = "de" | "en" | "es" | "fr" | "pt";

export type ArztTexte = {
  title: string;
  description: string;
  alt: string;
  sub: string;
  intro: string;
  /** Abschnittsüberschriften wie auf der Startseite: [gerade, blau kursiv] */
  expH: [string, string];
  exp: { h: string; p: string }[];
  pubLinks: [string, string][];
  afterPub: string[];
  awardsH: [string, string];
  awards: string[];
  langH: [string, string];
  langP: string[];
};

const PUB_URLS = [
  "https://wwwnc.cdc.gov/eid/article/27/8/20-4859_article",
  "https://www.mdpi.com/2075-4418/12/1/162",
  "https://www.mdpi.com/2075-4418/11/10/1797",
];

const de: ArztTexte = {
  title: "Dr. med. Sebastian Vogel | Ärztliche Faltenbehandlung in Berlin | PALO SKIN",
  description: "Dr. med. Sebastian Vogel, Arzt und Gründer von PALO SKIN in Berlin Prenzlauer Berg. Werdegang, Arbeitsweise und Beratung in fünf Sprachen.",
  alt: "Dr. med. Sebastian Vogel im Studio PALO SKIN",
  sub: "Gründer und Arzt bei PALO SKIN by Dr. Vogel",
  intro: "Bei PALO SKIN behandle und berate ich Sie als Patientin oder Patient. Dabei bringe ich Erfahrung aus mehr als 5.000 ästhetischen Behandlungen mit. Fragen Sie mich gern alles, was Sie wissen möchten.",
  expH: ["Medizinische", "Erfahrung."],
  exp: [
    { h: "Ästhetische Medizin", p: "Mein Einstieg begann vor Jahren mit meinem ersten Botulinumtoxin-Lehrgang. Heute liegt mein alleiniger ärztlicher Schwerpunkt in der ästhetischen Medizin." },
    { h: "Chirurgie und Intensivmedizin", p: "Am Städtischen Klinikum Neuperlach in München absolvierte ich die chirurgische Basisweiterbildung, den sogenannten „Common Trunk“. Dazu gehörten Allgemein- und Viszeralchirurgie, Gefäßchirurgie und die Arbeit auf der Intensivstation." },
    { h: "Approbation und Promotion zum Dr. med. an der Universität Freiburg", p: "Nach meinem Medizinstudium erhielt ich die Approbation an der Albert-Ludwigs-Universität Freiburg, die staatliche Zulassung als Arzt. Meine Promotion wurde mit „magna cum laude“ ausgezeichnet, der Bewertung „sehr gut“." },
    { h: "Plastische Chirurgie in Brasilien", p: "Während meines Medizinstudiums sammelte ich unter anderem Erfahrung in der plastischen Chirurgie in Brasilien. Weitere Studien- und Klinikaufenthalte führten mich nach Frankreich, Spanien, Mexiko und Australien." },
    { h: "Wissenschaftliche Veröffentlichungen", p: "Ich bin Autor mehrerer Studien zur Früherkennung von SARS-CoV-2 in Schulen und Betreuungseinrichtungen. Die Arbeiten erschienen in __Emerging Infectious Diseases__, einer der führenden Fachzeitschriften für Infektionskrankheiten, herausgegeben von der US-Gesundheitsbehörde CDC, sowie in __Diagnostics__." },
  ],
  pubLinks: [
    ["Früherkennung in Schulen und Kindergärten · Emerging Infectious Diseases", PUB_URLS[0]],
    ["Speicheltests zur Früherkennung in Grundschulen · Diagnostics", PUB_URLS[1]],
    ["SARS-CoV-2-Screening bei Kindern · Diagnostics", PUB_URLS[2]],
  ],
  afterPub: [
    "Darüber hinaus arbeitete ich bei der Boston Consulting Group als Berater im Gesundheitswesen für Pharmaunternehmen, Medizintechnikhersteller, Krankenhäuser und Versicherungen.",
    "Als Gründer und Geschäftsführer von 150Minuten entwickelte ich mit meinem Team ein Gesundheitsangebot, das Menschen zu mehr Bewegung im Alltag motiviert.",
  ],
  awardsH: ["Stipendien und", "Auszeichnungen."],
  awards: [
    "Stipendiat der Studienstiftung des deutschen Volkes",
    "Stipendiat des Deutschen Akademischen Austauschdienstes (DAAD)",
    "Promotion zum Dr. med. mit magna cum laude",
    "Erster Bundespreis bei „Jugend musiziert“, klassische Gitarre",
  ],
  langH: ["Fünf Sprachen,", "viele Perspektiven."],
  langP: [
    "Ein Austauschjahr in den USA und ein Freiwilliges Soziales Jahr in einem Kindergarten in Frankreich gehörten schon vor dem Studium zu meinem Weg.",
    "Heute berate und behandle ich Sie auf Deutsch, Englisch, Spanisch, Französisch und Portugiesisch.",
  ],
};

const en: ArztTexte = {
  title: "Dr. med. Sebastian Vogel | Physician-led wrinkle treatment in Berlin | PALO SKIN",
  description: "Dr. med. Sebastian Vogel, physician and founder of PALO SKIN in Berlin Prenzlauer Berg. Career, way of working and consultations in five languages.",
  alt: "Dr. med. Sebastian Vogel in the PALO SKIN studio",
  sub: "Founder and physician at PALO SKIN by Dr. Vogel",
  intro: "At PALO SKIN, I treat and advise you as a patient. I bring experience from more than 5,000 aesthetic treatments. Feel free to ask me anything you would like to know.",
  expH: ["Medical", "experience."],
  exp: [
    { h: "Aesthetic medicine", p: "My path began years ago with my first botulinum toxin course. Today, my sole medical focus is aesthetic medicine." },
    { h: "Surgery and intensive care medicine", p: "At Städtisches Klinikum Neuperlach in Munich, I completed basic surgical training, the so-called “Common Trunk”. This included general and visceral surgery, vascular surgery and work in the intensive care unit." },
    { h: "Licence to practise and doctorate (Dr. med.) at the University of Freiburg", p: "After my medical studies, I received my licence to practise (Approbation), the state authorisation as a physician, at the Albert-Ludwigs-Universität Freiburg. My doctorate was awarded “magna cum laude”, the grade “very good”." },
    { h: "Plastic surgery in Brazil", p: "During my medical studies, I gained experience in plastic surgery in Brazil, among other things. Further study and clinical placements took me to France, Spain, Mexico and Australia." },
    { h: "Scientific publications", p: "I am the author of several studies on the early detection of SARS-CoV-2 in schools and childcare facilities. The work was published in __Emerging Infectious Diseases__, one of the leading journals for infectious diseases, published by the US health authority CDC, and in __Diagnostics__." },
  ],
  pubLinks: [
    ["Early detection in schools and kindergartens · Emerging Infectious Diseases", PUB_URLS[0]],
    ["Saliva tests for early detection in primary schools · Diagnostics", PUB_URLS[1]],
    ["SARS-CoV-2 screening in children · Diagnostics", PUB_URLS[2]],
  ],
  afterPub: [
    "In addition, I worked at Boston Consulting Group as a healthcare consultant for pharmaceutical companies, medical technology manufacturers, hospitals and insurers.",
    "As founder and managing director of 150Minuten, I developed with my team a health programme that motivates people to move more in everyday life.",
  ],
  awardsH: ["Scholarships and", "awards."],
  awards: [
    "Scholarship holder of the German Academic Scholarship Foundation (Studienstiftung des deutschen Volkes)",
    "Scholarship holder of the German Academic Exchange Service (DAAD)",
    "Doctorate (Dr. med.) with magna cum laude",
    "First federal prize at “Jugend musiziert”, classical guitar",
  ],
  langH: ["Five languages,", "many perspectives."],
  langP: [
    "An exchange year in the USA and a voluntary social year in a kindergarten in France were part of my path even before my studies.",
    "Today, I advise and treat you in German, English, Spanish, French and Portuguese.",
  ],
};

const es: ArztTexte = {
  title: "Dr. med. Sebastian Vogel | Tratamiento médico de arrugas en Berlín | PALO SKIN",
  description: "Dr. med. Sebastian Vogel, médico y fundador de PALO SKIN en Berlín Prenzlauer Berg. Trayectoria, forma de trabajar y asesoramiento en cinco idiomas.",
  alt: "El Dr. med. Sebastian Vogel en el estudio PALO SKIN",
  sub: "Fundador y médico en PALO SKIN by Dr. Vogel",
  intro: "En PALO SKIN le trato y le asesoro como paciente. Para ello aporto la experiencia de más de 5.000 tratamientos estéticos. Pregúnteme con toda confianza todo lo que desee saber.",
  expH: ["Experiencia", "médica."],
  exp: [
    { h: "Medicina estética", p: "Mis inicios se remontan a hace años, con mi primer curso de toxina botulínica. Hoy mi único enfoque médico es la medicina estética." },
    { h: "Cirugía y medicina intensiva", p: "En el Städtisches Klinikum Neuperlach de Múnich realicé la formación quirúrgica básica, el llamado «Common Trunk». Esta incluyó cirugía general y visceral, cirugía vascular y el trabajo en la unidad de cuidados intensivos." },
    { h: "Licencia para ejercer y doctorado (Dr. med.) en la Universidad de Friburgo", p: "Tras mis estudios de Medicina obtuve la licencia para ejercer (Approbation), la autorización estatal como médico, en la Albert-Ludwigs-Universität de Friburgo. Mi tesis doctoral recibió la calificación «magna cum laude», es decir, «muy bien»." },
    { h: "Cirugía plástica en Brasil", p: "Durante mis estudios de Medicina adquirí, entre otras cosas, experiencia en cirugía plástica en Brasil. Otras estancias de estudio y en clínicas me llevaron a Francia, España, México y Australia." },
    { h: "Publicaciones científicas", p: "Soy autor de varios estudios sobre la detección temprana del SARS-CoV-2 en colegios y centros de cuidado infantil. Los trabajos se publicaron en __Emerging Infectious Diseases__, una de las principales revistas especializadas en enfermedades infecciosas, editada por la autoridad sanitaria estadounidense CDC, así como en __Diagnostics__." },
  ],
  pubLinks: [
    ["Detección temprana en colegios y guarderías · Emerging Infectious Diseases", PUB_URLS[0]],
    ["Pruebas de saliva para la detección temprana en escuelas primarias · Diagnostics", PUB_URLS[1]],
    ["Cribado de SARS-CoV-2 en niños · Diagnostics", PUB_URLS[2]],
  ],
  afterPub: [
    "Además, trabajé en Boston Consulting Group como consultor del sector sanitario para empresas farmacéuticas, fabricantes de tecnología médica, hospitales y aseguradoras.",
    "Como fundador y director general de 150Minuten, desarrollé con mi equipo una oferta de salud que motiva a las personas a moverse más en su día a día.",
  ],
  awardsH: ["Becas y", "distinciones."],
  awards: [
    "Becario de la Studienstiftung des deutschen Volkes (Fundación Académica Nacional de Alemania)",
    "Becario del Servicio Alemán de Intercambio Académico (DAAD)",
    "Doctorado (Dr. med.) con magna cum laude",
    "Primer premio federal en «Jugend musiziert», guitarra clásica",
  ],
  langH: ["Cinco idiomas,", "muchas perspectivas."],
  langP: [
    "Un año de intercambio en Estados Unidos y un año de voluntariado social en una guardería en Francia formaron parte de mi camino ya antes de la carrera.",
    "Hoy le asesoro y le trato en alemán, inglés, español, francés y portugués.",
  ],
};

const fr: ArztTexte = {
  title: "Dr. med. Sebastian Vogel | Traitement médical des rides à Berlin | PALO SKIN",
  description: "Dr. med. Sebastian Vogel, médecin et fondateur de PALO SKIN à Berlin Prenzlauer Berg. Parcours, méthode de travail et consultations en cinq langues.",
  alt: "Le Dr. med. Sebastian Vogel au studio PALO SKIN",
  sub: "Fondateur et médecin chez PALO SKIN by Dr. Vogel",
  intro: "Chez PALO SKIN, je vous soigne et vous conseille en tant que patiente ou patient. J’apporte pour cela l’expérience de plus de 5 000 traitements esthétiques. N’hésitez pas à me poser toutes les questions que vous souhaitez.",
  expH: ["Expérience", "médicale."],
  exp: [
    { h: "Médecine esthétique", p: "Mes débuts remontent à plusieurs années, avec ma première formation à la toxine botulique. Aujourd’hui, la médecine esthétique est mon unique domaine médical." },
    { h: "Chirurgie et médecine intensive", p: "Au Städtisches Klinikum Neuperlach à Munich, j’ai effectué la formation chirurgicale de base, appelée « Common Trunk ». Elle comprenait la chirurgie générale et viscérale, la chirurgie vasculaire et le travail en unité de soins intensifs." },
    { h: "Autorisation d’exercer et doctorat (Dr. med.) à l’Université de Fribourg-en-Brisgau", p: "Après mes études de médecine, j’ai obtenu l’autorisation d’exercer (Approbation), l’autorisation de l’État d’exercer en tant que médecin, à l’Albert-Ludwigs-Universität de Fribourg-en-Brisgau. Ma thèse de doctorat a obtenu la mention « magna cum laude », soit « très bien »." },
    { h: "Chirurgie plastique au Brésil", p: "Pendant mes études de médecine, j’ai notamment acquis de l’expérience en chirurgie plastique au Brésil. D’autres séjours d’études et en clinique m’ont conduit en France, en Espagne, au Mexique et en Australie." },
    { h: "Publications scientifiques", p: "Je suis l’auteur de plusieurs études sur la détection précoce du SARS-CoV-2 dans les écoles et les structures d’accueil de l’enfance. Ces travaux ont été publiés dans __Emerging Infectious Diseases__, l’une des principales revues spécialisées en maladies infectieuses, éditée par l’autorité sanitaire américaine CDC, ainsi que dans __Diagnostics__." },
  ],
  pubLinks: [
    ["Détection précoce dans les écoles et les jardins d’enfants · Emerging Infectious Diseases", PUB_URLS[0]],
    ["Tests salivaires pour la détection précoce dans les écoles primaires · Diagnostics", PUB_URLS[1]],
    ["Dépistage du SARS-CoV-2 chez l’enfant · Diagnostics", PUB_URLS[2]],
  ],
  afterPub: [
    "J’ai par ailleurs travaillé au Boston Consulting Group comme consultant dans le secteur de la santé pour des entreprises pharmaceutiques, des fabricants de dispositifs médicaux, des hôpitaux et des assurances.",
    "En tant que fondateur et directeur général de 150Minuten, j’ai développé avec mon équipe une offre de santé qui motive les gens à bouger davantage au quotidien.",
  ],
  awardsH: ["Bourses et", "distinctions."],
  awards: [
    "Boursier de la Studienstiftung des deutschen Volkes (Fondation nationale allemande pour les études)",
    "Boursier de l’Office allemand d’échanges universitaires (DAAD)",
    "Doctorat (Dr. med.) avec la mention magna cum laude",
    "Premier prix fédéral au concours « Jugend musiziert », guitare classique",
  ],
  langH: ["Cinq langues,", "de nombreuses perspectives."],
  langP: [
    "Une année d’échange aux États-Unis et une année de service civique volontaire dans un jardin d’enfants en France faisaient déjà partie de mon parcours avant mes études.",
    "Aujourd’hui, je vous conseille et vous soigne en allemand, anglais, espagnol, français et portugais.",
  ],
};

const pt: ArztTexte = {
  title: "Dr. med. Sebastian Vogel | Tratamento médico de rugas em Berlim | PALO SKIN",
  description: "Dr. med. Sebastian Vogel, médico e fundador da PALO SKIN em Berlim Prenzlauer Berg. Trajetória, forma de trabalhar e atendimento em cinco idiomas.",
  alt: "Dr. med. Sebastian Vogel no estúdio PALO SKIN",
  sub: "Fundador e médico da PALO SKIN by Dr. Vogel",
  intro: "Na PALO SKIN, eu trato e oriento você como paciente. Para isso, trago a experiência de mais de 5.000 tratamentos estéticos. Fique à vontade para me perguntar tudo o que quiser saber.",
  expH: ["Experiência", "médica."],
  exp: [
    { h: "Medicina estética", p: "Meu começo foi há anos, com meu primeiro curso de toxina botulínica. Hoje, meu único foco médico é a medicina estética." },
    { h: "Cirurgia e medicina intensiva", p: "No Städtisches Klinikum Neuperlach, em Munique, concluí a formação cirúrgica básica, o chamado “Common Trunk”. Ela incluiu cirurgia geral e visceral, cirurgia vascular e o trabalho na unidade de terapia intensiva." },
    { h: "Licença para exercer a medicina e doutorado (Dr. med.) na Universidade de Freiburg", p: "Depois do curso de Medicina, obtive a licença para exercer a medicina (Approbation), a autorização estatal como médico, na Albert-Ludwigs-Universität Freiburg. Meu doutorado recebeu a distinção “magna cum laude”, a nota “muito bom”." },
    { h: "Cirurgia plástica no Brasil", p: "Durante o curso de Medicina, adquiri, entre outras coisas, experiência em cirurgia plástica no Brasil. Outros períodos de estudo e em clínicas me levaram à França, à Espanha, ao México e à Austrália." },
    { h: "Publicações científicas", p: "Sou autor de vários estudos sobre a detecção precoce do SARS-CoV-2 em escolas e instituições de cuidado infantil. Os trabalhos foram publicados na __Emerging Infectious Diseases__, uma das principais revistas científicas sobre doenças infecciosas, publicada pela autoridade de saúde norte-americana CDC, e na __Diagnostics__." },
  ],
  pubLinks: [
    ["Detecção precoce em escolas e jardins de infância · Emerging Infectious Diseases", PUB_URLS[0]],
    ["Testes de saliva para detecção precoce em escolas primárias · Diagnostics", PUB_URLS[1]],
    ["Triagem de SARS-CoV-2 em crianças · Diagnostics", PUB_URLS[2]],
  ],
  afterPub: [
    "Além disso, trabalhei no Boston Consulting Group como consultor na área da saúde para empresas farmacêuticas, fabricantes de tecnologia médica, hospitais e seguradoras.",
    "Como fundador e diretor-geral da 150Minuten, desenvolvi com minha equipe uma oferta de saúde que motiva as pessoas a se movimentarem mais no dia a dia.",
  ],
  awardsH: ["Bolsas e", "prêmios."],
  awards: [
    "Bolsista da Studienstiftung des deutschen Volkes (Fundação Acadêmica Nacional da Alemanha)",
    "Bolsista do Serviço Alemão de Intercâmbio Acadêmico (DAAD)",
    "Doutorado (Dr. med.) com magna cum laude",
    "Primeiro prêmio federal no “Jugend musiziert”, violão clássico",
  ],
  langH: ["Cinco idiomas,", "muitas perspectivas."],
  langP: [
    "Um ano de intercâmbio nos Estados Unidos e um ano de serviço social voluntário em um jardim de infância na França já fizeram parte do meu caminho antes da faculdade.",
    "Hoje, eu oriento e trato você em alemão, inglês, espanhol, francês e português.",
  ],
};

export const ARZT_TEXTE: Record<ArztLang, ArztTexte> = { de, en, es, fr, pt };
