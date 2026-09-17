// Free-text salutation values (from CSV imports especially) → the canonical
// German "Herr"/"Frau" that lib/campaign-email.ts's buildSalutation() checks
// for regardless of campaign language — so "Mr."/"Monsieur"/"Madame" etc. all
// still produce a correctly gendered greeting instead of silently falling
// back to the neutral "Liebe/-r".
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

const ANREDE_VALUE_ALIASES: Record<string, string> = {
  herr: "Herr", mr: "Herr", monsieur: "Herr", m: "Herr",
  frau: "Frau", fraulein: "Frau", mrs: "Frau", ms: "Frau", miss: "Frau",
  madame: "Frau", mademoiselle: "Frau", mme: "Frau", mlle: "Frau",
  // dr, prof, mx, divers, etc.: gender-neutral or unknown — left as-is below,
  // buildSalutation() already falls back gracefully to a neutral greeting.
};

export function normalizeAnrede(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return ANREDE_VALUE_ALIASES[norm(trimmed)] ?? trimmed;
}
