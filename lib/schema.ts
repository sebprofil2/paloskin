import { z } from "zod";
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
  .superRefine((s, ctx) => {
    const sel = s as Selection;
    if (new Set(s.zones).size !== s.zones.length) ctx.addIssue({ code: "custom", message: "Zonen doppelt" });
    if (sel.checkup) return;
    if (!sel.visit) ctx.addIssue({ code: "custom", message: "Besuch fehlt" });
    if (sel.beratung && hasTreatment(sel)) ctx.addIssue({ code: "custom", message: "Beratung und Behandlung zugleich" });
    if (!sel.beratung && !hasTreatment(sel)) ctx.addIssue({ code: "custom", message: "Keine Behandlung gewählt" });
  });

export const langSchema = z.enum(["de", "en", "es", "fr", "pt"]);

export const slotsRequestSchema = z.object({
  selection: selectionSchema,
});

export const customerSchema = z.object({
  vorname: z.string().trim().min(1).max(60),
  nachname: z.string().trim().min(1).max(60),
  handy: z.string().trim().min(6).max(30),
  email: z.email().max(120),
});

export const bookRequestSchema = z.object({
  requestId: z.uuid(),
  selection: selectionSchema,
  start: z.iso.datetime({ offset: true }),
  lang: langSchema,
  customer: customerSchema,
  consent: z.literal(true),
  /* Unsichtbares Lockfeld gegen Bots: muss leer bleiben */
  website: z.string().max(0).optional(),
});

export const referralSchema = z.object({
  requestId: z.uuid(),
  referral: z.string().trim().min(1).max(120),
});

export type BookRequest = z.infer<typeof bookRequestSchema>;
export type Customer = z.infer<typeof customerSchema>;
