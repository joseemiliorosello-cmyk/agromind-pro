export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { prompt, systemPrompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt requerido' });
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt || '' }]
          },
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096
          }
        })
      }
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Error Gemini API');
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';
    res.status(200).json({ result: text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
