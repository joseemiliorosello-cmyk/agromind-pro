export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const data = await response.json();
    const modelos = data.models?.map(m => m.name) || [];
    res.status(200).json({ result: modelos.join('\n') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
