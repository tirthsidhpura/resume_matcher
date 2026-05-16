const { v4: uuidv4 } = require('uuid');

function buildCompletion(model, response, toolCalls) {
  const id = `chatcmpl-${uuidv4()}`;
  const created = Math.floor(Date.now() / 1000);

  const message = { role: 'assistant', content: null };

  if (toolCalls && toolCalls.length > 0) {
    message.content    = null;
    message.tool_calls = normalizeToolCalls(toolCalls);
  } else {
    message.content = response;
  }

  return {
    id,
    object: 'chat.completion',
    created,
    model,
    choices: [
      {
        index: 0,
        message,
        finish_reason: toolCalls && toolCalls.length ? 'tool_calls' : 'stop',
        logprobs: null,
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

async function writeSSEStream(res, model, response, toolCalls) {
  const id      = `chatcmpl-${uuidv4()}`;
  const created = Math.floor(Date.now() / 1000);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  function sendChunk(delta, finishReason = null) {
    const chunk = {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta, finish_reason: finishReason, logprobs: null }],
    };
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  sendChunk({ role: 'assistant', content: '' });

  if (toolCalls && toolCalls.length > 0) {
    const normalized = normalizeToolCalls(toolCalls);
    for (let i = 0; i < normalized.length; i++) {
      const tc = normalized[i];
      sendChunk({
        tool_calls: [
          {
            index: i,
            id:   tc.id,
            type: 'function',
            function: { name: tc.function.name, arguments: tc.function.arguments },
          },
        ],
      });
    }
    sendChunk({}, 'tool_calls');
  } else {
    const words = (response || '').split(/(?<=\s)|(?=\s)/);
    for (const word of words) {
      if (word) sendChunk({ content: word });
    }
    sendChunk({}, 'stop');
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

function normalizeToolCalls(toolCalls) {
  return toolCalls.map((tc, i) => {
    const fnName = tc.function?.name ?? tc.name ?? 'unknown';
    const fnArgs = tc.function?.arguments ?? tc.arguments ?? {};
    const argsStr = typeof fnArgs === 'string' ? fnArgs : JSON.stringify(fnArgs);

    return {
      id:   tc.id || `call_${uuidv4()}`,
      type: 'function',
      function: { name: fnName, arguments: argsStr },
    };
  });
}

module.exports = { buildCompletion, writeSSEStream };
