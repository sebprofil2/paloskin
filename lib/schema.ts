import { z } from "zod";
import { normalizePhoneE164 } from "./phone";
import { hasTreatment, ZONE_IDS, type Selection } from "./treatments";

/* Nur erlaubte Behandlungskennungen und Werte kommen durch. */
export const selectionSchema = z
  .object({
    persons: z.union([z.literal(1), z.literal(2)]).default(1),
    visit: z.enum(["first", "return"]).nullable(),
    checkup: z.boolean().default(false),
    beratung: z.boolean(),
    zones: z.array(z.enum(ZONE_IDS)).max(ZONE_IDS.length),
    otherZone: z.string().trim().max(80).nullable(),
    zonesUnknown: z.boolean().default(false),
    kaumuskel: z.boolean(),
    nefertiti: z.boolean(),
    achsel: z.boolean(),
    lachs: z.enum(["single", "pack"]).nullable(),
    note: z.string().max(600).default(""),
  })
  .strict()
  .superRefine((s, ctx) => {
    const sel = s as Selection;
    if (new Set(s.zones).size !== s.zones.length) ctx.addIssue({ code: "custom", message: "Zonen doppelt" });
    if (sel.checkup) {
      if (s.persons !== 1) ctx.addIssue({ code: "custom", message: "Kontrolltermin nur allein" });
      return;
    }
    if (!sel.visit) ctx.addIssue({ code: "custom", message: "Besuch fehlt" });
    if (sel.beratung && hasTreatment(sel)) ctx.addIssue({ code: "custom", message: "Beratung und Behandlung zugleich" });
    if (!sel.beratung && !hasTreatment(sel)) ctx.addIssue({ code: "custom", message: "Keine Behandlung gewählt" });
  });

/* Seitensprache (sieben) und Beratungssprache (fünf, Entscheidung 4. Oktober 2026), Listen aus lib/i18n.ts */
export const langSchema = z.enum(["de", "en", "es", "fr", "pt", "uk", "ar"]);
export const consultLangSchema = z.enum(["de", "en", "es", "fr", "pt"]);

export const slotsRequestSchema = z.object({
  selection: selectionSchema,
}).strict();

export const customerSchema = z.object({
  vorname: z.string().trim().min(1).max(60),
  nachname: z.string().trim().min(1).max(60),
  /* Handynummer in E.164; jede übliche Schreibweise wird angenommen, offensichtlich falsche abgewiesen */
  handy: z.string().trim().max(30).transform((v, ctx) => {
    const n = normalizePhoneE164(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Handynummer ungültig" });
      return z.NEVER;
    }
    return n;
  }),
  email: z.email().max(120),
}).strict();

export const bookRequestSchema = z.object({
  requestId: z.uuid(),
  selection: selectionSchema,
  start: z.iso.datetime({ offset: true }),
  lang: langSchema,
  /* Pflichtfeld: In welcher Sprache möchten Sie beraten werden? */
  consultationLanguage: consultLangSchema,
  customer: customerSchema,
  consent: z.literal(true),
  /* freiwillige Erinnerung per WhatsApp */
  reminder: z.boolean().default(false),
  /* Unsichtbares Lockfeld gegen Bots: muss leer bleiben */
  website: z.string().max(0).optional(),
}).strict();

export const referralSchema = z.object({
  requestId: z.uuid(),
  referral: z.string().trim().min(1).max(120),
}).strict();

export type BookRequest = z.infer<typeof bookRequestSchema>;
export type Customer = z.infer<typeof customerSchema>;
