(function () {
  const API_URL = '/api/chat';
  let isVoiceInput = false;
  let welcomeShown = false;

  // Pré-carrega vozes TTS o mais cedo possível
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  // ── TTS: Oscar fala ──────────────────────────────────────────────────────────
  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    function doSpeak() {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang === 'pt-PT' || v.lang === 'pt_PT');
      if (preferred) utterance.voice = preferred;
      utterance.lang = 'pt-PT';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    }
  }

  // ── CSS ──────────────────────────────────────────────────────────────────────
  const css = `
  #clvsn-chat-btn {
    position:fixed; bottom:32px; right:32px; z-index:8888;
    width:56px; height:56px; border-radius:50%;
    background:#00b5f8; border:none; outline:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 8px 24px rgba(0,181,248,.5);
    transition:transform .2s, box-shadow .2s;
  }
  #clvsn-chat-btn:hover { transform:scale(1.1); box-shadow:0 12px 32px rgba(0,181,248,.7); }
  #clvsn-chat-btn svg { width:26px; height:26px; fill:#001627; }

  #clvsn-chat-panel {
    position:fixed; bottom:100px; right:32px; z-index:8889;
    width:380px; max-height:600px;
    background:#001627; border:1px solid rgba(0,181,248,.15);
    border-radius:24px; overflow:hidden;
    box-shadow:0 24px 60px rgba(0,0,0,.8);
    display:none; flex-direction:column;
  }
  #clvsn-chat-panel.open { display:flex; }

  .chat-header {
    padding:20px 24px;
    background:rgba(0,43,73,.6);
    border-bottom:1px solid rgba(0,181,248,.08);
    display:flex; align-items:center; justify-content:space-between;
    flex-shrink:0;
  }
  .chat-avatar {
    width:36px; height:36px; border-radius:50%;
    background:#00b5f8;
    display:flex; align-items:center; justify-content:center;
    font-size:16px; font-weight:700; color:#001627;
  }
  .chat-status {
    width:8px; height:8px; border-radius:50%; background:#22c55e;
    display:inline-block; margin-left:6px;
    animation: statusPulse 2s ease-in-out infinite;
  }
  @keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:.4} }

  .chat-messages {
    flex:1; overflow-y:auto; padding:20px 16px;
    display:flex; flex-direction:column; gap:12px;
    height:360px;
    scrollbar-width:thin; scrollbar-color:rgba(0,181,248,.2) transparent;
  }
  .msg { display:flex; flex-direction:column; max-width:85%; }
  .msg.bot { align-self:flex-start; }
  .msg.user { align-self:flex-end; }
  .msg-bubble {
    padding:10px 14px; border-radius:16px;
    font-size:13px; line-height:1.6;
    animation: bubbleIn .25s ease;
  }
  @keyframes bubbleIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .msg.bot .msg-bubble {
    background:rgba(0,43,73,.7); color:#f0f4f8;
    border-bottom-left-radius:4px;
    border:1px solid rgba(0,181,248,.1);
  }
  .msg.user .msg-bubble {
    background:#00b5f8; color:#001627;
    font-weight:500; border-bottom-right-radius:4px;
  }

  .typing-indicator {
    display:flex; gap:5px; padding:12px 14px;
    background:rgba(0,43,73,.7); border-radius:16px;
    border-bottom-left-radius:4px;
    border:1px solid rgba(0,181,248,.1);
    align-self:flex-start; width:fit-content;
  }
  .typing-indicator span {
    width:6px; height:6px; border-radius:50%; background:#00b5f8;
    animation:typingDot 1.2s ease-in-out infinite;
  }
  .typing-indicator span:nth-child(2) { animation-delay:.2s; }
  .typing-indicator span:nth-child(3) { animation-delay:.4s; }
  @keyframes typingDot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

  .chat-input-row {
    padding:12px 16px;
    background:rgba(0,0,0,.3);
    display:flex; align-items:center; gap:8px;
    border-top:1px solid rgba(0,181,248,.08);
    flex-shrink:0;
  }
  .chat-input {
    flex:1; background:rgba(0,43,73,.4);
    border:1px solid rgba(0,181,248,.12); border-radius:20px;
    padding:10px 16px; color:#f0f4f8; outline:none;
    font-size:13px; font-family:inherit;
    resize:none; height:40px; max-height:100px;
    transition:border-color .2s;
  }
  .chat-input:focus { border-color:rgba(0,181,248,.4); }
  .chat-input::placeholder { color:rgba(240,244,248,.35); }

  #micBtn {
    background:none; border:none; cursor:pointer; padding:6px;
    display:flex; align-items:center; justify-content:center;
    border-radius:50%; transition:background .2s;
    flex-shrink:0;
  }
  #micBtn:hover { background:rgba(0,181,248,.1); }
  #micBtn svg { width:20px; height:20px; fill:#00b5f8; transition:fill .2s; }
  #micBtn.listening { background:rgba(255,71,87,.15); }
  #micBtn.listening svg { fill:#ff4757; animation:micPulse .8s ease-in-out infinite; }
  @keyframes micPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  #micBtn.unsupported { opacity:.3; cursor:not-allowed; }

  #chatSend {
    background:none; border:none; cursor:pointer; padding:6px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:transform .15s;
  }
  #chatSend:hover { transform:scale(1.15); }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────────────────────────
  const btn = document.createElement('button');
  btn.id = 'clvsn-chat-btn';
  btn.setAttribute('aria-label', 'Abrir chat com Oscar');
  btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>`;
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'clvsn-chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="chat-avatar">◈</div>
        <div>
          <div style="color:#fff;font-weight:700;font-size:14px;line-height:1.2;">
            Oscar <span class="chat-status"></span>
          </div>
          <div style="color:rgba(255,255,255,.45);font-size:11px;">CLVSN · Brand Scaling AI</div>
        </div>
      </div>
      <button id="chatClose" style="background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:20px;padding:4px;line-height:1;" aria-label="Fechar">✕</button>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-row">
      <button id="micBtn" title="Clica para falar">
        <svg viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>
      <textarea class="chat-input" id="chatInput" placeholder="Escreve ou clica no mic..." rows="1"></textarea>
      <button id="chatSend" aria-label="Enviar">
        <svg viewBox="0 0 24 24" width="20" fill="#00b5f8"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>`;
  document.body.appendChild(panel);

  // ── Referências ───────────────────────────────────────────────────────────────
  const chatMessages = document.getElementById('chatMessages');
  const chatInput    = document.getElementById('chatInput');
  const chatSend     = document.getElementById('chatSend');
  const chatClose    = document.getElementById('chatClose');
  const micBtn       = document.getElementById('micBtn');

  // ── Boas-vindas automáticas ──────────────────────────────────────────────────
  function mdToHtml(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br>');
  }

  function showWelcome() {
    const bDiv = document.createElement('div');
    bDiv.className = 'msg bot';
    bDiv.innerHTML = `<div class="msg-bubble">
      Olá! Sou o <b>Oscar</b>, assistente da CLVSN.<br><br>
      Fala comigo sobre serviços, orçamentos ou estratégia de marca. Em que posso ajudar?
    </div>`;
    chatMessages.appendChild(bDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ── Indicador de digitação ───────────────────────────────────────────────────
  function showTyping() {
    const t = document.createElement('div');
    t.className = 'typing-indicator';
    t.id = 'typingIndicator';
    t.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(t);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function hideTyping() {
    const t = document.getElementById('typingIndicator');
    if (t) t.remove();
  }

  // ── Enviar mensagem ──────────────────────────────────────────────────────────
  async function sendMsg(text) {
    if (!text.trim()) return;

    const uDiv = document.createElement('div');
    uDiv.className = 'msg user';
    uDiv.innerHTML = `<div class="msg-bubble">${text.replace(/</g,'&lt;')}</div>`;
    chatMessages.appendChild(uDiv);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    showTyping();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] })
      });
      const data = await res.json();
      hideTyping();

      const bDiv = document.createElement('div');
      bDiv.className = 'msg bot';
      bDiv.innerHTML = `<div class="msg-bubble">${mdToHtml(data.reply || 'Erro na resposta.')}</div>`;
      chatMessages.appendChild(bDiv);

      // TTS desativado — Oscar responde apenas por texto
    } catch (e) {
      hideTyping();
      const eDiv = document.createElement('div');
      eDiv.className = 'msg bot';
      eDiv.innerHTML = '<div class="msg-bubble">Erro de ligação. Verifica a tua internet.</div>';
      chatMessages.appendChild(eDiv);
    }

    isVoiceInput = false;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ── Speech Recognition (STT) ─────────────────────────────────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-PT';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      isVoiceInput = true;
      micBtn.classList.remove('listening');
      sendMsg(transcript);
    };

    recognition.onerror = () => {
      micBtn.classList.remove('listening');
      isVoiceInput = false;
    };

    recognition.onend = () => {
      micBtn.classList.remove('listening');
    };

    micBtn.onclick = () => {
      if (micBtn.classList.contains('listening')) {
        recognition.stop();
        micBtn.classList.remove('listening');
      } else {
        micBtn.classList.add('listening');
        recognition.start();
      }
    };
  } else {
    micBtn.classList.add('unsupported');
    micBtn.title = 'Reconhecimento de voz não suportado neste browser';
    micBtn.onclick = null;
  }

  // ── Event listeners ──────────────────────────────────────────────────────────
  btn.onclick = () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !welcomeShown) {
      welcomeShown = true;
      showWelcome();
    }
  };

  chatClose.onclick = () => panel.classList.remove('open');

  chatSend.onclick = () => {
    isVoiceInput = false;
    sendMsg(chatInput.value);
  };

  // Enter envia | Shift+Enter cria nova linha
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      isVoiceInput = false;
      sendMsg(chatInput.value);
    }
  });
})();
