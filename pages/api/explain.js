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

    // Verify the LLM didn't hallucinate the scheme name
    let source = 'llm';
    if (schemeResult.eligible && schemeResult.scheme) {
      if (!explanation.includes(schemeResult.scheme.name)) {
        // LLM changed the scheme name — reject and use fallback
        console.warn('LLM output did not contain correct scheme name, using fallback');
        const fallback = `Based on your profile, you qualify for the ${schemeResult.scheme.name}. Loan up to ₹${schemeResult.loanAmount.toLocaleString('en-IN')} at ${schemeResult.scheme.interestRateMin}% interest.`;
        return res.status(200).json({ explanation: fallback, source: 'fallback' });
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
