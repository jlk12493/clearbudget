// Finance PWA — Cloudflare Worker
// Serves finance.html as static asset + proxies Claude API calls

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── CORS preflight ──────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // ── API: Claude goal suggestion ─────────────────────────────
    if (url.pathname === '/api/suggest' && request.method === 'POST') {
      try {
        const body = await request.json();

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            system: `You are a sharp, friendly personal finance advisor. 
You give concise, actionable advice based on the user's real numbers.
Never be preachy. Never use jargon without explaining it.
Always lead with the most important action first.
Format your response in 2-3 short paragraphs. No bullet points, no headers.
Keep it under 200 words.`,
            messages: [{ role: 'user', content: body.prompt }],
          }),
        });

        const data = await response.json();
        return new Response(
          JSON.stringify({ suggestion: data.content?.[0]?.text || '' }),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    // ── Static assets (finance.html, etc.) ─────────────────────
    return env.ASSETS.fetch(request);
  },
};
