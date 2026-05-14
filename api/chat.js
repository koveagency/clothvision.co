// Vercel serverless function — Oscar chatbot via Claude API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { messages } = req.body || {};
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 600,
        system: `Tu és o Oscar, o assistente inteligente da CLVSN (Cloth Vision), uma agência de Marketing Digital e Brand Scaling para moda.
        
        CONHECIMENTO CLVSN:
        - Missão: Profissionalizar marcas de moda emergentes (PMEs).
        - Serviços: Brand Foundation, Brand Scaling, Gestão de Redes Sociais, Web Design e Automação com IA.
        - História: Projeto criado pelo Rodrigo Constantino (12º TCSD) na Escola Damião de Goes, focado em resultados práticos.
        - Call to Action: Incentiva o uso da calculadora (https://calculadora-clvsn.netlify.app) ou agendamento de diagnóstico.

        REGRAS:
        - Responde SEMPRE em Português de Portugal, Inglês, ou Espanhol, conforme a língua que falam com ele.
        - Sê inovador, curto e direto.`,
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      })
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text || '';
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
