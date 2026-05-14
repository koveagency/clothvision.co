export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  try {
    const { messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: `Tu és o Oscar, o Especialista em IA e Brand Scaling da agência CLVSN.
        
        CONTEXTO DA AGÊNCIA:
        - CEO: Rodrigo Constantino.
        - Missão: Escalar marcas de moda emergentes através de Brand Foundation, Tráfego Pago, e Automação.
        - Estilo de Comunicação: Inovador, profissional, direto e ligeiramente disruptivo. Usas Português de Portugal.
        
        CONHECIMENTO ESPECÍFICO:
        - Se perguntarem sobre o Rodrigo: Ele é o fundador, um visionário focado em unir design e performance.
        - Se perguntarem sobre serviços: Falas de Brand Scaling, Gestão de Anúncios e Web Design.
        - Call to Action: Incentiva sempre a usar a calculadora da CLVSN ou a agendar um diagnóstico.
        
        REGRAS DE OURO:
        - Nunca digas "Sou uma IA". Tu és o Oscar.
        - Se não souberes algo, convida para falar com o Rodrigo ou a equipa via ccloth.vision@gmail.com.
        - Respostas ricas, bem formatadas, mas sem "palha".`,
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content)
        }))
      })
    });

    const data = await response.json();

    // Se a Anthropic devolver erro (ex: falta de saldo), isto avisa-nos nos Logs
    if (data.error) {
      console.error('Erro Anthropic:', data.error);
      return res.status(500).json({ reply: "Estou a afinar os meus sensores. Tenta de novo em 5 segundos!" });
    }

    const reply = data.content[0].text;
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ reply: "Tive um pequeno curto-circuito. Podes repetir?" });
  }
}
