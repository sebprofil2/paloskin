import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { readEnv } from "./env";
import { isTestInstance } from "./instance";

/** Testinstanz: nur an die Umleitungsadresse, Betreff mit „[TEST]“. Fehlt die Umleitung, wird nichts gesendet. */
function guardTest(message: MailMessage): MailMessage {
  if (!isTestInstance()) return message;
  const to = readEnv().mail.redirectTo;
  if (!to) throw Object.assign(new Error("Testinstanz ohne MAIL_REDIRECT_TO: Versand verweigert"), { code: "TEST_NO_REDIRECT" });
  // Die blaue Kugel der Kundenmails bleibt vorn; „[TEST]“ kommt dahinter, wenn noch kein Testvermerk da ist
  const parts = /^(\u{1F535} )?([\s\S]*)$/u.exec(message.subject)!;
  const kugel = parts[1] ?? "";
  const rest = parts[2];
  const subject = /^(\[TEST\]|TEST:)/.test(rest) ? message.subject : `${kugel}[TEST] ${rest}`;
  return { ...message, to, subject };
}

/*
 * Versand über den SMTP-Relay von Google Workspace (smtp-relay.gmail.com, Port 587, STARTTLS, ohne Anmeldung;
 * die Server-Adresse ist in der Admin-Konsole freigegeben). Kein Passwort auf dem Server.
 * Betriebsarten: relay (Server), file (Entwicklung: Datei neben der Datenbank), off.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  ics?: { filename: string; content: string };
}

export interface Mailer {
  readonly enabled: boolean;
  send(message: MailMessage): Promise<void>;
}

/** Fehlerklasse ohne Inhalt: SMTP-Code oder nodemailer-Kennung, nie die Antwort mit Adressen. */
export function mailErrorClass(e: unknown): string {
  const err = e as { code?: string; responseCode?: number; name?: string } | null;
  if (!err) return "unknown";
  if (err.responseCode) return `smtp_${err.responseCode}`;
  return err.code || err.name || "Error";
}

class RelayMailer implements Mailer {
  readonly enabled = true;
  private transport: Transporter | null = null;

  private client(): Transporter {
    if (!this.transport) {
      const m = readEnv().mail;
      this.transport = nodemailer.createTransport({
        host: m.host,
        port: m.port,
        secure: false,
        requireTLS: true,
        name: "paloskin-1.paloskin.de",
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        tls: { servername: m.host, minVersion: "TLSv1.2" },
      });
    }
    return this.transport;
  }

  async send(original: MailMessage): Promise<void> {
    const message = guardTest(original);
    const m = readEnv().mail;
    await this.client().sendMail({
      from: { name: m.fromName, address: m.from },
      to: m.redirectTo || message.to,
      replyTo: m.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.ics
        ? [{ filename: message.ics.filename, content: message.ics.content, contentType: "text/calendar; charset=utf-8; method=PUBLISH" }]
        : [],
    });
  }
}

/** Entwicklung: jede Mail als Textdatei unter <Datenbankordner>/mail, nichts geht raus. */
class FileMailer implements Mailer {
  readonly enabled = true;
  async send(original: MailMessage): Promise<void> {
    const message = guardTest(original);
    const env = readEnv();
    const dir = join(dirname(env.dbPath), "mail");
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const name = `${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    const body = [`To: ${env.mail.redirectTo || message.to}`, `Subject: ${message.subject}`, "", message.text, "", "----- HTML -----", message.html, ...(message.ics ? ["", "----- ICS -----", message.ics.content] : [])].join("\n");
    writeFileSync(join(dir, name), body, { mode: 0o600 });
  }
}

class NoMailer implements Mailer {
  readonly enabled = false;
  async send(): Promise<void> {
    /* nichts */
  }
}

let instance: Mailer | null = null;
let instanceMode = "";

export function getMailer(): Mailer {
  const mode = readEnv().mail.mode;
  if (!instance || instanceMode !== mode) {
    instance = mode === "relay" ? new RelayMailer() : mode === "file" ? new FileMailer() : new NoMailer();
    instanceMode = mode;
  }
  return instance;
}
