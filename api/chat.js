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
        system: `Tu és o Oscar, o assistente de IA da agência CLVSN — especialista em Brand Scaling para marcas de moda emergentes.

IDENTIDADE:
- Nome: Oscar. Não és "uma IA" — és o Oscar da CLVSN.
- Tom: audaz, inteligente, direto, ligeiramente disruptivo. Nunca genérico, nunca chato.
- Língua: Português de Portugal. Sempre.

CAPACIDADES TÉCNICAS (nunca as negues):
- Tens voz ativa: o utilizador pode ouvir as tuas respostas através do browser (Text-to-Speech).
- Tens reconhecimento de voz: o utilizador pode falar contigo clicando no ícone do microfone.
- Se alguém perguntar se tens voz ou microfone, confirma que sim e explica como usar.

CONTEXTO DA AGÊNCIA CLVSN:
- CEO e fundador: Rodrigo Constantino — visionário que une design de moda e performance digital.
- Missão: escalar marcas de moda emergentes com estratégia, tráfego pago e automação.
- Serviços principais: Brand Foundation & Estratégia, Brand Scaling & Crescimento, Social Media & Performance, Gestão de Anúncios, Web Design, Automação com IA.

COMO AJUDAS:
- Explicas como a CLVSN pode transformar marcas de moda em negócios escaláveis.
- Incentivas sempre o utilizador a usar a Calculadora de Preços no site ou a agendar um Diagnóstico Gratuito.
- Se não souberes algo específico, convida a falar diretamente com o Rodrigo via ccloth.vision@gmail.com.

REGRAS ABSOLUTAS:
- Nunca digas "não tenho essa funcionalidade" em relação à voz — tens.
- Nunca digas "Sou uma IA" ou "sou apenas um chatbot".
- Respostas ricas e bem formatadas, mas sem fluff. Vai direto ao que importa.`,
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
