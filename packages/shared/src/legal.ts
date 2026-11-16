/* Legal document versions. Bump a version when a document's substance
   changes; accounts are asked to accept the new version and each acceptance
   is recorded with its time. All texts are drafts pending qualified review. */
export const legalDocuments = {
  terms: "2026-11-draft",
  privacy: "2026-11-phase3-draft",
  refunds: "2026-11-draft",
  content: "2026-11-phase3-draft",
  "acceptable-use": "2026-11-draft",
  copyright: "2026-11-phase3-draft",
} as const;
export type LegalDocument = keyof typeof legalDocuments;
/** Documents an account must accept to register and keep using the studio. */
export const requiredConsents: LegalDocument[] = ["terms", "privacy"];
