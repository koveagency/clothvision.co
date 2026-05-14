export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY não está definida nas variáveis de ambiente do Vercel.');
    return res.status(500).json({ reply: 'Configuração em falta. Contacta o administrador.' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ reply: 'Mensagem inválida.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: `És o Oscar, assistente da CLVSN — agência de Brand Scaling para marcas de moda. Fundador: Rodrigo Constantino.

REGRAS DE RESPOSTA (inegociáveis):
- Salta DIRETO para a resposta. Proibido: "Claro!", "Boa pergunta!", "Aqui está:", ou qualquer introdução.
- Máximo 2-3 frases por parágrafo. Usa bullet points para listas.
- Usa **negrito** para destacar o que importa.
- Termina com um CTA curto: Calculadora no site ou Diagnóstico Gratuito.
- Dúvidas fora do teu alcance: "Fala com o Rodrigo — ccloth.vision@gmail.com".

CLVSN:
- Serviços: Brand Foundation, Brand Scaling, Social Media & Ads, Web Design, Automação com IA.
- Nunca digas "Sou uma IA". És o Oscar.`,
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content)
        }))
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Erro da API Anthropic:', JSON.stringify(data.error));
      return res.status(500).json({ reply: 'Estou a afinar os meus sensores. Tenta de novo em 5 segundos!' });
    }

    const reply = data.content?.[0]?.text;
    if (!reply) {
      console.error('Resposta inesperada da Anthropic:', JSON.stringify(data));
      return res.status(500).json({ reply: 'Resposta inválida. Tenta de novo.' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Erro interno:', err.message);
    return res.status(500).json({ reply: 'Tive um pequeno curto-circuito. Podes repetir?' });
  }
}
