export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        }
      }
    );
    const data = await response.json();
    const gratuitos = data.data
      ?.filter(m => m.pricing?.prompt === '0')
      ?.map(m => m.id) || [];
    res.status(200).json({ result: gratuitos.join('\n') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
