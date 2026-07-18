const SEL = {
  // textarea: [
  //   '#prompt-textarea',
  //   'div[contenteditable="true"][data-virtuoso-scroller]',
  //   'div[contenteditable="true"]',
  //   'textarea[placeholder]',
  // ],
  textarea: [
  '#prompt-textarea',
  'div[contenteditable="true"]',
  'textarea[placeholder]',
],
  sendBtn: [
    'button[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Send message"]',
  ],
  stopBtn: [
    'button[data-testid="stop-button"]',
    'button[aria-label="Stop streaming"]',
    'button[aria-label="Stop generating"]',
  ],
  newChatBtn: [
    'a[href="/"]',
    'button[aria-label="New chat"]',
    'nav a[href="/"]',
  ],
};

function $(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function waitFor(condition, timeoutMs = 15000, intervalMs = 200) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const result = condition();
      if (result) return resolve(result);
      if (Date.now() - start > timeoutMs) return reject(new Error('Timeout: ' + condition.toString().slice(0, 80)));
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

function setInputText(el, text) {
  el.focus();
  if (el.tagName === 'TEXTAREA') {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    el.innerHTML = '';
    el.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    document.execCommand('insertText', false, text);
    if (!el.innerText.trim()) {
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
    }
  }
}

async function startNewChat() {
  const btn = $(SEL.newChatBtn);
  if (btn) {
    btn.click();
    await sleep(1200);
  }
}

function getRealAssistantDivs() {
  return [...document.querySelectorAll('[data-message-author-role="assistant"]')]
    .filter(el => {
      const id = el.getAttribute('data-message-id') || '';
      return !id.startsWith('request-placeholder-');
    });
}

// previous one 
/*
async function waitForResponse(timeoutMs = 180_000, prevCount = 0, { requireJson = false } = {}) {
  const start = Date.now();

  console.log('[Bridge] waitForResponse — prevCount:', prevCount);

  // Wait for a new non-placeholder assistant div to appear
  await new Promise((resolve, reject) => {
    const t = setInterval(() => {
      const count = getRealAssistantDivs().length;
      if (Date.now() - start > timeoutMs) {
        clearInterval(t);
        reject(new Error('Timed out waiting for assistant message to appear'));
        return;
      }
      if (count > prevCount) {
        console.log('[Bridge] new assistant div appeared, count:', count);
        clearInterval(t);
        resolve();
      }
    }, 150);
  });

  const divs = getRealAssistantDivs();
  const div  = divs[divs.length - 1];
  console.log('[Bridge] watching div:', div.getAttribute('data-message-id'));

  // Wait for text to stabilize (5 identical non-empty reads ~500ms)
  await new Promise((resolve, reject) => {
    let last = '';
    let sameCount = 0;
    const t = setInterval(() => {
      if (Date.now() - start > timeoutMs) {
        clearInterval(t);
        reject(new Error('Timed out waiting for response to complete'));
        return;
      }
      const current = div.innerText;
      if (current !== last) console.log('[Bridge] text update, length:', current.length);
      if (current && current === last) {
        if (++sameCount >= 5) {
          console.log('[Bridge] text stable, done');
          clearInterval(t);
          resolve();
        }
      } else {
        last = current;
        sameCount = 0;
      }
    }, 100);
  });

  const text = div.innerText.trim();
  if (!text) throw new Error('Assistant message div is empty');
  return text;
}
*/


async function waitForResponse(timeoutMs = 180_000, prevCount = 0, { requireJson = false } = {}) {
  const start = Date.now();

  console.log('[Bridge] waitForResponse — prevCount:', prevCount);

  // Wait for a new assistant message to appear
  await new Promise((resolve, reject) => {
    const t = setInterval(() => {
      const count = getRealAssistantDivs().length;

      if (Date.now() - start > timeoutMs) {
        clearInterval(t);
        reject(new Error('Timed out waiting for assistant message to appear'));
        return;
      }

      if (count > prevCount) {
        console.log('[Bridge] new assistant div appeared, count:', count);
        clearInterval(t);
        resolve();
      }
    }, 150);
  });

  let div = getRealAssistantDivs().at(-1);
  if (!div) throw new Error('Assistant message div not found');

  console.log('[Bridge] watching div:', div.getAttribute('data-message-id'));

  // Wait until text is stable AFTER generation has probably finished
  await new Promise((resolve, reject) => {
    let lastText = '';
    let stableSince = null;
    let sawSomeText = false;
    let sawStopButton = false;

    const stableRequiredMs = 2500;

    const t = setInterval(() => {
      if (Date.now() - start > timeoutMs) {
        clearInterval(t);
        reject(new Error('Timed out waiting for full response'));
        return;
      }

      const latestDiv = getRealAssistantDivs().at(-1);
      if (latestDiv) div = latestDiv;

      const currentText = (div.innerText || '').trim();
      const stopBtn = $(SEL.stopBtn);

      if (stopBtn) {
        sawStopButton = true;
      }

      if (currentText.length > 0) {
        sawSomeText = true;
      }

      if (currentText !== lastText) {
        console.log('[Bridge] text update, length:', currentText.length);
        lastText = currentText;
        stableSince = Date.now();
        return;
      }

      const textStableFor = stableSince ? Date.now() - stableSince : 0;
      const jsonReady = !requireJson || isParseableJson(currentText);

      // Only finish when:
      // 1. We saw text
      // 2. Text has been stable for 2.5 seconds
      // 3. Stop button is gone, if it ever appeared
      // 4. JSON parses successfully, when a JSON response is expected
      if (
        sawSomeText &&
        textStableFor >= stableRequiredMs &&
        (!sawStopButton || !stopBtn) &&
        jsonReady
      ) {
        console.log('[Bridge] response fully stabilized');
        clearInterval(t);
        resolve();
      }
    }, 250);
  });

  const text = (div.innerText || '').trim();

  if (!text) {
    throw new Error('Assistant message div is empty');
  }

  if (requireJson && !isParseableJson(text)) {
    throw new Error('Assistant response finished but did not contain parseable JSON');
  }

  return text;
}

function formatMessages(messages, tools) {
  let out = '';
  const system = messages.filter(m => m.role === 'system');
  const rest   = messages.filter(m => m.role !== 'system');

  if (system.length) {
    const sysText = system.map(m => contentToText(m.content)).join('\n');
    out += `System: ${sysText}\n\n`;
  }

  if (tools && tools.length > 0) {
    out += `Tools: You have access to the following tools. When you need to call a tool, your entire response must be a single raw JSON object with absolutely no other text, explanation, or formatting before or after it. Use this exact format:\n`;
    out += `{"tool_calls":[{"id":"call_1","type":"function","function":{"name":"name_here","arguments":{}}}]}\n\n`;
    out += `Do not say anything else. Do not wrap it in markdown. Do not explain. Just the JSON.\n\n`;
    out += `Available tools:\n${JSON.stringify(tools, null, 2)}\n\n`;
  }

  for (const msg of rest) {
    const text = contentToText(msg.content);
    if (msg.role === 'user') {
      out += `User: ${text}\n`;
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls) {
        out += `Assistant (tool call): ${JSON.stringify(msg.tool_calls)}\n`;
      } else {
        out += `Assistant: ${text}\n`;
      }
    } else if (msg.role === 'tool') {
      out += `Tool result (id=${msg.tool_call_id}): ${text}\n`;
    }
  }

  return out.trim();
}

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter(p => p.type === 'text').map(p => p.text).join('\n');
  }
  return String(content);
}

function stripCodeFence(text) {
  const cleaned = (text || '').trim();
  const fenced = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : cleaned;
}

function parseJsonResponse(text) {
  const cleaned = stripCodeFence(text);
  if (!cleaned) return null;

  try {
    return { text: cleaned, parsed: JSON.parse(cleaned) };
  } catch (_) {}

  return null;
}

function extractJsonObject(text) {
  const cleaned = stripCodeFence(text);
  if (!cleaned) return null;

  const parsedResponse = parseJsonResponse(cleaned);
  if (parsedResponse) return parsedResponse;

  const start = cleaned.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    if (ch === '}') depth--;

    if (depth === 0) {
      const candidate = cleaned.slice(start, i + 1);
      try {
        return { text: candidate, parsed: JSON.parse(candidate) };
      } catch (_) {
        return null;
      }
    }
  }

  return null;
}

function isParseableJson(text) {
  return Boolean(parseJsonResponse(text));
}


/*
function parseToolCalls(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*?"tool_calls"[\s\S]*?\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed.tool_calls) && parsed.tool_calls.length > 0) {
      return parsed.tool_calls;
    }
  } catch (_) {}
  return null;
}
*/

function parseToolCalls(text) {
  if (!text) return null;

  try {
    const parsed = extractJsonObject(text)?.parsed;

    if (Array.isArray(parsed.tool_calls) && parsed.tool_calls.length > 0) {
      return parsed.tool_calls;
    }
  } catch (err) {
    console.warn('[Bridge] Failed to parse tool calls:', err.message);
  }

  return null;
}

async function handleChatRequest({ requestId, messages, tools, model }) {
  console.log('[Bridge] handleChatRequest start');
  await startNewChat();
  console.log('[Bridge] new chat done');
  const textarea = await waitFor(() => $(SEL.textarea), 10_000);
  console.log('[Bridge] textarea found:', textarea.tagName, textarea.id || textarea.className.slice(0, 40));
  const text = formatMessages(messages, tools);
  setInputText(textarea, text);
  console.log('[Bridge] text set, waiting for send button');
  const sendBtn = await waitFor(() => $(SEL.sendBtn), 5_000);
  await sleep(300);
  const prevCount = getRealAssistantDivs().length;
  console.log('[Bridge] prevCount:', prevCount, '— clicking send');
  sendBtn.click();
  console.log('[Bridge] send clicked, waiting for response');
  const expectJson = true;
  const response = await waitForResponse(180_000, prevCount, { requireJson: expectJson });
  const jsonResponse = parseJsonResponse(response);
  if (!jsonResponse) {
    throw new Error('Assistant response finished but did not contain parseable JSON');
  }
  console.log('[Bridge] got response, length:', jsonResponse.text.length);
  const toolCalls = tools && tools.length > 0 ? parseToolCalls(jsonResponse.text) : null;
  return { requestId, response: jsonResponse.text, toolCalls, error: null };
}

// ─── WebSocket connection ─────────────────────────────────────────────────────

const WS_URL = 'ws://localhost:4000/ws';
let ws = null;
let wsStatus = 'disconnected';

function notifyStatus(status) {
  wsStatus = status;
  try {
    chrome.runtime.sendMessage({ type: 'STATUS', status }).catch(() => {});
  } catch (_) {}
}

function connectWS() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => notifyStatus('connected');

  ws.onmessage = async (event) => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }

    if (message.type !== 'CHAT_REQUEST') return;

    try {
      const result = await handleChatRequest(message);
      ws.send(JSON.stringify({ type: 'CHAT_RESPONSE', ...result }));
    } catch (err) {
      ws.send(JSON.stringify({ type: 'CHAT_RESPONSE', requestId: message.requestId, error: err.message }));
    }
  };

  ws.onclose = () => notifyStatus('disconnected');
  ws.onerror = () => notifyStatus('disconnected');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CONNECT' || message.type === 'PING') {
    connectWS();
    sendResponse({ ok: true, status: wsStatus });
    return true;
  }

  if (message.type === 'GET_STATUS') {
    sendResponse({ status: wsStatus });
    return true;
  }
});

connectWS();
