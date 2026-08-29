import { explainWithLLM } from '../../lib/explainWithLLM';

/**
 * POST /api/explain
 *
 * Server-side API route — keeps the LLM API key on the server.
 * Takes schemeResult + optional emiDetails + language,
 * returns a natural language explanation.
 *
 * Body: { schemeResult, emiDetails?, language }
 * Response: { explanation: string, source: 'llm' | 'fallback' }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { schemeResult, emiDetails, language } = req.body;

  if (!schemeResult) {
    return res.status(400).json({ error: 'Missing schemeResult in request body.' });
  }

  try {
    const explanation = await explainWithLLM({
      schemeResult,
      emiDetails: emiDetails || null,
      language: language || 'en',
    });

    // Verify the LLM didn't hallucinate a completely wrong scheme.
    // Use key-term matching because in Hindi/Tamil the model writes the scheme
    // name in native script and the exact English string won't be present.
    let source = 'llm';
    if (schemeResult.eligible && schemeResult.scheme && explanation) {
      // Build a set of safe anchor words from the scheme name (e.g. "Micro", "Term", "Educational")
      const schemeAnchorWords = schemeResult.scheme.name
        .split(/[\s\/\-]+/)
        .filter((w) => w.length > 3); // ignore short filler words

      const explanationLower = explanation.toLowerCase();
      const hasAnyAnchor = schemeAnchorWords.some((w) =>
        explanationLower.includes(w.toLowerCase())
      );

      // Only fall back if the explanation is suspiciously short (< 20 chars) or completely blank
      const isTooShort = explanation.trim().length < 20;

      if (isTooShort) {
        console.warn('LLM output too short, using fallback');
        const fallback = `Based on your profile, you qualify for the ${schemeResult.scheme.name}. Loan up to ₹${schemeResult.loanAmount.toLocaleString('en-IN')} at ${schemeResult.scheme.interestRateMin}% interest.`;
        return res.status(200).json({ explanation: fallback, source: 'fallback' });
      }

      if (!hasAnyAnchor) {
        // Log a warning but still use the LLM output — it may be a valid non-English response
        console.warn('LLM output may not reference the scheme by name (possibly multilingual). Accepting anyway.');
      }
    }

    return res.status(200).json({ explanation, source });
  } catch (error) {
    console.error('API /explain error:', error);
    return res.status(500).json({
      error: 'Failed to generate explanation',
      explanation: schemeResult.reason?.message || 'Unable to generate explanation.',
      source: 'fallback',
    });
  }
}
