(function () {
  const API_URL = '/api/chat'; 
  let isVoiceInput = false;

  const css = `
  #clvsn-chat-btn{ position:fixed;bottom:32px;right:32px;z-index:8888; width:56px;height:56px;border-radius:50%; background:#00b5f8; display:flex;align-items:center;justify-content:center; cursor:pointer;box-shadow:0 8px 24px rgba(0,181,248,.5); transition:transform .2s; border:none; outline:none; }
  #clvsn-chat-btn:hover{transform:scale(1.1)}
  #clvsn-chat-btn svg{width:26px;height:26px;fill:#001627}
  #clvsn-chat-panel{ position:fixed;bottom:100px;right:32px;z-index:8889; width:380px;max-height:600px; background:#001627; border:1px solid rgba(0,181,248,.15); border-radius:24px;overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,.8); display:none; flex-direction:column; }
  #clvsn-chat-panel.open{display:flex;}
  .chat-header{ padding:20px 24px; background:rgba(0,43,73,.6); border-bottom:1px solid rgba(0,181,248,.08); display:flex;align-items:center;justify-content:space-between; }
  .chat-avatar{ width:36px;height:36px;border-radius:50%; background:#00b5f8; display:flex;align-items:center;justify-content:center; }
  .chat-messages{ flex:1;overflow-y:auto;padding:20px 16px; display:flex;flex-direction:column;gap:12px; height: 350px; }
  .msg-bubble{ padding:10px 14px;border-radius:16px; font-size:13px;line-height:1.55; }
  .msg.bot .msg-bubble{ background:rgba(0,43,73,.6); color:#f0f4f8; border-bottom-left-radius:4px; align-self: flex-start; }
  .msg.user .msg-bubble{ background:#00b5f8; color:#001627; font-weight:500; border-bottom-right-radius:4px; }
  .msg.user { align-self: flex-end; }
  .chat-input-row{ padding:14px 16px; background:rgba(0,0,0,.3); display:flex;align-items:center;gap:10px; }
  .chat-input{ flex:1;background:rgba(0,43,73,.4);border:1px solid rgba(0,181,248,.1); border-radius:100px;padding:10px 16px; color:#f0f4f8; outline:none; height:40px; resize:none; }
  #micBtn { background:none; border:none; cursor:pointer; padding:5px; display:flex; align-items:center; justify-content:center; }
  #micBtn svg { width:20px; height:20px; fill: #00b5f8; }
  #micBtn.listening svg { fill: #ff4757; }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'clvsn-chat-btn';
  btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>`;
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'clvsn-chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="chat-avatar">◈</div>
        <div style="color:#fff;font-weight:600;font-size:14px;">Oscar Assistant</div>
      </div>
      <button id="chatClose" style="background:none;border:none;color:#fff;cursor:pointer;font-size:18px;">✕</button>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-row">
      <button id="micBtn" title="Falar">
        <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
      </button>
      <textarea class="chat-input" id="chatInput" placeholder="Escreve ou fala..." rows="1"></textarea>
      <button id="chatSend" style="background:none;border:none;cursor:pointer;">
        <svg viewBox="0 0 24 24" width="20" fill="#00b5f8"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>`;
  document.body.appendChild(panel);

  async function sendMsg(text) {
    if (!text.trim()) return;
    const msgs = document.getElementById('chatMessages');
    const uDiv = document.createElement('div');
    uDiv.className = 'msg user';
    uDiv.innerHTML = `<div class="msg-bubble">${text}</div>`;
    msgs.appendChild(uDiv);
    document.getElementById('chatInput').value = '';

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] })
      });
      const data = await res.json();
      const bDiv = document.createElement('div');
      bDiv.className = 'msg bot';
      bDiv.innerHTML = `<div class="msg-bubble">${data.reply || 'Erro na resposta.'}</div>`;
      msgs.appendChild(bDiv);
      if (isVoiceInput && data.reply) {
        const ut = new SpeechSynthesisUtterance(data.reply);
        ut.lang = 'pt-PT';
        window.speechSynthesis.speak(ut);
      }
    } catch (e) {
      const eDiv = document.createElement('div');
      eDiv.className = 'msg bot';
      eDiv.innerHTML = '<div class="msg-bubble">Erro de ligação.</div>';
      msgs.appendChild(eDiv);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  btn.onclick = () => panel.classList.toggle('open');
  document.getElementById('chatClose').onclick = () => panel.classList.remove('open');
  document.getElementById('chatSend').onclick = () => { isVoiceInput = false; sendMsg(document.getElementById('chatInput').value); };
})();
