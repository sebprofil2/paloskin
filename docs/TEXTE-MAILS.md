# Kundentexte: Bestätigungsmail, Erinnerungsmail, Kalenderdatei, Terminseite, Bestätigungsseite (fünf Sprachen)

Stand: 3. Oktober 2026, endgültige Fassung (Freigabe Dr. Vogel). Deutsch wörtlich, die anderen Sprachen sinngemäß im selben Ton; Betreffzeilen höchstens 40 Zeichen mit Datum und Uhrzeit vorn. Erzeugt aus `lib/texts-mail.ts` und `lib/texts.ts` mit `scripts/texte-mails.mts`. Beispieltermin Mittwoch, 7. Oktober 2026, 08:00 Uhr, Vorname Verena, zu zweit.

## Deutsch (de)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (35 Zeichen): Gebucht: Mittwoch, 7.10., 08:00 Uhr

```
Hallo Verena,

schön, dass Sie zu uns kommen! Wir freuen uns auf Sie:

Mittwoch, 7. Oktober, 08:00 Uhr (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[So finden Sie uns] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Ihre Zeit ist uns wichtig: Bei PALO SKIN beginnt Ihr Termin pünktlich, ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher. Falls Sie später kommen, bleibt entsprechend weniger Zeit für Ihren Termin, damit auch die nächsten Kunden pünktlich starten.

Für Sie beide haben wir Zeit eingeplant. (nur bei zu zweit)

Möchten Sie den Termin gleich im Kalender speichern?
[Google Kalender] [iPhone-Kalender] [Outlook]

Am Tag vorher erinnern wir Sie noch einmal.

Falls etwas dazwischenkommt, können Sie Ihren Termin bis 48 Stunden vorher über den Link absagen. Danach schreiben Sie uns bitte per WhatsApp an +49 151 58872566.
[Termin ansehen oder absagen]

Bis bald!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (24 Zeichen): Bis morgen um 08:00 Uhr!

```
Hallo Verena,

morgen sehen wir uns bei PALO SKIN. Wir freuen uns auf Sie!

Mittwoch, 7. Oktober, 08:00 Uhr (fett)
Hagenauer Straße 14, 10435 Berlin
[So finden Sie uns]

Ihr Termin beginnt pünktlich, ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher.

Wenn Sie möchten, geben Sie uns kurz ein Zeichen:
[Ja, ich komme]
Ihr Termin bleibt auch ohne Klick für Sie reserviert.

Falls etwas dazwischenkommt, schreiben Sie uns bitte per WhatsApp an +49 151 58872566.
[Per WhatsApp schreiben] (https://wa.me/4915158872566)

Bis morgen!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Termin bei PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Absagen bis 48 Stunden vorher über den Link in Ihrer Bestätigung, danach per WhatsApp an +49 151 58872566. So finden Sie uns: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8

### Terminseite

- Überschrift: Ihr Termin
- Anrede: Hallo Verena, hier finden Sie Ihren Termin bei PALO SKIN:
- Kasten: Mittwoch, 7. Oktober 2026, 08:00 Uhr, PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [So finden Sie uns]
- Hinweis: Ihr Termin beginnt pünktlich, ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher.
- Offen, mehr als 48 Stunden: Wenn Sie möchten, sagen Sie uns kurz Bescheid, dass Sie dabei sind. Ihr Termin bleibt auch ohne Bestätigung für Sie reserviert. [Ja, ich komme] [Termin absagen]
- Rückfrage vor Absage: Möchten Sie Ihren Termin absagen? Mittwoch, 7. Oktober 2026, 08:00 Uhr [Termin absagen] [Termin behalten]
- Offen, weniger als 48 Stunden: [Ja, ich komme] Möchten Sie absagen? Da Ihr Termin in weniger als 48 Stunden beginnt, schreiben Sie uns bitte kurz per WhatsApp. [Per WhatsApp schreiben]
- Nach Zusage: Danke! Wir freuen uns auf Sie am Mittwoch, 7. Oktober, um 08:00 Uhr.
- Nach Absage: Ihr Termin ist abgesagt. Wir freuen uns, Sie ein anderes Mal zu sehen. [Neuen Termin buchen]
- Bereits abgesagt: Ihr Termin ist bereits abgesagt. Möchten Sie einen neuen Termin finden? [Neuen Termin buchen]
- Termin vorbei: Der Termin war am Mittwoch, 7. Oktober, um 08:00 Uhr. Möchten Sie einen neuen Termin vereinbaren? [Neuen Termin buchen]
- Ungültiger Link: Dieser Link lässt sich nicht öffnen. Schreiben Sie uns kurz per WhatsApp, wir helfen Ihnen gern weiter. [Per WhatsApp schreiben]
- Testbetrieb (Mails): Testbetrieb: Diese Nachricht gehört zu einer Testbuchung.

### Bestätigungsseite der Buchung

Gebucht! Wir freuen uns auf Sie. / Alle Details bekommen Sie gleich per E-Mail.

### Hinweiskasten im letzten Buchungsschritt

Zeit für Sie: Ihr Termin beginnt pünktlich, ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher. Falls etwas dazwischenkommt: Bis 48 Stunden vorher können Sie über den Link in Ihrer Bestätigung absagen. Danach schreiben Sie uns bitte per WhatsApp an +49 151 58872566.

## English (en)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (24 Zeichen): Booked: Wed 7 Oct, 08:00

```
Hello Verena,

lovely that you’re coming to see us! We look forward to seeing you:

Wednesday 7 October, 08:00 (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[How to find us] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Your time matters to us: at PALO SKIN, your appointment starts on time, with no waiting. Please arrive at the agreed time or at most five minutes early. If you arrive later, there is correspondingly less time for your appointment, so the next clients can also start on time.

We have planned time for both of you. (nur bei zu zweit)

Would you like to save the appointment to your calendar right away?
[Google Calendar] [iPhone Calendar] [Outlook]

We’ll remind you once more the day before.

If something comes up, you can cancel your appointment via the link up to 48 hours in advance. After that, please message us on WhatsApp at +49 151 58872566.
[View or cancel appointment]

See you soon!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (26 Zeichen): See you tomorrow at 08:00!

```
Hello Verena,

we’ll see you tomorrow at PALO SKIN. We look forward to seeing you!

Wednesday 7 October, 08:00 (fett)
Hagenauer Straße 14, 10435 Berlin
[How to find us]

Your appointment starts on time, with no waiting. Please arrive at the agreed time or at most five minutes early.

If you like, give us a quick sign:
[Yes, I’ll be there]
Your appointment stays reserved for you even without a click.

If something comes up, please message us on WhatsApp at +49 151 58872566.
[Message us on WhatsApp] (https://wa.me/4915158872566)

See you tomorrow!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Appointment at PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Cancel up to 48 hours in advance via the link in your confirmation, after that on WhatsApp at +49 151 58872566. How to find us: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8

### Terminseite

- Überschrift: Your appointment
- Anrede: Hello Verena, here is your appointment at PALO SKIN:
- Kasten: Wednesday, 7 October 2026, 08:00, PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [How to find us]
- Hinweis: Your appointment starts on time, with no waiting. Please arrive at the agreed time or at most five minutes early.
- Offen, mehr als 48 Stunden: If you like, let us know briefly that you’ll be there. Your appointment stays reserved for you even without confirmation. [Yes, I’ll be there] [Cancel appointment]
- Rückfrage vor Absage: Would you like to cancel your appointment? Wednesday, 7 October 2026, 08:00 [Cancel appointment] [Keep appointment]
- Offen, weniger als 48 Stunden: [Yes, I’ll be there] Would you like to cancel? As your appointment starts in less than 48 hours, please send us a quick WhatsApp message. [Message us on WhatsApp]
- Nach Zusage: Thank you! We look forward to seeing you on Wednesday 7 October at 08:00.
- Nach Absage: Your appointment is cancelled. We look forward to seeing you another time. [Book a new appointment]
- Bereits abgesagt: Your appointment has already been cancelled. Would you like to find a new one? [Book a new appointment]
- Termin vorbei: The appointment was on Wednesday 7 October at 08:00. Would you like to arrange a new one? [Book a new appointment]
- Ungültiger Link: This link cannot be opened. Send us a quick WhatsApp message and we’ll be happy to help. [Message us on WhatsApp]
- Testbetrieb (Mails): Test mode: this message belongs to a test booking.

### Bestätigungsseite der Buchung

Booked! We look forward to seeing you. / All the details will reach you by email in a moment.

### Hinweiskasten im letzten Buchungsschritt

Time for you: Your appointment starts on time, with no waiting. Please arrive at the agreed time or at most five minutes early. If something comes up: up to 48 hours in advance you can cancel via the link in your confirmation. After that, please message us on WhatsApp at +49 151 58872566.

## Español (es)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (28 Zeichen): Reservado: mié 7/10, 08:00 h

```
Hola Verena,

¡qué bien que venga a vernos! Le esperamos:

Miércoles, 7 de octubre, 08:00 h (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[Cómo llegar] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Su tiempo es importante para nosotros: en PALO SKIN su cita empieza puntual, sin espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes. Si llega más tarde, quedará menos tiempo para su cita, para que los siguientes clientes también empiecen puntuales.

Hemos reservado tiempo para los dos. (nur bei zu zweit)

¿Quiere guardar la cita en su calendario ahora mismo?
[Google Calendar] [Calendario del iPhone] [Outlook]

El día anterior se lo recordamos una vez más.

Si le surge algo, puede cancelar su cita a través del enlace hasta 48 horas antes. Después, escríbanos por WhatsApp al +49 151 58872566.
[Ver o cancelar la cita]

¡Hasta pronto!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (28 Zeichen): ¡Hasta mañana a las 08:00 h!

```
Hola Verena,

mañana nos vemos en PALO SKIN. ¡Le esperamos!

Miércoles, 7 de octubre, 08:00 h (fett)
Hagenauer Straße 14, 10435 Berlin
[Cómo llegar]

Su cita empieza puntual, sin espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes.

Si quiere, díganos brevemente que viene:
[Sí, voy a ir]
Su cita queda reservada para usted aunque no haga clic.

Si le surge algo, escríbanos por WhatsApp al +49 151 58872566.
[Escribir por WhatsApp] (https://wa.me/4915158872566)

¡Hasta mañana!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Cita en PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Cancele hasta 48 horas antes a través del enlace de su confirmación, después por WhatsApp al +49 151 58872566. Cómo llegar: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8

### Terminseite

- Überschrift: Su cita
- Anrede: Hola Verena, aquí tiene su cita en PALO SKIN:
- Kasten: Miércoles, 7 de octubre de 2026, 08:00 h, PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [Cómo llegar]
- Hinweis: Su cita empieza puntual, sin espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes.
- Offen, mehr als 48 Stunden: Si quiere, díganos brevemente que viene. Su cita queda reservada para usted aunque no confirme. [Sí, voy a ir] [Cancelar cita]
- Rückfrage vor Absage: ¿Quiere cancelar su cita? Miércoles, 7 de octubre de 2026, 08:00 h [Cancelar cita] [Mantener cita]
- Offen, weniger als 48 Stunden: [Sí, voy a ir] ¿Quiere cancelar? Como su cita empieza en menos de 48 horas, escríbanos un momento por WhatsApp. [Escribir por WhatsApp]
- Nach Zusage: ¡Gracias! Le esperamos el miércoles, 7 de octubre a las 08:00 h.
- Nach Absage: Su cita queda cancelada. Nos alegrará verle en otra ocasión. [Reservar una nueva cita]
- Bereits abgesagt: Su cita ya está cancelada. ¿Quiere buscar una nueva? [Reservar una nueva cita]
- Termin vorbei: La cita fue el miércoles, 7 de octubre a las 08:00 h. ¿Quiere concertar una nueva? [Reservar una nueva cita]
- Ungültiger Link: Este enlace no se puede abrir. Escríbanos un momento por WhatsApp, le ayudamos con gusto. [Escribir por WhatsApp]
- Testbetrieb (Mails): Modo de prueba: este mensaje pertenece a una reserva de prueba.

### Bestätigungsseite der Buchung

¡Reservado! Le esperamos. / Todos los detalles le llegan enseguida por correo electrónico.

### Hinweiskasten im letzten Buchungsschritt

Tiempo para usted: Su cita empieza puntual, sin espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes. Si le surge algo: hasta 48 horas antes puede cancelar a través del enlace de su confirmación. Después, escríbanos por WhatsApp al +49 151 58872566.

## Français (fr)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (28 Zeichen): Réservé : mer. 7/10, 08 h 00

```
Bonjour Verena,

quel plaisir de vous accueillir ! Nous avons hâte de vous voir :

Mercredi 7 octobre, 08 h 00 (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[Comment nous trouver] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Votre temps nous est précieux : chez PALO SKIN, votre rendez-vous commence à l’heure, sans attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant. Si vous arrivez plus tard, il restera d’autant moins de temps pour votre rendez-vous, afin que les clients suivants commencent eux aussi à l’heure.

Nous avons prévu du temps pour vous deux. (nur bei zu zweit)

Souhaitez-vous enregistrer le rendez-vous tout de suite dans votre agenda ?
[Google Agenda] [Calendrier iPhone] [Outlook]

La veille, nous vous enverrons un rappel.

En cas d’imprévu, vous pouvez annuler votre rendez-vous via le lien jusqu’à 48 heures avant. Ensuite, écrivez-nous sur WhatsApp au +49 151 58872566.
[Voir ou annuler le rendez-vous]

À bientôt !
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (20 Zeichen): À demain à 08 h 00 !

```
Bonjour Verena,

nous nous voyons demain chez PALO SKIN. Nous avons hâte de vous accueillir !

Mercredi 7 octobre, 08 h 00 (fett)
Hagenauer Straße 14, 10435 Berlin
[Comment nous trouver]

Votre rendez-vous commence à l’heure, sans attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant.

Si vous le souhaitez, faites-nous un petit signe :
[Oui, je viens]
Votre rendez-vous reste réservé pour vous, même sans clic.

En cas d’imprévu, écrivez-nous sur WhatsApp au +49 151 58872566.
[Écrire sur WhatsApp] (https://wa.me/4915158872566)

À demain !
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Rendez-vous chez PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Annulation jusqu’à 48 heures avant via le lien de votre confirmation, ensuite sur WhatsApp au +49 151 58872566. Comment nous trouver : https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8

### Terminseite

- Überschrift: Votre rendez-vous
- Anrede: Bonjour Verena, voici votre rendez-vous chez PALO SKIN :
- Kasten: Mercredi 7 octobre 2026, 08 h 00, PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [Comment nous trouver]
- Hinweis: Votre rendez-vous commence à l’heure, sans attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant.
- Offen, mehr als 48 Stunden: Si vous le souhaitez, dites-nous en un mot que vous serez là. Votre rendez-vous reste réservé pour vous, même sans confirmation. [Oui, je viens] [Annuler le rendez-vous]
- Rückfrage vor Absage: Souhaitez-vous annuler votre rendez-vous ? Mercredi 7 octobre 2026, 08 h 00 [Annuler le rendez-vous] [Garder le rendez-vous]
- Offen, weniger als 48 Stunden: [Oui, je viens] Souhaitez-vous annuler ? Comme votre rendez-vous commence dans moins de 48 heures, écrivez-nous un petit mot sur WhatsApp. [Écrire sur WhatsApp]
- Nach Zusage: Merci ! Nous avons hâte de vous accueillir le mercredi 7 octobre à 08 h 00.
- Nach Absage: Votre rendez-vous est annulé. Au plaisir de vous voir une autre fois. [Réserver un nouveau rendez-vous]
- Bereits abgesagt: Votre rendez-vous est déjà annulé. Souhaitez-vous en trouver un nouveau ? [Réserver un nouveau rendez-vous]
- Termin vorbei: Le rendez-vous était le mercredi 7 octobre à 08 h 00. Souhaitez-vous en convenir un nouveau ? [Réserver un nouveau rendez-vous]
- Ungültiger Link: Ce lien ne peut pas être ouvert. Écrivez-nous un petit mot sur WhatsApp, nous vous aiderons volontiers. [Écrire sur WhatsApp]
- Testbetrieb (Mails): Mode test : ce message concerne une réservation de test.

### Bestätigungsseite der Buchung

Réservé ! Nous avons hâte de vous accueillir. / Tous les détails vous parviennent dans un instant par e-mail.

### Hinweiskasten im letzten Buchungsschritt

Du temps pour vous: Votre rendez-vous commence à l’heure, sans attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant. En cas d’imprévu : jusqu’à 48 heures avant, vous pouvez annuler via le lien de votre confirmation. Ensuite, écrivez-nous sur WhatsApp au +49 151 58872566.

## Português (pt)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (25 Zeichen): Marcado: qua. 7/10, 08:00

```
Olá Verena,

que bom que você vem nos ver! Esperamos por você:

Quarta-feira, 7 de outubro, 08:00 (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[Como chegar] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Seu tempo é importante para nós: na PALO SKIN, sua consulta começa pontualmente, sem espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes. Se chegar mais tarde, sobra menos tempo para a sua consulta, para que os próximos clientes também comecem no horário.

Reservamos tempo para vocês dois. (nur bei zu zweit)

Quer salvar a consulta no seu calendário agora mesmo?
[Google Agenda] [Calendário do iPhone] [Outlook]

No dia anterior, lembramos você mais uma vez.

Se surgir um imprevisto, você pode cancelar a consulta pelo link até 48 horas antes. Depois disso, fale conosco pelo WhatsApp no +49 151 58872566.
[Ver ou cancelar a consulta]

Até breve!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (20 Zeichen): Até amanhã às 08:00!

```
Olá Verena,

amanhã nos vemos na PALO SKIN. Esperamos por você!

Quarta-feira, 7 de outubro, 08:00 (fett)
Hagenauer Straße 14, 10435 Berlin
[Como chegar]

Sua consulta começa pontualmente, sem espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes.

Se quiser, dê um sinal rápido:
[Sim, eu vou]
Sua consulta continua reservada para você mesmo sem clicar.

Se surgir um imprevisto, fale conosco pelo WhatsApp no +49 151 58872566.
[Escrever pelo WhatsApp] (https://wa.me/4915158872566)

Até amanhã!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Consulta na PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Cancelamento até 48 horas antes pelo link da sua confirmação, depois pelo WhatsApp no +49 151 58872566. Como chegar: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8

### Terminseite

- Überschrift: Sua consulta
- Anrede: Olá Verena, aqui está a sua consulta na PALO SKIN:
- Kasten: Quarta-feira, 7 de outubro de 2026, 08:00, PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [Como chegar]
- Hinweis: Sua consulta começa pontualmente, sem espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes.
- Offen, mehr als 48 Stunden: Se quiser, avise rapidamente que você vem. Sua consulta continua reservada para você mesmo sem confirmação. [Sim, eu vou] [Cancelar consulta]
- Rückfrage vor Absage: Quer cancelar a sua consulta? Quarta-feira, 7 de outubro de 2026, 08:00 [Cancelar consulta] [Manter consulta]
- Offen, weniger als 48 Stunden: [Sim, eu vou] Quer cancelar? Como a sua consulta começa em menos de 48 horas, mande uma mensagem rápida pelo WhatsApp. [Escrever pelo WhatsApp]
- Nach Zusage: Obrigado! Esperamos por você em quarta-feira, 7 de outubro, às 08:00.
- Nach Absage: Sua consulta foi cancelada. Será um prazer ver você em outra ocasião. [Marcar uma nova consulta]
- Bereits abgesagt: Sua consulta já foi cancelada. Quer encontrar um novo horário? [Marcar uma nova consulta]
- Termin vorbei: A consulta foi em quarta-feira, 7 de outubro, às 08:00. Quer marcar uma nova? [Marcar uma nova consulta]
- Ungültiger Link: Este link não pode ser aberto. Mande uma mensagem rápida pelo WhatsApp, ajudamos com prazer. [Escrever pelo WhatsApp]
- Testbetrieb (Mails): Modo de teste: esta mensagem pertence a uma reserva de teste.

### Bestätigungsseite der Buchung

Marcado! Esperamos por você. / Todos os detalhes chegam já por e-mail.

### Hinweiskasten im letzten Buchungsschritt

Tempo para você: Sua consulta começa pontualmente, sem espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes. Se surgir um imprevisto: até 48 horas antes você pode cancelar pelo link da sua confirmação. Depois disso, fale conosco pelo WhatsApp no +49 151 58872566.
