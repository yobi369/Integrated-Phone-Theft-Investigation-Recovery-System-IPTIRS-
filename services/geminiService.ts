/**
 * AI-assisted investigation is disabled.
 *
 * Do not generate or infer device coordinates, signal strength, suspects,
 * subscriber records, or investigative evidence. Any future AI feature must
 * be grounded in authorized source records and reviewed by a human.
 */
export async function processNaturalLanguageQuery(_query: string): Promise<never> {
  throw new Error(
    'AI-assisted investigation is disabled. IPTIRS has no verified device-location or telecommunications data feed.'
  );
}
