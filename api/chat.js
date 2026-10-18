// Vercel serverless backend for CalcTutor, using Google Gemini (free tier).

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

function send(res, status, body) {
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(body);
}

function systemPrompt(mode) {
  return `You are CalcTutor, a rigorous AI tutor for a school student preparing for JEE Main, JEE Advanced and mathematics/science olympiads. Current mode: ${mode}. Explain clearly, step by step, and check your work.`;
}

function lastUserMessage(messages) {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i] && messages[i].role === 'user') return String(messages[i].content || '');
  }
  return '';
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send(res, 500, { error: 'GEMINI_API_KEY is not set in Vercel.' });

  const body = req.body || {};
  const mode = body.mode || 'tutor';
  const message = body.message || body.prompt || body.question || lastUserMessage(body.messages);
  if (!message) return send(res, 400, { error: 'No message received.' });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt(mode) }] },
          contents: [{ role: 'user', parts: [{ text: String(message) }] }]
        })
      }
    );
    const data = await r.json();
    if (!r.ok) {
      return send(res, r.status, { error: data.error?.message || 'Gemini request failed.' });
    }
    const reply = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    if (!reply) return send(res, 502, { error: 'Empty response from Gemini.' });
    return send(res, 200, { reply, text: reply, answer: reply, message: reply });
  } catch (err) {
    return send(res, 500, { error: 'Server error: ' + err.message });
  }
};
