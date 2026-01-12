// Chatbot.js
// Minimal chat UI + client for a backend endpoint at /api/openai that proxies to OpenAI.
// Expected backend contract: POST /api/openai { message: "user message" } -> { reply: "assistant reply" }

(function () {
  // Configuration
  const API_URL = '/api/openai';
  const WIDGET_ID = 'chatbot-container';
  const THEME_COLOR = '#2b6cb0';

  // Utility: create element with attrs
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.keys(attrs).forEach((k) => {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') Object.assign(e.style, attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    children.forEach((c) => (typeof c === 'string' ? e.appendChild(document.createTextNode(c)) : e.appendChild(c)));
    return e;
  }

  function getOrCreateContainer() {
    let container = document.getElementById(WIDGET_ID);
    if (container) return container;

    container = el('div', {
      id: WIDGET_ID,
      style: {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        width: '360px',
        maxHeight: '70vh',
        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
        borderRadius: '10px',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        zIndex: 9999,
      },
    });

    document.body.appendChild(container);
    return container;
  }

  function injectStyles() {
    const styleId = 'chatbot-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #${WIDGET_ID} .chat-header {
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:10px 12px;
        background:${THEME_COLOR};
        color:white;
      }
      #${WIDGET_ID} .chat-messages {
        height:360px;
        overflow:auto;
        padding:10px;
        background: #f7fafc;
        display:flex;
        flex-direction:column;
        gap:8px;
      }
      #${WIDGET_ID} .message {
        max-width:85%;
        padding:8px 10px;
        border-radius:10px;
        line-height:1.3;
        word-wrap:break-word;
        white-space:pre-wrap;
      }
      #${WIDGET_ID} .message.user {
        align-self:flex-end;
        background: #bee3f8;
        color:#032f4a;
      }
      #${WIDGET_ID} .message.bot {
        align-self:flex-start;
        background: white;
        color:#111827;
        border: 1px solid #e2e8f0;
      }
      #${WIDGET_ID} .chat-input {
        display:flex;
        gap:8px;
        padding:10px;
        background: white;
      }
      #${WIDGET_ID} .chat-input textarea {
        flex:1;
        resize:none;
        min-height:40px;
        max-height:120px;
        padding:8px;
        border-radius:6px;
        border:1px solid #e2e8f0;
        font-family:inherit;
      }
      #${WIDGET_ID} .chat-input button {
        background:${THEME_COLOR};
        color:white;
        border:none;
        padding:8px 12px;
        border-radius:6px;
        cursor:pointer;
      }
      #${WIDGET_ID} .chat-footer {
        font-size:12px;
        color:#6b7280;
        padding:6px 10px;
        background:#fff;
      }
      #${WIDGET_ID} .error {
        color:crimson;
        font-weight:600;
      }
    `;
    document.head.appendChild(style);
  }

  function buildUI(container) {
    container.innerHTML = ''; // clear

    const header = el('div', { class: 'chat-header' }, [
      el('div', {}, [el('strong', {}, ['Chat'])]),
      el('button', { 'aria-label': 'Minimize', title: 'Minimize', style: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' } }, ['—']),
    ]);

    const messages = el('div', { class: 'chat-messages', id: `${WIDGET_ID}-messages` }, []);
    const inputArea = el('div', { class: 'chat-input' }, [
      el('textarea', { id: `${WIDGET_ID}-input`, placeholder: 'Type a message and press Enter' }),
      el('button', { id: `${WIDGET_ID}-send` }, ['Send']),
    ]);
    const footer = el('div', { class: 'chat-footer' }, ['Using OpenAI via /api/openai']);

    container.appendChild(header);
    container.appendChild(messages);
    container.appendChild(inputArea);
    container.appendChild(footer);

    return { header, messages, inputArea, footer };
  }

  function appendMessage(messagesEl, text, who = 'bot', extraClass = '') {
    const msg = el('div', { class: `message ${who} ${extraClass}` }, [text]);
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  async function sendToApi(message) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Server responded ${res.status} ${res.statusText}: ${text}`);
    }
    const json = await res.json();
    if (typeof json.reply === 'string') return json.reply;
    throw new Error('Invalid response format from server. Expected JSON with a "reply" string.');
  }

  function wireEvents() {
    const input = document.getElementById(`${WIDGET_ID}-input`);
    const sendBtn = document.getElementById(`${WIDGET_ID}-send`);
    const messagesEl = document.getElementById(`${WIDGET_ID}-messages`);

    let sending = false;

    async function submitMessage() {
      if (sending) return;
      const text = input.value.trim();
      if (!text) return;
      sending = true;
      input.value = '';
      appendMessage(messagesEl, text, 'user');

      const loading = appendMessage(messagesEl, '...', 'bot');

      try {
        const reply = await sendToApi(text);
        loading.textContent = reply;
      } catch (err) {
        loading.textContent = 'Error: ' + (err.message || 'Failed to send');
        loading.classList.add('error');
        console.error('Chatbot error:', err);
      } finally {
        sending = false;
        input.focus();
      }
    }

    sendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitMessage();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitMessage();
      }
    });
  }

  function init() {
    const container = getOrCreateContainer();
    injectStyles();
    buildUI(container);
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual init or testing
  window.RoyalImpactChatbot = { init };
})();
