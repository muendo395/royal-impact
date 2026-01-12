// server.js
// Minimal Express server that proxies /api/openai -> OpenAI Chat Completions
//
// Install: npm install express node-fetch cors
// Usage: OPENAI_API_KEY=sk-... node server.js
//
// Note: Keep your OpenAI key secret. Do not put it in client-side code.

const express = require('express');
const fetch = require('node-fetch'); // v2 style; on Node 18+ you can use global fetch instead
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('Please set OPENAI_API_KEY environment variable.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/openai', async (req, res) => {
  try {
    const userMessage = (req.body && req.body.message) || '';
    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'Please provide a message string in the request body.' });
    }

    // Build chat messages - include an optional system prompt
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: userMessage },
    ];

    const payload = {
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('OpenAI error:', r.status, text);
      return res.status(502).json({ error: 'OpenAI error', details: text });
    }

    const data = await r.json();
    // Safety: guard for expected shape
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || null;
    if (!reply) {
      console.error('Unexpected OpenAI response:', JSON.stringify(data));
      return res.status(502).json({ error: 'Unexpected OpenAI response', raw: data });
    }

    return res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});
