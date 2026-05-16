async function getChatGPTTab() {
  const tabs = await chrome.tabs.query({ url: 'https://chatgpt.com/*' });
  if (!tabs.length) return null;
  return tabs.find(t => t.active) || tabs[0];
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    await new Promise(r => setTimeout(r, 500));
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CONNECT_REQUEST') {
    getChatGPTTab().then(async tab => {
      if (!tab) {
        sendResponse({ ok: false, error: 'no_tab' });
        return;
      }
      try {
        await ensureContentScript(tab.id);
        await chrome.tabs.sendMessage(tab.id, { type: 'CONNECT' });
        sendResponse({ ok: true });
      } catch (err) {
        console.error('[Bridge] CONNECT_REQUEST failed:', err.message);
        sendResponse({ ok: false, error: err.message });
      }
    });
    return true;
  }

  if (message.type === 'STATUS_REQUEST') {
    getChatGPTTab().then(async tab => {
      if (!tab) {
        sendResponse({ status: 'disconnected' });
        return;
      }
      try {
        const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
        sendResponse({ status: res?.status ?? 'disconnected' });
      } catch {
        sendResponse({ status: 'disconnected' });
      }
    });
    return true;
  }
});
