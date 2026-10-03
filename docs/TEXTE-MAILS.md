# Kundentexte: Bestätigungsmail, Erinnerungsmail, Kalenderdatei, Terminseite, Bestätigungsseite (fünf Sprachen)

Stand: 3. Oktober 2026, Gesamtauftrag abends (Freigabe Dr. Vogel). Deutsch wörtlich, die anderen Sprachen sinngemäß im selben Ton; Betreffzeilen höchstens 40 Zeichen mit Datum und Uhrzeit vorn. Erzeugt aus `lib/texts-mail.ts` und `lib/texts.ts` mit `scripts/texte-mails.mts`. Beispieltermin Mittwoch, 7. Oktober 2026, 08:00 Uhr (verschoben auf Donnerstag, 8. Oktober, 09:00 Uhr), Vorname Sebastian.

## Deutsch (de)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (35 Zeichen): Gebucht: Mittwoch, 7.10., 08:00 Uhr

```
Hallo Sebastian,

schön, dass Sie zu uns kommen! Wir freuen uns auf Sie:

Mittwoch, 7. Oktober, 08:00 Uhr (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[So finden Sie uns] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Ihre Zeit ist uns wichtig: Bei PALO SKIN beginnt Ihr Termin pünktlich, in der Regel ganz ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher. Falls Sie später kommen, bleibt entsprechend weniger Zeit für Ihren Termin, damit auch die nächsten Kunden pünktlich starten.

Für Sie beide haben wir Zeit eingeplant. (nur bei zu zweit)

Möchten Sie den Termin gleich im Kalender speichern?
[Google Kalender] [iPhone-Kalender] [Outlook]

Am Tag vorher erinnern wir Sie noch einmal. (nur wenn eine Erinnerung kommt)

Den Termin verschieben oder absagen können Sie bis 24 Stunden vorher über diesen Link. (nur wenn bei der Buchung mehr als 24 Stunden bleiben)
[Termin verschieben oder absagen] (immer)

Bis bald!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Mail nach dem Verschieben (wie die Bestätigung, drei Unterschiede)

Betreff (40 Zeichen): Verschoben: Donnerstag, 8.10., 09:00 Uhr
Erster Satz: Ihr Termin ist verschoben. Wir freuen uns auf Sie:
Nach den Kalender-Knöpfen: Falls Sie den alten Termin in Ihrem Kalender gespeichert haben, löschen Sie ihn bitte dort.

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (40 Zeichen): Bitte kurz bestätigen: morgen, 08:00 Uhr

```
Hallo Sebastian,

morgen sehen wir uns bei PALO SKIN, wir freuen uns auf Sie!

Mittwoch, 7. Oktober, 08:00 Uhr (fett)
Hagenauer Straße 14, 10435 Berlin
[So finden Sie uns]

Passt der Termin weiterhin für Sie? Dann bestätigen Sie bitte kurz mit einem Klick:
[Ja, ich komme]
Passt es doch nicht? Dann verschieben Sie den Termin hier: [Termin verschieben]

Ihr Termin beginnt pünktlich, in der Regel ganz ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher.

Bis morgen!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Termin bei PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Termin ansehen, verschieben oder absagen (bis 24 Stunden vorher): / <persönlicher Link https://www.paloskin.de/termin/...> / So finden Sie uns: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8
Erinnerung: 1 Stunde vorher (nur Kalenderdatei; Google und Outlook nehmen die eigene Standarderinnerung)

### Terminseite

- Überschrift: Ihr Termin
- Anrede: Hallo Sebastian, hier finden Sie Ihren Termin bei PALO SKIN:
- Kasten: Mittwoch, 7. Oktober, 08:00 Uhr (fett), PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [So finden Sie uns]
- Hinweis: Ihr Termin beginnt pünktlich, in der Regel ganz ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher.
- Zusage: Passt der Termin weiterhin für Sie? Dann bestätigen Sie bitte kurz mit einem Klick: [Ja, ich komme]
- Mehr als 24 Stunden: Den Termin verschieben oder absagen können Sie bis 24 Stunden vorher. [Termin verschieben] [Termin absagen]
- 24 bis 2 Stunden: Sie können nicht kommen? Bitte sagen Sie uns kurz Bescheid, dann können wir die Zeit noch vergeben. [Termin verschieben] [Leider verhindert]
- Weniger als 2 Stunden: kein Satz, keine Knöpfe
- Nach Zusage: Danke! Wir freuen uns auf Sie am Mittwoch, 7. Oktober, um 08:00 Uhr.
- Rückfrage vor Absage: Möchten Sie Ihren Termin absagen? Mittwoch, 7. Oktober, 08:00 Uhr [Termin absagen] [Termin behalten] Oder lieber verschieben? [Termin verschieben]
- Nach Absage: Ihr Termin ist abgesagt. Wir freuen uns, Sie ein anderes Mal zu sehen. [Neuen Termin buchen]
- Bereits abgesagt: Ihr Termin ist bereits abgesagt. Möchten Sie einen neuen Termin finden? [Neuen Termin buchen]
- Termin vorbei: Der Termin war am Mittwoch, 7. Oktober, um 08:00 Uhr. Möchten Sie einen neuen Termin vereinbaren? [Neuen Termin buchen]
- Ungültiger Link: Dieser Link lässt sich nicht öffnen. Schreiben Sie uns kurz per WhatsApp, wir helfen Ihnen gern weiter. [Per WhatsApp schreiben]

### Verschieben

- Überschrift: Neue Zeit wählen
- Ihr bisheriger Termin: Mittwoch, 7. Oktober, 08:00 Uhr. Er bleibt für Sie reserviert, bis Sie eine neue Zeit gewählt haben.
- Knopf: Auf Donnerstag, 8. Oktober, 09:00 Uhr verschieben
- Danach: Verschoben! Ihr neuer Termin: Donnerstag, 8. Oktober, 09:00 Uhr. Die neue Bestätigung kommt gleich per E-Mail. Möchten Sie den Termin gleich im Kalender speichern? [Google Kalender] [iPhone-Kalender] [Outlook] Falls Sie den alten Termin in Ihrem Kalender gespeichert haben, löschen Sie ihn bitte dort.
- Zeit vergeben: Diese Zeit ist leider gerade vergeben worden. Bitte wählen Sie eine andere.

### Bestätigungsseite der Buchung

Gebucht! Wir freuen uns auf Sie. / Alle Details bekommen Sie gleich per E-Mail. / So finden Sie uns / Möchten Sie den Termin gleich im Kalender speichern? / Hat Ihnen jemand PALO SKIN empfohlen?

### Hinweiskasten „Zeit für Sie“

Zeit für Sie: Ihr Termin beginnt pünktlich, in der Regel ganz ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher. Den Termin verschieben oder absagen können Sie bis 24 Stunden vorher über den Link in Ihrer Terminbestätigung.

### Terminauswahl

- Unter den Uhrzeiten: Kein passender Termin dabei? Schreiben Sie uns gern per WhatsApp.
- Nicht mehr buchbar: Dieser Termin ist online leider nicht mehr buchbar. Bitte wählen Sie eine andere Zeit oder schreiben Sie uns per WhatsApp. [Andere Zeit wählen]

## English (en)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (35 Zeichen): Booked: Wednesday, 7 October, 08:00

```
Hello Sebastian,

lovely that you’re coming to see us! We look forward to seeing you:

Wednesday 7 October, 08:00 (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[How to find us] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Your time matters to us: at PALO SKIN, your appointment starts on time, usually with no waiting at all. Please arrive at the agreed time or at most five minutes early. If you arrive later, there is correspondingly less time for your appointment, so the next clients can also start on time.

We have planned time for both of you. (nur bei zu zweit)

Would you like to save the appointment to your calendar right away?
[Google Calendar] [iPhone Calendar] [Outlook]

We’ll remind you once more the day before. (nur wenn eine Erinnerung kommt)

You can reschedule or cancel the appointment up to 24 hours in advance via this link. (nur wenn bei der Buchung mehr als 24 Stunden bleiben)
[Reschedule or cancel appointment] (immer)

See you soon!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Mail nach dem Verschieben (wie die Bestätigung, drei Unterschiede)

Betreff (39 Zeichen): Rescheduled: Thursday, 8 October, 09:00
Erster Satz: Your appointment has been rescheduled. We look forward to seeing you:
Nach den Kalender-Knöpfen: If you saved the previous appointment in your calendar, please delete it there.

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (31 Zeichen): Please confirm: tomorrow, 08:00

```
Hello Sebastian,

we’ll see you tomorrow at PALO SKIN, we look forward to seeing you!

Wednesday 7 October, 08:00 (fett)
Hagenauer Straße 14, 10435 Berlin
[How to find us]

Does the appointment still suit you? Then please confirm briefly with one click:
[Yes, I’ll be there]
Doesn’t suit you after all? Then reschedule the appointment here: [Reschedule appointment]

Your appointment starts on time, usually with no waiting at all. Please arrive at the agreed time or at most five minutes early.

See you tomorrow!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Appointment at PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: View, reschedule or cancel your appointment (up to 24 hours in advance): / <persönlicher Link https://www.paloskin.de/termin/...> / How to find us: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8
Erinnerung: 1 Stunde vorher (nur Kalenderdatei; Google und Outlook nehmen die eigene Standarderinnerung)

### Terminseite

- Überschrift: Your appointment
- Anrede: Hello Sebastian, here is your appointment at PALO SKIN:
- Kasten: Wednesday 7 October, 08:00 (fett), PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [How to find us]
- Hinweis: Your appointment starts on time, usually with no waiting at all. Please arrive at the agreed time or at most five minutes early.
- Zusage: Does the appointment still suit you? Then please confirm briefly with one click: [Yes, I’ll be there]
- Mehr als 24 Stunden: You can reschedule or cancel the appointment up to 24 hours in advance. [Reschedule appointment] [Cancel appointment]
- 24 bis 2 Stunden: Can’t make it? Please let us know briefly so we can still give the time to someone else. [Reschedule appointment] [Unable to come]
- Weniger als 2 Stunden: kein Satz, keine Knöpfe
- Nach Zusage: Thank you! We look forward to seeing you on Wednesday 7 October at 08:00.
- Rückfrage vor Absage: Would you like to cancel your appointment? Wednesday 7 October, 08:00 [Cancel appointment] [Keep appointment] Or would you rather reschedule? [Reschedule appointment]
- Nach Absage: Your appointment is cancelled. We look forward to seeing you another time. [Book a new appointment]
- Bereits abgesagt: Your appointment has already been cancelled. Would you like to find a new one? [Book a new appointment]
- Termin vorbei: The appointment was on Wednesday 7 October at 08:00. Would you like to arrange a new one? [Book a new appointment]
- Ungültiger Link: This link cannot be opened. Send us a quick WhatsApp message and we’ll be happy to help. [Message us on WhatsApp]

### Verschieben

- Überschrift: Choose a new time
- Your current appointment: Wednesday 7 October, 08:00. It stays reserved for you until you have chosen a new time.
- Knopf: Move to Thursday 8 October, 09:00
- Danach: Rescheduled! Your new appointment: Thursday 8 October, 09:00. The new confirmation will reach you by email in a moment. Would you like to save the appointment to your calendar right away? [Google Calendar] [iPhone Calendar] [Outlook] If you saved the previous appointment in your calendar, please delete it there.
- Zeit vergeben: Unfortunately this time has just been taken. Please choose another.

### Bestätigungsseite der Buchung

Booked! We look forward to seeing you. / All the details will reach you by email in a moment. / How to find us / Would you like to save the appointment to your calendar right away? / Did someone recommend PALO SKIN to you?

### Hinweiskasten „Zeit für Sie“

Time for you: Your appointment starts on time, usually with no waiting at all. Please arrive at the agreed time or at most five minutes early. You can reschedule or cancel the appointment up to 24 hours in advance via the link in your confirmation.

### Terminauswahl

- Unter den Uhrzeiten: No suitable time? Feel free to message us on WhatsApp.
- Nicht mehr buchbar: Unfortunately this appointment can no longer be booked online. Please choose another time or message us on WhatsApp. [Choose another time]

## Español (es)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (35 Zeichen): Reservado: miércoles, 7/10, 08:00 h

```
Hola Sebastian,

¡qué bien que venga a vernos! Le esperamos:

Miércoles, 7 de octubre, 08:00 h (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[Cómo llegar] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Su tiempo es importante para nosotros: en PALO SKIN su cita empieza puntual, por lo general sin ninguna espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes. Si llega más tarde, quedará menos tiempo para su cita, para que los siguientes clientes también empiecen puntuales.

Hemos reservado tiempo para los dos. (nur bei zu zweit)

¿Quiere guardar la cita en su calendario ahora mismo?
[Google Calendar] [Calendario del iPhone] [Outlook]

El día anterior se lo recordamos una vez más. (nur wenn eine Erinnerung kommt)

Puede cambiar o cancelar la cita hasta 24 horas antes a través de este enlace. (nur wenn bei der Buchung mehr als 24 Stunden bleiben)
[Cambiar o cancelar la cita] (immer)

¡Hasta pronto!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Mail nach dem Verschieben (wie die Bestätigung, drei Unterschiede)

Betreff (31 Zeichen): Cambiado: jueves, 8/10, 09:00 h
Erster Satz: Su cita ha sido cambiada. Le esperamos:
Nach den Kalender-Knöpfen: Si guardó la cita anterior en su calendario, elimínela allí, por favor.

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (36 Zeichen): Por favor, confirme: mañana, 08:00 h

```
Hola Sebastian,

mañana nos vemos en PALO SKIN, ¡le esperamos!

Miércoles, 7 de octubre, 08:00 h (fett)
Hagenauer Straße 14, 10435 Berlin
[Cómo llegar]

¿La cita le sigue viniendo bien? Entonces confírmela brevemente con un clic:
[Sí, voy a ir]
¿Al final no le viene bien? Cambie la cita aquí: [Cambiar la cita]

Su cita empieza puntual, por lo general sin ninguna espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes.

¡Hasta mañana!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Cita en PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Ver, cambiar o cancelar su cita (hasta 24 horas antes): / <persönlicher Link https://www.paloskin.de/termin/...> / Cómo llegar: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8
Erinnerung: 1 Stunde vorher (nur Kalenderdatei; Google und Outlook nehmen die eigene Standarderinnerung)

### Terminseite

- Überschrift: Su cita
- Anrede: Hola Sebastian, aquí tiene su cita en PALO SKIN:
- Kasten: Miércoles, 7 de octubre, 08:00 h (fett), PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [Cómo llegar]
- Hinweis: Su cita empieza puntual, por lo general sin ninguna espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes.
- Zusage: ¿La cita le sigue viniendo bien? Entonces confírmela brevemente con un clic: [Sí, voy a ir]
- Mehr als 24 Stunden: Puede cambiar o cancelar la cita hasta 24 horas antes. [Cambiar la cita] [Cancelar la cita]
- 24 bis 2 Stunden: ¿No puede venir? Avísenos brevemente, así aún podemos dar la hora a otra persona. [Cambiar la cita] [No puedo ir]
- Weniger als 2 Stunden: kein Satz, keine Knöpfe
- Nach Zusage: ¡Gracias! Le esperamos el miércoles, 7 de octubre a las 08:00 h.
- Rückfrage vor Absage: ¿Quiere cancelar su cita? Miércoles, 7 de octubre, 08:00 h [Cancelar la cita] [Mantener la cita] ¿O prefiere cambiarla? [Cambiar la cita]
- Nach Absage: Su cita queda cancelada. Nos alegrará verle en otra ocasión. [Reservar una nueva cita]
- Bereits abgesagt: Su cita ya está cancelada. ¿Quiere buscar una nueva? [Reservar una nueva cita]
- Termin vorbei: La cita fue el miércoles, 7 de octubre a las 08:00 h. ¿Quiere concertar una nueva? [Reservar una nueva cita]
- Ungültiger Link: Este enlace no se puede abrir. Escríbanos un momento por WhatsApp, le ayudamos con gusto. [Escribir por WhatsApp]

### Verschieben

- Überschrift: Elegir una nueva hora
- Su cita actual: Miércoles, 7 de octubre, 08:00 h. Queda reservada para usted hasta que elija una nueva hora.
- Knopf: Cambiar al Jueves, 8 de octubre, 09:00 h
- Danach: ¡Cambiada! Su nueva cita: Jueves, 8 de octubre, 09:00 h. La nueva confirmación le llega enseguida por correo electrónico. ¿Quiere guardar la cita en su calendario ahora mismo? [Google Calendar] [Calendario del iPhone] [Outlook] Si guardó la cita anterior en su calendario, elimínela allí, por favor.
- Zeit vergeben: Lamentablemente esta hora acaba de ocuparse. Elija otra, por favor.

### Bestätigungsseite der Buchung

¡Reservado! Le esperamos. / Todos los detalles le llegan enseguida por correo electrónico. / Cómo llegar / ¿Quiere guardar la cita en su calendario ahora mismo? / ¿Alguien le ha recomendado PALO SKIN?

### Hinweiskasten „Zeit für Sie“

Tiempo para usted: Su cita empieza puntual, por lo general sin ninguna espera. Venga, por favor, a la hora acordada o como máximo cinco minutos antes. Puede cambiar o cancelar la cita hasta 24 horas antes a través del enlace de su confirmación.

### Terminauswahl

- Unter den Uhrzeiten: ¿Ninguna hora le viene bien? Escríbanos con gusto por WhatsApp.
- Nicht mehr buchbar: Lamentablemente esta cita ya no se puede reservar en línea. Elija otra hora o escríbanos por WhatsApp. [Elegir otra hora]

## Français (fr)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (32 Zeichen): Réservé : mercredi 7/10, 08 h 00

```
Bonjour Sebastian,

quel plaisir de vous accueillir ! Nous avons hâte de vous voir :

Mercredi 7 octobre, 08 h 00 (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[Comment nous trouver] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Votre temps nous est précieux : chez PALO SKIN, votre rendez-vous commence à l’heure, en général sans aucune attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant. Si vous arrivez plus tard, il restera d’autant moins de temps pour votre rendez-vous, afin que les clients suivants commencent eux aussi à l’heure.

Nous avons prévu du temps pour vous deux. (nur bei zu zweit)

Souhaitez-vous enregistrer le rendez-vous tout de suite dans votre agenda ?
[Google Agenda] [Calendrier iPhone] [Outlook]

La veille, nous vous enverrons un rappel. (nur wenn eine Erinnerung kommt)

Vous pouvez déplacer ou annuler le rendez-vous jusqu’à 24 heures avant via ce lien. (nur wenn bei der Buchung mehr als 24 Stunden bleiben)
[Déplacer ou annuler le rendez-vous] (immer)

À bientôt !
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Mail nach dem Verschieben (wie die Bestätigung, drei Unterschiede)

Betreff (29 Zeichen): Déplacé : jeudi 8/10, 09 h 00
Erster Satz: Votre rendez-vous a été déplacé. Nous avons hâte de vous voir :
Nach den Kalender-Knöpfen: Si vous aviez enregistré l’ancien rendez-vous dans votre agenda, merci de l’y supprimer.

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (36 Zeichen): Merci de confirmer : demain, 08 h 00

```
Bonjour Sebastian,

nous nous voyons demain chez PALO SKIN, nous avons hâte de vous accueillir !

Mercredi 7 octobre, 08 h 00 (fett)
Hagenauer Straße 14, 10435 Berlin
[Comment nous trouver]

Le rendez-vous vous convient toujours ? Alors confirmez-le en un clic :
[Oui, je viens]
Cela ne convient finalement pas ? Déplacez le rendez-vous ici : [Déplacer le rendez-vous]

Votre rendez-vous commence à l’heure, en général sans aucune attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant.

À demain !
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Rendez-vous chez PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Voir, déplacer ou annuler votre rendez-vous (jusqu’à 24 heures avant) : / <persönlicher Link https://www.paloskin.de/termin/...> / Comment nous trouver : https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8
Erinnerung: 1 Stunde vorher (nur Kalenderdatei; Google und Outlook nehmen die eigene Standarderinnerung)

### Terminseite

- Überschrift: Votre rendez-vous
- Anrede: Bonjour Sebastian, voici votre rendez-vous chez PALO SKIN :
- Kasten: Mercredi 7 octobre, 08 h 00 (fett), PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [Comment nous trouver]
- Hinweis: Votre rendez-vous commence à l’heure, en général sans aucune attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant.
- Zusage: Le rendez-vous vous convient toujours ? Alors confirmez-le en un clic : [Oui, je viens]
- Mehr als 24 Stunden: Vous pouvez déplacer ou annuler le rendez-vous jusqu’à 24 heures avant. [Déplacer le rendez-vous] [Annuler le rendez-vous]
- 24 bis 2 Stunden: Vous ne pouvez pas venir ? Dites-le-nous en un mot, nous pourrons encore proposer le créneau à quelqu’un d’autre. [Déplacer le rendez-vous] [Empêchement]
- Weniger als 2 Stunden: kein Satz, keine Knöpfe
- Nach Zusage: Merci ! Nous avons hâte de vous accueillir le mercredi 7 octobre à 08 h 00.
- Rückfrage vor Absage: Souhaitez-vous annuler votre rendez-vous ? Mercredi 7 octobre, 08 h 00 [Annuler le rendez-vous] [Garder le rendez-vous] Ou plutôt le déplacer ? [Déplacer le rendez-vous]
- Nach Absage: Votre rendez-vous est annulé. Au plaisir de vous voir une autre fois. [Réserver un nouveau rendez-vous]
- Bereits abgesagt: Votre rendez-vous est déjà annulé. Souhaitez-vous en trouver un nouveau ? [Réserver un nouveau rendez-vous]
- Termin vorbei: Le rendez-vous était le mercredi 7 octobre à 08 h 00. Souhaitez-vous en convenir un nouveau ? [Réserver un nouveau rendez-vous]
- Ungültiger Link: Ce lien ne peut pas être ouvert. Écrivez-nous un petit mot sur WhatsApp, nous vous aiderons volontiers. [Écrire sur WhatsApp]

### Verschieben

- Überschrift: Choisir un nouveau créneau
- Votre rendez-vous actuel : Mercredi 7 octobre, 08 h 00. Il reste réservé pour vous jusqu’à ce que vous ayez choisi un nouveau créneau.
- Knopf: Déplacer au Jeudi 8 octobre, 09 h 00
- Danach: Déplacé ! Votre nouveau rendez-vous : Jeudi 8 octobre, 09 h 00. La nouvelle confirmation arrive dans un instant par e-mail. Souhaitez-vous enregistrer le rendez-vous tout de suite dans votre agenda ? [Google Agenda] [Calendrier iPhone] [Outlook] Si vous aviez enregistré l’ancien rendez-vous dans votre agenda, merci de l’y supprimer.
- Zeit vergeben: Ce créneau vient malheureusement d’être pris. Merci d’en choisir un autre.

### Bestätigungsseite der Buchung

Réservé ! Nous avons hâte de vous accueillir. / Tous les détails vous parviennent dans un instant par e-mail. / Comment nous trouver / Souhaitez-vous enregistrer le rendez-vous tout de suite dans votre agenda ? / Quelqu’un vous a-t-il recommandé PALO SKIN ?

### Hinweiskasten „Zeit für Sie“

Du temps pour vous: Votre rendez-vous commence à l’heure, en général sans aucune attente. Merci de venir à l’heure convenue ou au plus cinq minutes avant. Vous pouvez déplacer ou annuler le rendez-vous jusqu’à 24 heures avant via le lien de votre confirmation.

### Terminauswahl

- Unter den Uhrzeiten: Aucun créneau ne vous convient ? Écrivez-nous volontiers sur WhatsApp.
- Nicht mehr buchbar: Ce rendez-vous ne peut malheureusement plus être réservé en ligne. Choisissez un autre créneau ou écrivez-nous sur WhatsApp. [Choisir un autre créneau]

## Português (pt)

### Bestätigungsmail

Absender: PALO SKIN by Dr. Vogel <bookings@paloskin.de>, Antwort an bookings@paloskin.de
Betreff (34 Zeichen): Marcado: quarta-feira, 7/10, 08:00

```
Olá Sebastian,

que bom que você vem nos ver! Esperamos por você:

Quarta-feira, 7 de outubro, 08:00 (fett)
PALO SKIN by Dr. Vogel
Hagenauer Straße 14, 10435 Berlin
[Como chegar] (https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8)

Seu tempo é importante para nós: na PALO SKIN, sua consulta começa pontualmente, em geral sem nenhuma espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes. Se chegar mais tarde, sobra menos tempo para a sua consulta, para que os próximos clientes também comecem no horário.

Reservamos tempo para vocês dois. (nur bei zu zweit)

Quer salvar a consulta no seu calendário agora mesmo?
[Google Agenda] [Calendário do iPhone] [Outlook]

No dia anterior, lembramos você mais uma vez. (nur wenn eine Erinnerung kommt)

Você pode remarcar ou cancelar a consulta até 24 horas antes por este link. (nur wenn bei der Buchung mehr als 24 Stunden bleiben)
[Remarcar ou cancelar a consulta] (immer)

Até breve!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Mail nach dem Verschieben (wie die Bestätigung, drei Unterschiede)

Betreff (36 Zeichen): Remarcado: quinta-feira, 8/10, 09:00
Erster Satz: Sua consulta foi remarcada. Esperamos por você:
Nach den Kalender-Knöpfen: Se você salvou a consulta anterior no seu calendário, apague-a lá, por favor.

### Erinnerungsmail (Vortag 10:00 Uhr)

Betreff (34 Zeichen): Confirme, por favor: amanhã, 08:00

```
Olá Sebastian,

amanhã nos vemos na PALO SKIN, esperamos por você!

Quarta-feira, 7 de outubro, 08:00 (fett)
Hagenauer Straße 14, 10435 Berlin
[Como chegar]

A consulta continua boa para você? Então confirme rapidamente com um clique:
[Sim, eu vou]
No fim não dá certo? Então remarque a consulta aqui: [Remarcar a consulta]

Sua consulta começa pontualmente, em geral sem nenhuma espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes.

Até amanhã!
Dr. med. Sebastian Vogel
PALO SKIN by Dr. Vogel
```

### Kalenderdatei und Kalender-Knöpfe

Titel: Consulta na PALO SKIN
Ort: PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin
Beschreibung: Ver, remarcar ou cancelar sua consulta (até 24 horas antes): / <persönlicher Link https://www.paloskin.de/termin/...> / Como chegar: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8
Erinnerung: 1 Stunde vorher (nur Kalenderdatei; Google und Outlook nehmen die eigene Standarderinnerung)

### Terminseite

- Überschrift: Sua consulta
- Anrede: Olá Sebastian, aqui está a sua consulta na PALO SKIN:
- Kasten: Quarta-feira, 7 de outubro, 08:00 (fett), PALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin, [Como chegar]
- Hinweis: Sua consulta começa pontualmente, em geral sem nenhuma espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes.
- Zusage: A consulta continua boa para você? Então confirme rapidamente com um clique: [Sim, eu vou]
- Mehr als 24 Stunden: Você pode remarcar ou cancelar a consulta até 24 horas antes. [Remarcar a consulta] [Cancelar a consulta]
- 24 bis 2 Stunden: Não vai conseguir vir? Avise rapidamente, assim ainda podemos oferecer o horário a outra pessoa. [Remarcar a consulta] [Não consigo ir]
- Weniger als 2 Stunden: kein Satz, keine Knöpfe
- Nach Zusage: Obrigado! Esperamos por você em quarta-feira, 7 de outubro, às 08:00.
- Rückfrage vor Absage: Quer cancelar a sua consulta? Quarta-feira, 7 de outubro, 08:00 [Cancelar a consulta] [Manter a consulta] Ou prefere remarcar? [Remarcar a consulta]
- Nach Absage: Sua consulta foi cancelada. Será um prazer ver você em outra ocasião. [Marcar uma nova consulta]
- Bereits abgesagt: Sua consulta já foi cancelada. Quer encontrar um novo horário? [Marcar uma nova consulta]
- Termin vorbei: A consulta foi em quarta-feira, 7 de outubro, às 08:00. Quer marcar uma nova? [Marcar uma nova consulta]
- Ungültiger Link: Este link não pode ser aberto. Mande uma mensagem rápida pelo WhatsApp, ajudamos com prazer. [Escrever pelo WhatsApp]

### Verschieben

- Überschrift: Escolher um novo horário
- Sua consulta atual: Quarta-feira, 7 de outubro, 08:00. Ela continua reservada para você até você escolher um novo horário.
- Knopf: Remarcar para Quinta-feira, 8 de outubro, 09:00
- Danach: Remarcado! Sua nova consulta: Quinta-feira, 8 de outubro, 09:00. A nova confirmação chega já por e-mail. Quer salvar a consulta no seu calendário agora mesmo? [Google Agenda] [Calendário do iPhone] [Outlook] Se você salvou a consulta anterior no seu calendário, apague-a lá, por favor.
- Zeit vergeben: Infelizmente este horário acabou de ser ocupado. Escolha outro, por favor.

### Bestätigungsseite der Buchung

Marcado! Esperamos por você. / Todos os detalhes chegam já por e-mail. / Como chegar / Quer salvar a consulta no seu calendário agora mesmo? / Alguém recomendou a PALO SKIN para você?

### Hinweiskasten „Zeit für Sie“

Tempo para você: Sua consulta começa pontualmente, em geral sem nenhuma espera. Por favor, chegue na hora combinada ou no máximo cinco minutos antes. Você pode remarcar ou cancelar a consulta até 24 horas antes pelo link da sua confirmação.

### Terminauswahl

- Unter den Uhrzeiten: Nenhum horário serve? Fale conosco pelo WhatsApp.
- Nicht mehr buchbar: Infelizmente, esta consulta não pode mais ser marcada online. Escolha outro horário ou fale conosco pelo WhatsApp. [Escolher outro horário]
