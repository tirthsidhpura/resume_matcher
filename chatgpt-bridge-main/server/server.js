const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 }      = require('uuid');

const { buildCompletion, writeSSEStream } = require('./adapter');

const PORT = Number(process.env.PORT || 4000);
const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json({ limit: '4mb' }));

let extensionSocket = null;
const pending = new Map();

wss.on('connection', (socket) => {
  console.log('[Bridge] Chrome extension connected');
  extensionSocket = socket;

  socket.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return; }

    if (msg.type !== 'CHAT_RESPONSE') return;

    const entry = pending.get(msg.requestId);
    if (!entry) return;

    clearTimeout(entry.timeoutHandle);
    pending.delete(msg.requestId);

    if (msg.error) {
      entry.reject(new Error(msg.error));
    } else {
      entry.resolve({ response: msg.response, toolCalls: msg.toolCalls });
    }
  });

  socket.on('close', () => {
    console.log('[Bridge] Extension disconnected');
    extensionSocket = null;
    for (const [id, entry] of pending) {
      clearTimeout(entry.timeoutHandle);
      entry.reject(new Error('Chrome extension disconnected mid-request'));
      pending.delete(id);
    }
  });
});

function askExtension(payload, timeoutMs = 180_000) {
  return new Promise((resolve, reject) => {
    if (!extensionSocket || extensionSocket.readyState !== 1) {
      return reject(new Error(
        'Chrome extension is not connected. ' +
        'Make sure the ChatGPT API Bridge extension is installed and ChatGPT is open in a tab.'
      ));
    }

    const requestId = payload.requestId;
    const timeoutHandle = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Request timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    pending.set(requestId, { resolve, reject, timeoutHandle });
    extensionSocket.send(JSON.stringify({ type: 'CHAT_REQUEST', ...payload }));
  });
}

app.get('/', (req, res) => res.json({ status: 'ok', service: 'chatgpt-api-bridge' }));

app.get('/v1/models', (_req, res) => {
  const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o3-mini', 'o1-mini'];
  res.json({
    object: 'list',
    data: models.map(id => ({
      id,
      object: 'model',
      created: 1715367049,
      owned_by: 'chatgpt-bridge',
    })),
  });
});

app.post('/v1/chat/completions', async (req, res) => {
  const {
    messages,
    tools,
    tool_choice,
    model    = 'gpt-4o',
    stream   = false,
    max_tokens,
    temperature,
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: { message: '`messages` must be a non-empty array', type: 'invalid_request_error' },
    });
  }

  const requestId = uuidv4();

  try {
    const { response, toolCalls } = await askExtension({
      requestId,
      messages,
      tools: tools || [],
      tool_choice,
      model,
    });

    if (stream) {
      await writeSSEStream(res, model, response, toolCalls);
    } else {
      res.json(buildCompletion(model, response, toolCalls));
    }
  } catch (err) {
    const status = err.message.includes('not connected') ? 503 : 500;
    res.status(status).json({
      error: {
        message: err.message,
        type: status === 503 ? 'service_unavailable' : 'server_error',
        code:  'bridge_error',
      },
    });
  }
});

server.listen(PORT, () => {
  console.log(`\nChatGPT API Bridge`);
  console.log(`──────────────────────────────────────────`);
  console.log(`Listening on      http://localhost:${PORT}`);
  console.log(`OpenAI endpoint   http://localhost:${PORT}/v1/chat/completions`);
  console.log(`Models endpoint   http://localhost:${PORT}/v1/models`);
  console.log(`──────────────────────────────────────────`);
  console.log(`Waiting for Chrome extension to connect...\n`);
});
