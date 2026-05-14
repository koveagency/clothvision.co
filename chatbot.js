/* CLVSN Chatbot Widget — inclui no final do body de cada página */
(function () {
  // ── CONFIG ──────────────────────────────────────────────────────────────
  // Substitui pelo URL da tua Supabase Edge Function quando estiver pronta
  const EDGE_FUNCTION_URL = 'https://SEU_PROJETO.supabase.co/functions/v1/clvsn-chat';
  const ANON_KEY = 'SEU_ANON_KEY'; // Supabase public anon key

  // ── STYLES ──────────────────────────────────────────────────────────────
  const css = `
  #clvsn-chat-btn{
    position:fixed;bottom:32px;right:32px;z-index:8888;
    width:56px;height:56px;border-radius:50%;
    background:#00b5f8;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;box-shadow:0 8px 24px rgba(0,181,248,.5);
    transition:transform .2s,box-shadow .2s;
    border:none;outline:none;
  }
  #clvsn-chat-btn:hover{transform:scale(1.1);box-shadow:0 12px 32px rgba(0,181,248,.7)}
  #clvsn-chat-btn svg{width:26px;height:26px;fill:#001627}
  #clvsn-chat-btn .notif{
    position:absolute;top:-2px;right:-2px;
    width:14px;height:14px;background:#ff4757;
    border-radius:50%;border:2px solid #000;
    display:none;
  }
  #clvsn-chat-btn.has-notif .notif{display:block;}

  #clvsn-chat-panel{
    position:fixed;bottom:100px;right:32px;z-index:8889;
    width:380px;max-height:600px;
    background:#001627;
    border:1px solid rgba(0,181,248,.15);
    border-radius:24px;overflow:hidden;
    box-shadow:0 24px 60px rgba(0,0,0,.8);
    display:flex;flex-direction:column;
    opacity:0;transform:translateY(20px) scale(.95);
    pointer-events:none;
    transition:opacity .3s cubic-bezier(.16,1,.3,1),transform .3s cubic-bezier(.16,1,.3,1);
  }
  #clvsn-chat-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}

  .chat-header{
    padding:20px 24px;
    background:rgba(0,43,73,.6);
    border-bottom:1px solid rgba(0,181,248,.08);
    display:flex;align-items:center;justify-content:space-between;
  }
  .chat-header-info{display:flex;align-items:center;gap:12px;}
  .chat-avatar{
    width:36px;height:36px;border-radius:50%;
    background:#00b5f8;
    display:flex;align-items:center;justify-content:center;
    font-size:16px;
  }
  .chat-header-name{font-size:14px;font-weight:600;color:#f0f4f8;letter-spacing:.5px;}
  .chat-header-status{font-size:11px;color:#00b5f8;display:flex;align-items:center;gap:5px;}
  .chat-status-dot{width:6px;height:6px;border-radius:50%;background:#00b5f8;animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .chat-close{
    background:none;border:none;color:rgba(180,180,180,.5);
    font-size:20px;cursor:pointer;padding:4px;
    transition:color .2s;
  }
  .chat-close:hover{color:#f0f4f8}

  .chat-messages{
    flex:1;overflow-y:auto;padding:20px 16px;
    display:flex;flex-direction:column;gap:12px;
    scrollbar-width:thin;scrollbar-color:rgba(0,181,248,.2) transparent;
  }
  .chat-messages::-webkit-scrollbar{width:4px}
  .chat-messages::-webkit-scrollbar-thumb{background:rgba(0,181,248,.2);border-radius:4px}

  .msg{
    display:flex;flex-direction:column;max-width:85%;
    animation:msgIn .3s cubic-bezier(.16,1,.3,1);
  }
  @keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .msg.user{align-self:flex-end;align-items:flex-end;}
  .msg.bot{align-self:flex-start;align-items:flex-start;}
  .msg-bubble{
    padding:10px 14px;border-radius:16px;
    font-size:13px;line-height:1.55;
  }
  .msg.bot .msg-bubble{
    background:rgba(0,43,73,.6);
    border:1px solid rgba(0,181,248,.08);
    color:#f0f4f8;border-bottom-left-radius:4px;
  }
  .msg.user .msg-bubble{
    background:#00b5f8;color:#001627;
    font-weight:500;border-bottom-right-radius:4px;
  }
  .msg-time{font-size:10px;color:rgba(180,180,180,.35);margin-top:3px;padding:0 4px;}

  .typing-indicator{
    display:flex;gap:4px;align-items:center;
    padding:12px 14px;
    background:rgba(0,43,73,.6);border:1px solid rgba(0,181,248,.08);
    border-radius:16px;border-bottom-left-radius:4px;
    width:fit-content;
  }
  .typing-dot{
    width:6px;height:6px;border-radius:50%;background:rgba(0,181,248,.5);
    animation:typingDot 1.4s infinite;
  }
  .typing-dot:nth-child(2){animation-delay:.2s}
  .typing-dot:nth-child(3){animation-delay:.4s}
  @keyframes typingDot{0%,80%,100%{transform:scale(1);opacity:.5}40%{transform:scale(1.2);opacity:1}}

  .chat-suggestions{
    padding:8px 16px;display:flex;gap:8px;flex-wrap:wrap;
    border-top:1px solid rgba(0,181,248,.04);
  }
  .sug-btn{
    padding:6px 12px;border-radius:100px;
    background:rgba(0,181,248,.08);border:1px solid rgba(0,181,248,.12);
    color:rgba(0,181,248,.8);font-size:11px;cursor:pointer;
    transition:background .2s,border-color .2s;white-space:nowrap;
  }
  .sug-btn:hover{background:rgba(0,181,248,.15);border-color:rgba(0,181,248,.3)}

  .chat-input-row{
    padding:14px 16px;
    background:rgba(0,0,0,.3);
    border-top:1px solid rgba(0,181,248,.06);
    display:flex;align-items:center;gap:10px;
  }
  .chat-input{
    flex:1;background:rgba(0,43,73,.4);border:1px solid rgba(0,181,248,.1);
    border-radius:100px;padding:10px 16px;
    color:#f0f4f8;font-family:'Inter',sans-serif;font-size:13px;
    outline:none;transition:border-color .2s;resize:none;height:40px;max-height:100px;
  }
  .chat-input:focus{border-color:rgba(0,181,248,.4)}
  .chat-input::placeholder{color:rgba(180,180,180,.4)}
  .chat-send{
    width:36px;height:36px;border-radius:50%;
    background:#00b5f8;border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    flex-shrink:0;transition:transform .2s,opacity .2s;
  }
  .chat-send:hover{transform:scale(1.05)}
  .chat-send:disabled{opacity:.4;cursor:not-allowed}
  .chat-send svg{width:16px;height:16px;fill:#001627}

  @media(max-width:480px){
    #clvsn-chat-panel{width:calc(100vw - 32px);right:16px;bottom:84px;}
    #clvsn-chat-btn{right:16px;bottom:16px;}
  }
  `;

  // ── DOM ─────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'clvsn-chat-btn';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>
    <div class="notif"></div>`;
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'clvsn-chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-info">
        <div class="chat-avatar">◈</div>
        <div>
          <div class="chat-header-name">CLVSN Assistant</div>
          <div class="chat-header-status"><span class="chat-status-dot"></span>Online</div>
        </div>
      </div>
      <button class="chat-close" id="chatClose">✕</button>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-suggestions" id="chatSugs">
      <button class="sug-btn" onclick="clvsnSuggest('Que serviços oferecem?')">Que serviços oferecem?</button>
      <button class="sug-btn" onclick="clvsnSuggest('Quanto custa?')">Quanto custa?</button>
      <button class="sug-btn" onclick="clvsnSuggest('Como funciona o diagnóstico?')">Diagnóstico gratuito?</button>
    </div>
    <div class="chat-input-row">
      <textarea class="chat-input" id="chatInput" placeholder="Escreve a tua mensagem..." rows="1"></textarea>
      <button class="chat-send" id="chatSend" disabled>
        <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#001627" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>`;
  document.body.appendChild(panel);

  // ── STATE ────────────────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  const history = [];

  const systemPrompt = `Tens o nome de "CLVSN Assistant". Representas a CLVSN (Cloth Vision), uma agência de marketing digital especializada em marcas de moda.

Sobre a CLVSN:
- Fundador/CEO: Rodrigo Constantino, Lisboa, Portugal
- Serviços: Brand Foundation, Brand Scaling, Social Media, Web Design, Conteúdo, IPGA, Automação, Mentorias
- Preços: Por projeto (750€–5.000€+), Mensalidade (300€–2.000€/mês), Manutenção (100€–500€/mês)
- Calculadora em: clothvision.co/calculadora
- Contacto: ccloth.vision@gmail.com

Regras:
- Responde SEMPRE em Português Europeu (Portugal), de forma profissional mas próxima
- Respostas curtas e diretas (máx 3 frases)
- Se perguntarem sobre preços, direciona para a calculadora ou para marcar um diagnóstico gratuito
- Se quiserem saber mais, direciona para marcar um diagnóstico: clothvision.co/contacto
- Nunca inventes números específicos — usa os ranges acima`;

  // ── FUNCTIONS ────────────────────────────────────────────────────────────
  function toggle() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    btn.classList.remove('has-notif');
    if (isOpen && history.length === 0) {
      setTimeout(() => addBotMsg('Olá! Sou o assistente da CLVSN. Como posso ajudar a tua marca hoje?'), 300);
    }
  }

  function addMsg(role, text) {
    const msgs = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
    const t = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${t}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function addBotMsg(text) {
    history.push({ role: 'assistant', content: text });
    addMsg('bot', text);
  }

  function showTyping() {
    const msgs = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.id = 'typingDiv';
    div.innerHTML = `<div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('typingDiv');
    if (t) t.remove();
  }

  async function sendMsg(text) {
    if (!text.trim() || isLoading) return;
    isLoading = true;
    document.getElementById('chatSend').disabled = true;
    document.getElementById('chatSugs').style.display = 'none';

    history.push({ role: 'user', content: text });
    addMsg('user', text);
    document.getElementById('chatInput').value = '';
    document.getElementById('chatInput').style.height = '40px';
    showTyping();

    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({ messages: history, system: systemPrompt })
      });
      const data = await res.json();
      removeTyping();
      const reply = data?.content?.[0]?.text || data?.message || 'Desculpa, não consegui responder. Tenta novamente.';
      addBotMsg(reply);
    } catch (e) {
      removeTyping();
      addBotMsg('Ocorreu um erro. Por favor contacta-nos em ccloth.vision@gmail.com.');
    }

    isLoading = false;
    document.getElementById('chatSend').disabled = false;
  }

  window.clvsnSuggest = function (text) {
    sendMsg(text);
  };

  // ── EVENTS ────────────────────────────────────────────────────────────────
  btn.addEventListener('click', toggle);
  document.getElementById('chatClose').addEventListener('click', toggle);
  document.getElementById('chatSend').addEventListener('click', () => {
    sendMsg(document.getElementById('chatInput').value);
  });

  const input = document.getElementById('chatInput');
  input.addEventListener('input', () => {
    input.style.height = '40px';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    document.getElementById('chatSend').disabled = !input.value.trim();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg(input.value);
    }
  });

  // Show notification after 8 seconds
  setTimeout(() => {
    if (!isOpen) btn.classList.add('has-notif');
  }, 8000);
})();
