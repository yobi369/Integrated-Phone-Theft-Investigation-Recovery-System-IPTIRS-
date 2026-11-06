import { TacticalResponse } from "../types";

/**
 * AI assistance is intentionally disabled in this prototype.
 *
 * The previous implementation instructed a language model to invent device
 * coordinates, signal strength, suspects, and access to telecom databases.
 * Those outputs could be mistaken for investigative evidence. Re-enable an
 * AI feature only after a documented privacy/security review and a grounded,
 * source-cited, human-reviewed design is approved.
 */
export const processNaturalLanguageQuery = async (_query: string): Promise<TacticalResponse> => {
  throw new Error(
    "AI-assisted investigation is disabled. IPTIRS does not have verified access to device-location or telecommunications data."
  );
};
